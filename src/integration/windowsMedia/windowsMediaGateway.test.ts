import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WindowsMediaEventPayload } from '@/integration/companion/tauriBridge';

type ListenToWindowsMediaEvents = (
  handler: (payload: WindowsMediaEventPayload) => void,
) => Promise<() => void>;

const bridgeMocks = vi.hoisted(() => ({
  listenToWindowsMediaEvents: vi.fn<ListenToWindowsMediaEvents>(() =>
    Promise.resolve(vi.fn()),
  ),
  windowsMediaConnect: vi.fn(() => Promise.resolve({ initialState: null })),
  windowsMediaDisconnect: vi.fn(() => Promise.resolve()),
  windowsMediaDiscover: vi.fn(() =>
    Promise.resolve({
      available: true,
      apiVersions: ['Windows.Media.Control'],
      supportsRealtime: true,
      supportsSeek: true,
      usingBrowserBridge: false,
    }),
  ),
  windowsMediaSendCommand: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/integration/companion/tauriBridge', () => ({
  tauriBridge: bridgeMocks,
}));
vi.mock('@/utils/runtime', () => ({ isTauriRuntime: () => true }));

import { createWindowsMediaGateway } from '@/integration/windowsMedia/windowsMediaGateway';

describe('createWindowsMediaGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bridgeMocks.listenToWindowsMediaEvents.mockResolvedValue(vi.fn());
    bridgeMocks.windowsMediaConnect.mockResolvedValue({ initialState: null });
    bridgeMocks.windowsMediaDisconnect.mockResolvedValue(undefined);
    bridgeMocks.windowsMediaSendCommand.mockResolvedValue(undefined);
  });

  it('ignores rating and mute commands while forwarding supported transport commands', async () => {
    const gateway = createWindowsMediaGateway();
    const result = await gateway.connect({
      onState: vi.fn(),
      onDisconnected: vi.fn(),
      onError: vi.fn(),
      onConnected: vi.fn(),
    });

    await result.connection.send({ type: 'toggleLike' });
    await result.connection.send({ type: 'toggleDislike' });
    await result.connection.send({ type: 'mute' });
    await result.connection.send({ type: 'unmute' });
    expect(bridgeMocks.windowsMediaSendCommand).not.toHaveBeenCalled();

    await result.connection.send({ type: 'playPause' });
    expect(bridgeMocks.windowsMediaSendCommand).toHaveBeenCalledOnce();
    expect(bridgeMocks.windowsMediaSendCommand).toHaveBeenCalledWith({
      type: 'playPause',
    });
  });

  it('removes its event listener without stopping the shared backend when requested', async () => {
    const unlisten = vi.fn();
    bridgeMocks.listenToWindowsMediaEvents.mockResolvedValueOnce(unlisten);
    const gateway = createWindowsMediaGateway();
    const result = await gateway.connect({
      onState: vi.fn(),
      onDisconnected: vi.fn(),
      onError: vi.fn(),
      onConnected: vi.fn(),
    });

    await result.connection.disconnect({ closeBackend: false });

    expect(unlisten).toHaveBeenCalledOnce();
    expect(bridgeMocks.windowsMediaDisconnect).not.toHaveBeenCalled();
  });

  it('removes its event listener if native connection setup fails', async () => {
    const unlisten = vi.fn();
    bridgeMocks.listenToWindowsMediaEvents.mockResolvedValueOnce(unlisten);
    bridgeMocks.windowsMediaConnect.mockRejectedValueOnce({
      code: 'api_unavailable',
      message: 'Unavailable',
    });
    const gateway = createWindowsMediaGateway();

    await expect(
      gateway.connect({
        onState: vi.fn(),
        onDisconnected: vi.fn(),
        onError: vi.fn(),
        onConnected: vi.fn(),
      }),
    ).rejects.toMatchObject({ code: 'api_unavailable' });
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('routes native status and state events through the gateway contract', async () => {
    const emitEventRef: {
      current: ((payload: WindowsMediaEventPayload) => void) | null;
    } = { current: null };
    bridgeMocks.listenToWindowsMediaEvents.mockImplementationOnce((handler) => {
      emitEventRef.current = handler;
      return Promise.resolve(vi.fn());
    });
    const handlers = {
      onState: vi.fn(),
      onDisconnected: vi.fn(),
      onError: vi.fn(),
      onConnected: vi.fn(),
    };
    const gateway = createWindowsMediaGateway();
    await gateway.connect(handlers);

    emitEventRef.current?.({
      kind: 'status',
      status: 'socket_open',
      detail: null,
    });
    emitEventRef.current?.({
      kind: 'state',
      state: { video: { id: 'track-1' } },
    });
    emitEventRef.current?.({
      kind: 'status',
      status: 'socket_error',
      detail: 'Interrupted',
    });

    expect(handlers.onConnected).toHaveBeenCalledOnce();
    expect(handlers.onState).toHaveBeenCalledWith({
      video: { id: 'track-1' },
    });
    expect(handlers.onError).toHaveBeenCalledWith('Interrupted');
  });
});
