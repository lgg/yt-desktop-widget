import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlaybackController } from '@/domain/playback/controller';
import type {
  CompanionGateway,
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
});
