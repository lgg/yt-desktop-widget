import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompanionEventPayload } from '@/integration/companion/tauriBridge';

type ListenToCiderEvents = (
  handler: (payload: CompanionEventPayload) => void,
) => Promise<() => void>;

const bridgeMocks = vi.hoisted(() => ({
  listenToCiderEvents: vi.fn<ListenToCiderEvents>(() =>
    Promise.resolve(vi.fn()),
  ),
  ciderConnect: vi.fn(() =>
    Promise.resolve({
      initialState: {
        capabilities: { canMute: true },
        player: { volume: 42 },
      },
    }),
  ),
  ciderDisconnect: vi.fn(() => Promise.resolve()),
  ciderDiscover: vi.fn(() =>
    Promise.resolve({
      available: true,
      apiVersions: ['Cider API v1'],
      supportsRealtime: true,
      supportsSeek: true,
      usingBrowserBridge: false,
    }),
  ),
  ciderHasAuth: vi.fn(() => Promise.resolve(true)),
  ciderStoreAuth: vi.fn(() => Promise.resolve()),
  ciderClearAuth: vi.fn(() => Promise.resolve()),
  ciderSendCommand: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/integration/companion/tauriBridge', () => ({
  tauriBridge: bridgeMocks,
}));
vi.mock('@/utils/runtime', () => ({ isTauriRuntime: () => true }));

import { createCiderGateway } from '@/integration/cider/ciderGateway';

describe('createCiderGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bridgeMocks.listenToCiderEvents.mockResolvedValue(vi.fn());
    bridgeMocks.ciderSendCommand.mockResolvedValue(undefined);
    bridgeMocks.ciderDisconnect.mockResolvedValue(undefined);
  });

  it('forwards mute/unmute and routes authoritative native volume events', async () => {
    const event = { current: null as ((payload: CompanionEventPayload) => void) | null };
    bridgeMocks.listenToCiderEvents.mockImplementationOnce((handler) => {
      event.current = handler;
      return Promise.resolve(vi.fn());
    });
    const handlers = {
      onState: vi.fn(),
      onDisconnected: vi.fn(),
      onError: vi.fn(),
      onConnected: vi.fn(),
    };
    const result = await createCiderGateway().connect(handlers);

    await result.connection.send({ type: 'mute' });
    await result.connection.send({ type: 'unmute' });
    expect(bridgeMocks.ciderSendCommand).toHaveBeenNthCalledWith(1, {
      type: 'mute',
    });
    expect(bridgeMocks.ciderSendCommand).toHaveBeenNthCalledWith(2, {
      type: 'unmute',
    });

    event.current?.({
      kind: 'state',
      state: {
        capabilities: { canMute: true },
        player: { volume: 0 },
      },
    });
    expect(handlers.onState).toHaveBeenCalledWith({
      capabilities: { canMute: true },
      player: { volume: 0 },
    });
  });

  it('unsubscribes one window without stopping the shared native adapter', async () => {
    const unlisten = vi.fn();
    bridgeMocks.listenToCiderEvents.mockResolvedValueOnce(unlisten);
    const result = await createCiderGateway().connect({
      onState: vi.fn(),
      onDisconnected: vi.fn(),
      onError: vi.fn(),
      onConnected: vi.fn(),
    });

    await result.connection.disconnect({ closeBackend: false });

    expect(unlisten).toHaveBeenCalledOnce();
    expect(bridgeMocks.ciderDisconnect).not.toHaveBeenCalled();
  });
});
