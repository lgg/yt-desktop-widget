import { describe, expect, it, vi } from 'vitest';

const bridgeMocks = vi.hoisted(() => ({
  listenToWindowsMediaEvents: vi.fn(() => Promise.resolve(vi.fn())),
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
  it('ignores rating and mute commands while forwarding supported transport commands', async () => {
    bridgeMocks.windowsMediaSendCommand.mockClear();
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
});
