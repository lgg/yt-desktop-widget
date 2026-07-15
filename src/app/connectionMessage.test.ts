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

  it('uses Cider token guidance instead of Companion pairing copy', () => {
    const message = getConnectionMessage(
      (key) => key,
      {
        status: 'auth_required',
        hasStoredAuth: false,
        retryAttempt: 0,
        retryAt: null,
        messageKey: 'authRequired',
      },
      'cider',
    );

    expect(message).toBe('ciderConnectionMessages.authRequired');
  });

  it.each([
    ['storedAuthRejected', 'storedAuthRejected'],
    ['credentialNotPersisted', 'credentialNotPersisted'],
    ['credentialStorage', 'credentialStorage'],
    ['notRunning', 'notRunning'],
    ['apiUnavailable', 'apiUnavailable'],
    ['socketError', 'socketError'],
    ['socketClosed', 'socketClosed'],
    ['unexpected', 'unexpected'],
  ] as const)(
    'keeps Cider %s recovery inside the Cider message namespace',
    (messageKey, expectedKey) => {
      const message = getConnectionMessage(
        (key) => key,
        {
          status: 'error',
          hasStoredAuth: messageKey === 'storedAuthRejected',
          retryAttempt: 0,
          retryAt: null,
          messageKey,
        },
        'cider',
      );

      expect(message).toBe(`ciderConnectionMessages.${expectedKey}`);
    },
  );

  it('never falls back to Companion auth copy for Windows Media Session', () => {
    const message = getConnectionMessage(
      (key) => key,
      {
        status: 'auth_required',
        hasStoredAuth: false,
        retryAttempt: 0,
        retryAt: null,
        messageKey: 'authRequired',
      },
      'windowsMediaSession',
    );

    expect(message).toBe('windowsMediaConnectionMessages.unexpected');
  });
});
