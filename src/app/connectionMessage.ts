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
      default:
        break;
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
): string | null =>
  connection.messageKey
    ? translateConnectionMessage(t, connection.messageKey, playbackSource)
    : null;
