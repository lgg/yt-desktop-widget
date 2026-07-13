import type {
  ConnectionMessageKey,
  ConnectionState,
} from '@/domain/playback/types';

type Translate = (key: string) => string;

const translateConnectionMessage = (
  t: Translate,
  key: ConnectionMessageKey,
): string => {
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
): string | null =>
  connection.messageKey
    ? translateConnectionMessage(t, connection.messageKey)
    : null;
