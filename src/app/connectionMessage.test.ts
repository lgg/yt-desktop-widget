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
});
