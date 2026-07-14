import { describe, expect, it } from 'vitest';

import { getConnectionMessage } from '@/app/connectionMessage';

describe('getConnectionMessage', () => {
  it('uses source-specific Windows Media Session recovery copy', () => {
    const message = getConnectionMessage(
      (key) => key,
      {
        status: 'error',
        hasStoredAuth: false,
        retryAttempt: 0,
        retryAt: null,
        messageKey: 'apiUnavailable',
      },
      'windowsMediaSession',
    );

    expect(message).toBe('windowsMediaConnectionMessages.apiUnavailable');
  });

  it('explains access denied as a restricted Windows launch context', () => {
    const message = getConnectionMessage(
      (key) => key,
      {
        status: 'disconnected',
        hasStoredAuth: false,
        retryAttempt: 1,
        retryAt: null,
        messageKey: 'notRunning',
        diagnostic: {
          stage: 'request_manager.await',
          hresult: '0x80070005',
          category: 'access_denied',
        },
      },
      'windowsMediaSession',
    );

    expect(message).toBe('windowsMediaConnectionMessages.accessDenied');
  });
});
