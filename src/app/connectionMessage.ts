import type {
  ConnectionMessageKey,
  ConnectionState,
  PlaybackSource,
} from '@/domain/playback/types';

type Translate = (key: string) => string;

const translateConnectionMessage = (
  t: Translate,
  key: ConnectionMessageKey,
  playbackSource: PlaybackSource,
): string => {
  if (playbackSource === 'windowsMediaSession') {
    switch (key) {
      case 'notRunning':
        return t('windowsMediaConnectionMessages.notRunning');
      case 'apiUnavailable':
        return t('windowsMediaConnectionMessages.apiUnavailable');
      case 'socketError':
        return t('windowsMediaConnectionMessages.socketError');
      case 'socketClosed':
        return t('windowsMediaConnectionMessages.socketClosed');
      case 'unexpected':
        return t('windowsMediaConnectionMessages.unexpected');
      case 'authCodeReady':
      case 'authFailed':
      case 'authRequired':
      case 'storedAuthRejected':
      case 'credentialNotPersisted':
      case 'credentialStorage':
      case 'authorizationDisabled':
        return t('windowsMediaConnectionMessages.unexpected');
    }
  }

  if (playbackSource === 'cider') {
    switch (key) {
      case 'authCodeReady':
      case 'authRequired':
        return t('ciderConnectionMessages.authRequired');
      case 'authFailed':
      case 'storedAuthRejected':
        return t('ciderConnectionMessages.storedAuthRejected');
      case 'credentialNotPersisted':
        return t('ciderConnectionMessages.credentialNotPersisted');
      case 'credentialStorage':
        return t('ciderConnectionMessages.credentialStorage');
      case 'authorizationDisabled':
        return t('ciderConnectionMessages.apiUnavailable');
      case 'notRunning':
        return t('ciderConnectionMessages.notRunning');
      case 'apiUnavailable':
        return t('ciderConnectionMessages.apiUnavailable');
      case 'socketError':
        return t('ciderConnectionMessages.socketError');
      case 'socketClosed':
        return t('ciderConnectionMessages.socketClosed');
      case 'unexpected':
        return t('ciderConnectionMessages.unexpected');
    }
  }

  switch (key) {
    case 'authCodeReady':
      return t('connectionMessages.authCodeReady');
    case 'authFailed':
      return t('connectionMessages.authFailed');
    case 'authRequired':
      return t('connectionMessages.authRequired');
    case 'storedAuthRejected':
      return t('connectionMessages.storedAuthRejected');
    case 'credentialNotPersisted':
      return t('connectionMessages.credentialNotPersisted');
    case 'credentialStorage':
      return t('connectionMessages.credentialStorage');
    case 'authorizationDisabled':
      return t('connectionMessages.authorizationDisabled');
    case 'notRunning':
      return t('connectionMessages.notRunning');
    case 'apiUnavailable':
      return t('connectionMessages.apiUnavailable');
    case 'socketError':
      return t('connectionMessages.socketError');
    case 'socketClosed':
      return t('connectionMessages.socketClosed');
    case 'unexpected':
      return t('connectionMessages.unexpected');
  }
};

export const getConnectionMessage = (
  t: Translate,
  connection: ConnectionState,
  playbackSource: PlaybackSource = 'companion',
): string | null => {
  if (
    playbackSource === 'windowsMediaSession' &&
    connection.diagnostic?.category === 'access_denied'
  ) {
    return t('windowsMediaConnectionMessages.accessDenied');
  }

  return connection.messageKey
    ? translateConnectionMessage(t, connection.messageKey, playbackSource)
    : null;
};
