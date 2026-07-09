import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GatewayError } from '@/domain/playback/types';
import type { CompanionEventPayload } from '@/integration/companion/tauriBridge';
import { createRealGateway } from '@/integration/companion/realGateway';
import { tauriBridge } from '@/integration/companion/tauriBridge';

const bridgeMock = vi.hoisted(() => ({
  eventHandler: null as ((payload: CompanionEventPayload) => void) | null,
  unlisten: vi.fn(),
}));

vi.mock('@/utils/runtime', () => ({
  isTauriRuntime: () => true,
}));

vi.mock('@/integration/companion/tauriBridge', () => ({
  tauriBridge: {
    companionDiscover: vi.fn(),
    companionHasAuth: vi.fn(),
    companionConnect: vi.fn(() => Promise.resolve({ initialState: null })),
    companionDisconnect: vi.fn(() => Promise.resolve()),
    companionRequestAuthCode: vi.fn(),
    companionCompleteAuth: vi.fn(),
    companionClearAuth: vi.fn(),
    companionSendCommand: vi.fn(),
    listenToCompanionEvents: vi.fn((handler: (payload: CompanionEventPayload) => void) => {
      bridgeMock.eventHandler = handler;
      return Promise.resolve(bridgeMock.unlisten);
    }),
  },
}));

describe('createRealGateway', () => {
  afterEach(() => {
    bridgeMock.eventHandler = null;
    bridgeMock.unlisten.mockClear();
    vi.mocked(tauriBridge.companionConnect).mockClear();
    vi.mocked(tauriBridge.companionDisconnect).mockClear();
    vi.mocked(tauriBridge.listenToCompanionEvents).mockClear();
  });

  it('reports realtime socket errors through the reconnect path only', async () => {
    const onDisconnected = vi.fn();
    const onError = vi.fn();
    const gateway = createRealGateway();

    await gateway.connect({
      onConnected: vi.fn(),
      onDisconnected,
      onError,
      onState: vi.fn(),
    });

    bridgeMock.eventHandler?.({
      kind: 'status',
      status: 'socket_error',
      detail: 'socket dropped',
    });

    expect(onDisconnected).toHaveBeenCalledWith('socket_error', 'socket dropped');
    expect(onError).not.toHaveBeenCalled();
  });

  it('preserves backend authorization-disabled errors', async () => {
    vi.mocked(tauriBridge.companionRequestAuthCode).mockRejectedValueOnce({
      code: 'authorization_disabled',
      message:
        'YTMDesktop says Companion authorization requests are disabled. Enable authorization requests in YTMDesktop Companion settings, then retry.',
    });
    const gateway = createRealGateway();

    let caughtError: GatewayError | null = null;
    try {
      await gateway.requestAuthCode();
    } catch (error) {
      caughtError = error as GatewayError;
    }

    expect(caughtError?.code).toBe('authorization_disabled');
    expect(caughtError?.message).toContain('authorization requests are disabled');
  });

  it('does not convert credential probe failures into not-authorized', async () => {
    vi.mocked(tauriBridge.companionHasAuth).mockRejectedValueOnce({
      code: 'credential_storage',
      message: 'Windows Credential Manager could not read the Companion credential.',
    });
    const gateway = createRealGateway();

    await expect(gateway.hasStoredAuth()).rejects.toMatchObject({
      code: 'credential_storage',
      message: 'Windows Credential Manager could not read the Companion credential.',
    });
  });
});
