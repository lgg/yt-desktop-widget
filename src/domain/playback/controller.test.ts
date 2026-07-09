import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlaybackController } from '@/domain/playback/controller';
import type {
  CompanionGateway,
  CompanionRawState,
  DiscoveryInfo,
  GatewayConnection,
  GatewayEventHandlers,
} from '@/domain/playback/types';

const makeDiscovery = (): DiscoveryInfo => ({
  available: true,
  apiVersions: ['v1'],
  supportsRealtime: true,
  supportsSeek: true,
  usingBrowserBridge: false,
  detail: 'Ready',
});

const makeRawState = (
  videoProgress: number,
  trackState = 1,
): CompanionRawState => ({
  player: {
    trackState,
    videoProgress,
  },
  video: {
    id: 'track-1',
    title: 'Night Train Window',
    author: 'Moseca Harbor',
    durationSeconds: 200,
    metadataFilled: true,
  },
});

describe('PlaybackController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('deduplicates repeated connected transitions during a successful connect', async () => {
    const connection: GatewayConnection = {
      send: vi.fn(() => Promise.resolve()),
      disconnect: vi.fn(() => Promise.resolve()),
    };

    const gateway: CompanionGateway = {
      kind: 'simulator',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() => Promise.resolve(true)),
      connect: vi.fn((handlers: GatewayEventHandlers) => {
        handlers.onConnected();
        return Promise.resolve({
          connection,
          initialState: null,
        });
      }),
      requestAuthCode: vi.fn(() => Promise.resolve({ code: 'DEV-OK' })),
      completeAuth: vi.fn(() => Promise.resolve()),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    const controller = new PlaybackController(gateway);
    const statuses: string[] = [];
    controller.subscribe((state) => {
      statuses.push(state.connection.status);
    });

    await controller.start();

    expect(statuses.filter((status) => status === 'connected')).toHaveLength(1);
    vi.useRealTimers();
  });

  it('suppresses progress-only realtime snapshots that match the local playback clock', async () => {
    let onState: GatewayEventHandlers['onState'] = () => undefined;
    const gateway: CompanionGateway = {
      kind: 'simulator',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() => Promise.resolve(true)),
      connect: vi.fn((handlers: GatewayEventHandlers) => {
        onState = handlers.onState;
        return Promise.resolve({
          connection: {
            send: vi.fn(() => Promise.resolve()),
            disconnect: vi.fn(() => Promise.resolve()),
          },
          initialState: makeRawState(25),
        });
      }),
      requestAuthCode: vi.fn(() => Promise.resolve({ code: 'DEV-OK' })),
      completeAuth: vi.fn(() => Promise.resolve()),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const controller = new PlaybackController(gateway);
    const snapshots: unknown[] = [];
    controller.subscribe((state) => snapshots.push(state));
    await controller.start();
    const countAfterInitialState = snapshots.length;

    vi.advanceTimersByTime(100);
    onState(makeRawState(25.05));

    expect(snapshots).toHaveLength(countAfterInitialState);
    expect(controller.getSnapshot().playback?.elapsedSeconds).toBe(50);
    vi.useRealTimers();
  });

  it('publishes playback-state changes immediately even when progress is unchanged', async () => {
    let onState: GatewayEventHandlers['onState'] = () => undefined;
    const gateway: CompanionGateway = {
      kind: 'simulator',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() => Promise.resolve(true)),
      connect: vi.fn((handlers: GatewayEventHandlers) => {
        onState = handlers.onState;
        return Promise.resolve({
          connection: {
            send: vi.fn(() => Promise.resolve()),
            disconnect: vi.fn(() => Promise.resolve()),
          },
          initialState: makeRawState(25),
        });
      }),
      requestAuthCode: vi.fn(() => Promise.resolve({ code: 'DEV-OK' })),
      completeAuth: vi.fn(() => Promise.resolve()),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    const controller = new PlaybackController(gateway);
    await controller.start();
    onState(makeRawState(25, 0));

    expect(controller.getSnapshot().playback?.playbackState).toBe('paused');
    vi.useRealTimers();
  });

  it('publishes significant progress corrections such as seeks', async () => {
    let onState: GatewayEventHandlers['onState'] = () => undefined;
    const gateway: CompanionGateway = {
      kind: 'simulator',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() => Promise.resolve(true)),
      connect: vi.fn((handlers: GatewayEventHandlers) => {
        onState = handlers.onState;
        return Promise.resolve({
          connection: {
            send: vi.fn(() => Promise.resolve()),
            disconnect: vi.fn(() => Promise.resolve()),
          },
          initialState: makeRawState(25),
        });
      }),
      requestAuthCode: vi.fn(() => Promise.resolve({ code: 'DEV-OK' })),
      completeAuth: vi.fn(() => Promise.resolve()),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const controller = new PlaybackController(gateway);
    await controller.start();

    vi.advanceTimersByTime(100);
    onState(makeRawState(60));

    expect(controller.getSnapshot().playback?.elapsedSeconds).toBe(120);
    vi.useRealTimers();
  });

  it('does not schedule reconnect after dispose when disconnect emits socket_closed', async () => {
    let handlersRef: GatewayEventHandlers | null = null;
    const gateway: CompanionGateway = {
      kind: 'simulator',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() => Promise.resolve(true)),
      connect: vi.fn((handlers: GatewayEventHandlers) => {
        handlersRef = handlers;
        return Promise.resolve({
          initialState: null,
          connection: {
            send: vi.fn(() => Promise.resolve()),
            disconnect: vi.fn(() => {
              handlersRef?.onDisconnected('socket_closed', 'Manual disconnect');
              return Promise.resolve();
            }),
          },
        });
      }),
      requestAuthCode: vi.fn(() => Promise.resolve({ code: 'DEV-OK' })),
      completeAuth: vi.fn(() => Promise.resolve()),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    const controller = new PlaybackController(gateway);
    await controller.start();
    await controller.dispose();

    vi.advanceTimersByTime(20_000);

    expect(gateway.connect).toHaveBeenCalledTimes(1);
    expect(gateway.discover).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('does not synthesize stored authorization after approval', async () => {
    const gateway: CompanionGateway = {
      kind: 'real',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() => Promise.resolve(false)),
      connect: vi.fn(() => Promise.reject(new Error('connect must not run'))),
      requestAuthCode: vi.fn(() => Promise.resolve({ code: '3601' })),
      completeAuth: vi.fn(() => Promise.resolve()),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    const controller = new PlaybackController(gateway);
    await controller.requestAuthCode();
    await vi.waitFor(() => {
      const snapshot = controller.getSnapshot();
      expect(snapshot.connection.status).toBe('error');
      expect(snapshot.connection.hasStoredAuth).toBe(false);
      expect(snapshot.connection.authCode).toBeNull();
      expect(gateway.connect).not.toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('surfaces credential probe failures after approval', async () => {
    const gateway: CompanionGateway = {
      kind: 'real',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() =>
        Promise.reject(
          Object.assign(new Error('Windows Credential Manager read failed.'), {
            code: 'credential_storage',
          }),
        ),
      ),
      connect: vi.fn(() => Promise.reject(new Error('connect must not run'))),
      requestAuthCode: vi.fn(() => Promise.resolve({ code: '3601' })),
      completeAuth: vi.fn(() => Promise.resolve()),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    const controller = new PlaybackController(gateway);
    await controller.requestAuthCode();
    await controller.completeAuthentication();

    const snapshot = controller.getSnapshot();
    expect(gateway.connect).not.toHaveBeenCalled();
    expect(snapshot.connection.status).toBe('error');
    expect(snapshot.connection.hasStoredAuth).toBe(false);
    expect(snapshot.connection.detail).toBe('Windows Credential Manager read failed.');
    expect(snapshot.connection.authCode).toBeNull();

    vi.useRealTimers();
  });

  it('does not turn a rejected stored token into an automatic pairing loop', async () => {
    const gateway: CompanionGateway = {
      kind: 'real',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() => Promise.resolve(true)),
      connect: vi.fn(() =>
        Promise.reject(Object.assign(new Error('Companion authorization is required.'), {
          code: 'auth_required',
        })),
      ),
      requestAuthCode: vi.fn(() => Promise.resolve({ code: '3601' })),
      completeAuth: vi.fn(() => Promise.resolve()),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    const controller = new PlaybackController(gateway);
    await controller.start();

    const snapshot = controller.getSnapshot();
    expect(snapshot.connection.status).toBe('error');
    expect(snapshot.connection.hasStoredAuth).toBe(true);
    expect(snapshot.connection.detail).toContain('stored Companion authorization');
    expect(gateway.clearAuth).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('does not retry a pairing code after YTMDesktop has consumed it', async () => {
    const gateway: CompanionGateway = {
      kind: 'real',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() => Promise.resolve(false)),
      connect: vi.fn(() =>
        Promise.resolve({
          connection: {
            send: vi.fn(() => Promise.resolve()),
            disconnect: vi.fn(() => Promise.resolve()),
          },
          initialState: null,
        }),
      ),
      requestAuthCode: vi.fn(() => Promise.resolve({ code: '3601' })),
      completeAuth: vi.fn(() =>
        Promise.reject(Object.assign(new Error('Authorization request denied.'), {
          code: 'auth_required',
        })),
      ),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    const controller = new PlaybackController(gateway);
    await controller.requestAuthCode();
    await Promise.resolve();
    await Promise.resolve();

    const snapshot = controller.getSnapshot();
    expect(snapshot.connection.status).toBe('error');
    expect(snapshot.connection.authCode).toBeNull();
    expect(snapshot.connection.hasStoredAuth).toBe(false);
    expect(gateway.completeAuth).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('shows an actionable error when pairing-code generation is disabled by YTMDesktop', async () => {
    const gateway: CompanionGateway = {
      kind: 'real',
      discover: vi.fn(() => Promise.resolve(makeDiscovery())),
      hasStoredAuth: vi.fn(() => Promise.resolve(false)),
      connect: vi.fn(() =>
        Promise.resolve({
          connection: {
            send: vi.fn(() => Promise.resolve()),
            disconnect: vi.fn(() => Promise.resolve()),
          },
          initialState: null,
        }),
      ),
      requestAuthCode: vi.fn(() =>
        Promise.reject(
          Object.assign(
            new Error(
              'YTMDesktop says Companion authorization requests are disabled. Enable authorization requests in YTMDesktop Companion settings, then retry.',
            ),
            { code: 'authorization_disabled' },
          ),
        ),
      ),
      completeAuth: vi.fn(() => Promise.resolve()),
      clearAuth: vi.fn(() => Promise.resolve()),
    };

    const controller = new PlaybackController(gateway);
    await controller.requestAuthCode();

    const snapshot = controller.getSnapshot();
    expect(snapshot.connection.status).toBe('error');
    expect(snapshot.connection.detail).toContain('authorization requests are disabled');
    expect(snapshot.connection.authCode).toBeNull();

    vi.useRealTimers();
  });
});
