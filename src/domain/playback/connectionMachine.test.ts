import { describe, expect, it } from 'vitest';

import {
  createInitialConnectionState,
  reduceConnectionState,
} from '@/domain/playback/connectionMachine';

describe('connectionMachine', () => {
  it('moves into auth required when discovery succeeds without stored auth', () => {
    const initial = createInitialConnectionState();
    const next = reduceConnectionState(initial, {
      type: 'auth_required',
      hasStoredAuth: false,
      detail: 'Authorize the widget first.',
    });

    expect(next.status).toBe('auth_required');
    expect(next.hasStoredAuth).toBe(false);
    expect(next.detail).toBe('Authorize the widget first.');
  });

  it('resets retry state after reconnect success', () => {
    const withRetry = reduceConnectionState(createInitialConnectionState(), {
      type: 'retry_scheduled',
      retryAttempt: 3,
      retryAt: Date.now() + 5_000,
      detail: 'Retrying soon.',
    });
    const connected = reduceConnectionState(withRetry, { type: 'connected' });

    expect(connected.status).toBe('connected');
    expect(connected.retryAttempt).toBe(0);
    expect(connected.retryAt).toBeNull();
    expect(connected.authCode).toBeNull();
  });

  it('retains safe Windows diagnostics while a reconnect is scheduled', () => {
    const diagnostic = {
      stage: 'request_manager.await',
      hresult: '0x80070005',
      category: 'access_denied',
    };
    const unavailable = reduceConnectionState(createInitialConnectionState(), {
      type: 'availability',
      hasStoredAuth: false,
      discovery: {
        available: false,
        apiVersions: [],
        supportsRealtime: false,
        supportsSeek: false,
        usingBrowserBridge: false,
        diagnostic,
      },
    });
    const retrying = reduceConnectionState(unavailable, {
      type: 'retry_scheduled',
      retryAttempt: 1,
      retryAt: Date.now() + 5_000,
      detail: 'Retrying soon.',
      diagnostic,
    });

    expect(unavailable.diagnostic).toEqual(diagnostic);
    expect(retrying.diagnostic).toEqual(diagnostic);
  });
});
