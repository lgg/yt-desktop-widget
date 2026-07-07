import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PlaybackController } from '@/domain/playback/controller';
import {
  GatewayError,
  type CompanionGateway,
  type DiscoveryInfo,
} from '@/domain/playback/types';

const availableDiscovery: DiscoveryInfo = {
  available: true,
  apiVersions: ['v1'],
  supportsRealtime: true,
  supportsSeek: true,
  usingBrowserBridge: false,
};

interface DeferredAuth {
  resolve?: () => void;
}

const createConnection = () => ({
  send: vi.fn(() => Promise.resolve()),
  disconnect: vi.fn(() => Promise.resolve()),
});

const createGateway = (completeAuth?: CompanionGateway['completeAuth']) => {
  let storedAuth = false;

  const gateway: CompanionGateway = {
    kind: 'real',
    discover: vi.fn(() => Promise.resolve(availableDiscovery)),
    hasStoredAuth: vi.fn(() => Promise.resolve(storedAuth)),
    connect: vi.fn(() =>
      Promise.resolve({
        initialState: null,
        connection: createConnection(),
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
      expect(controller.getSnapshot().connection.hasStoredAuth).toBe(true);
    });
  });

  it('connects after approval even when the auth probe still reports no stored token', async () => {
    const gateway = createGateway();
    vi.mocked(gateway.hasStoredAuth).mockResolvedValue(false);
    const controller = new PlaybackController(gateway);

    await controller.requestAuthCode();

    await waitFor(() => {
      const snapshot = controller.getSnapshot();
      expect(gateway.completeAuth).toHaveBeenCalledWith('2413');
      expect(gateway.connect).toHaveBeenCalledTimes(1);
      expect(snapshot.connection.status).toBe('connected');
      expect(snapshot.connection.hasStoredAuth).toBe(true);
      expect(snapshot.connection.authCode).toBeNull();
    });
  });

  it('retries a transient post-approval auth failure before returning to auth required', async () => {
    const gateway = createGateway();
    vi.mocked(gateway.hasStoredAuth).mockResolvedValue(false);
    vi.mocked(gateway.connect)
      .mockRejectedValueOnce(
        new GatewayError(
          'auth_required',
          'Companion authorization is required before the widget can connect.',
        ),
      )
      .mockResolvedValueOnce({
        initialState: null,
        connection: createConnection(),
      });
    const controller = new PlaybackController(gateway);

    await controller.requestAuthCode();

    await waitFor(() => {
      expect(gateway.connect).toHaveBeenCalledTimes(1);
      expect(gateway.connect).toHaveBeenLastCalledWith(
        expect.any(Object),
        { preserveAuthOnFailure: true },
      );
      expect(controller.getSnapshot().connection.status).toBe('reconnecting');
    });

    await waitFor(
      () => {
        expect(gateway.connect).toHaveBeenCalledTimes(2);
        expect(controller.getSnapshot().connection.status).toBe('connected');
      },
      { timeout: 1500 },
    );
  });

  it('uses the post-approval safe reconnect path for external auth changes', async () => {
    const gateway = createGateway();
    vi.mocked(gateway.hasStoredAuth).mockResolvedValue(false);
    vi.mocked(gateway.connect)
      .mockRejectedValueOnce(
        new GatewayError(
          'auth_required',
          'Companion authorization is required before the widget can connect.',
        ),
      )
      .mockResolvedValueOnce({
        initialState: null,
        connection: createConnection(),
      });
    const controller = new PlaybackController(gateway);

    await controller.handleExternalAuthChanged(true);

    await waitFor(() => {
      expect(gateway.connect).toHaveBeenCalledTimes(1);
      expect(gateway.connect).toHaveBeenLastCalledWith(
        expect.any(Object),
        { preserveAuthOnFailure: true },
      );
      expect(controller.getSnapshot().connection.status).toBe('reconnecting');
    });

    await waitFor(
      () => {
        expect(gateway.connect).toHaveBeenCalledTimes(2);
        expect(controller.getSnapshot().connection.status).toBe('connected');
      },
      { timeout: 1500 },
    );
  });

  it('clears local connection state for external auth clear events without clearing storage again', async () => {
    const disconnect = vi.fn(() => Promise.resolve());
    const gateway = createGateway();
    vi.mocked(gateway.hasStoredAuth).mockResolvedValue(true);
    vi.mocked(gateway.connect).mockResolvedValue({
      initialState: null,
      connection: {
        send: vi.fn(() => Promise.resolve()),
        disconnect,
      },
    });
    const controller = new PlaybackController(gateway);

    await controller.start();
    await controller.handleExternalAuthChanged(false);

    expect(disconnect).toHaveBeenCalled();
    expect(gateway.clearAuth).not.toHaveBeenCalled();
    expect(controller.getSnapshot().connection.status).toBe('auth_required');
    expect(controller.getSnapshot().connection.hasStoredAuth).toBe(false);
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
    const deferredAuth: DeferredAuth = {};
    const completeAuth = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          deferredAuth.resolve = resolve;
        }),
    );
    const gateway = createGateway(completeAuth);
    const controller = new PlaybackController(gateway);

    await controller.requestAuthCode();
    const secondAttempt = controller.completeAuthentication();

    await waitFor(() => {
      expect(completeAuth).toHaveBeenCalledTimes(1);
      expect(deferredAuth.resolve).toBeDefined();
    });

    deferredAuth.resolve?.();
    await secondAttempt;
  });

  it('can dispose a frontend listener without closing the shared backend connection', async () => {
    const disconnect = vi.fn(() => Promise.resolve());
    const gateway = createGateway();
    vi.mocked(gateway.hasStoredAuth).mockResolvedValue(true);
    vi.mocked(gateway.connect).mockResolvedValue({
      initialState: null,
      connection: {
        send: vi.fn(() => Promise.resolve()),
        disconnect,
      },
    });
    const controller = new PlaybackController(gateway);

    await controller.start();
    await controller.dispose({ disconnectGateway: false });

    expect(disconnect).toHaveBeenCalledWith({ closeBackend: false });
  });
});
