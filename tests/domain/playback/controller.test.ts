import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PlaybackController } from '@/domain/playback/controller';
import type { CompanionGateway, DiscoveryInfo } from '@/domain/playback/types';

const availableDiscovery: DiscoveryInfo = {
  available: true,
  apiVersions: ['v1'],
  supportsRealtime: true,
  supportsSeek: true,
  usingBrowserBridge: false,
};

const createGateway = (completeAuth?: CompanionGateway['completeAuth']) => {
  let storedAuth = false;

  const gateway: CompanionGateway = {
    kind: 'real',
    discover: vi.fn(() => Promise.resolve(availableDiscovery)),
    hasStoredAuth: vi.fn(() => Promise.resolve(storedAuth)),
    connect: vi.fn(() =>
      Promise.resolve({
        initialState: null,
        connection: {
          send: vi.fn(() => Promise.resolve()),
          disconnect: vi.fn(() => Promise.resolve()),
        },
      }),
    ),
    requestAuthCode: vi.fn(() => Promise.resolve({ code: '2413' })),
    completeAuth:
      completeAuth ??
      vi.fn(() => {
        storedAuth = true;
        return Promise.resolve();
      }),
    clearAuth: vi.fn(() => {
      storedAuth = false;
      return Promise.resolve();
    }),
  };

  return gateway;
};

describe('PlaybackController auth flow', () => {
  it('starts Companion token exchange after generating a pairing code', async () => {
    const gateway = createGateway();
    const controller = new PlaybackController(gateway);

    await controller.requestAuthCode();

    await waitFor(() => {
      expect(gateway.completeAuth).toHaveBeenCalledWith('2413');
      expect(controller.getSnapshot().connection.status).toBe('connected');
    });
  });

  it('returns to an actionable auth state when Companion approval fails', async () => {
    const gateway = createGateway(
      vi.fn(() => Promise.reject(new Error('Pairing was denied or timed out.'))),
    );
    const controller = new PlaybackController(gateway);

    await controller.requestAuthCode();

    await waitFor(() => {
      const snapshot = controller.getSnapshot();
      expect(snapshot.connection.status).toBe('auth_required');
      expect(snapshot.connection.authCode).toBe('2413');
      expect(snapshot.connection.detail).toBe('Pairing was denied or timed out.');
    });
  });

  it('reuses the active token exchange when confirm is pressed again', async () => {
    let resolveAuth: (() => void) | null = null;
    const completeAuth = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAuth = resolve;
        }),
    );
    const gateway = createGateway(completeAuth);
    const controller = new PlaybackController(gateway);

    await controller.requestAuthCode();
    const secondAttempt = controller.completeAuthentication();

    await waitFor(() => {
      expect(completeAuth).toHaveBeenCalledTimes(1);
    });

    resolveAuth?.();
    await secondAttempt;
  });
});
