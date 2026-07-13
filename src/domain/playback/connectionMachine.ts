import type {
  ConnectionMessageKey,
  ConnectionState,
  DiscoveryInfo,
} from '@/domain/playback/types';

export type ConnectionEvent =
  | {
      type: 'discovering';
      hasStoredAuth: boolean;
      reconnecting: boolean;
      authCode?: string | null | undefined;
    }
  | { type: 'availability'; discovery: DiscoveryInfo; hasStoredAuth: boolean }
  | { type: 'connected'; hasStoredAuth?: boolean | undefined }
  | {
      type: 'auth_required';
      detail?: string | undefined;
      messageKey?: ConnectionMessageKey | undefined;
      authCode?: string | null | undefined;
      hasStoredAuth?: boolean | undefined;
    }
  | { type: 'authenticating'; authCode: string }
  | {
      type: 'retry_scheduled';
      retryAttempt: number;
      retryAt: number;
      detail: string;
      messageKey?: ConnectionMessageKey | undefined;
    }
  | {
      type: 'error';
      message: string;
      messageKey?: ConnectionMessageKey | undefined;
      clearAuthCode?: boolean;
    }
  | { type: 'clear_auth' };

export const createInitialConnectionState = (): ConnectionState => ({
  status: 'discovering',
  hasStoredAuth: false,
  retryAttempt: 0,
  authCode: null,
  retryAt: null,
});

export const reduceConnectionState = (
  state: ConnectionState,
  event: ConnectionEvent,
): ConnectionState => {
  switch (event.type) {
    case 'discovering':
      return {
        ...state,
        status: event.reconnecting ? 'reconnecting' : 'discovering',
        hasStoredAuth: event.hasStoredAuth,
        detail: undefined,
        messageKey: undefined,
        lastError: undefined,
        retryAt: null,
        authCode:
          event.authCode === undefined ? state.authCode : event.authCode,
      };
    case 'availability':
      return {
        ...state,
        discovery: event.discovery,
        hasStoredAuth: event.hasStoredAuth,
        detail: event.discovery.detail,
      };
    case 'connected':
      return {
        ...state,
        status: 'connected',
        detail: undefined,
        messageKey: undefined,
        lastError: undefined,
        retryAttempt: 0,
        retryAt: null,
        authCode: null,
        hasStoredAuth: event.hasStoredAuth ?? state.hasStoredAuth,
      };
    case 'auth_required':
      return {
        ...state,
        status: 'auth_required',
        detail: event.detail,
        messageKey: event.messageKey,
        authCode: event.authCode ?? state.authCode ?? null,
        hasStoredAuth: event.hasStoredAuth ?? state.hasStoredAuth,
        retryAt: null,
      };
    case 'authenticating':
      return {
        ...state,
        status: 'authenticating',
        authCode: event.authCode,
        detail: undefined,
        messageKey: undefined,
        lastError: undefined,
      };
    case 'retry_scheduled':
      return {
        ...state,
        status: state.discovery?.available ? 'reconnecting' : 'disconnected',
        detail: event.detail,
        messageKey: event.messageKey,
        retryAttempt: event.retryAttempt,
        retryAt: event.retryAt,
      };
    case 'error':
      return {
        ...state,
        status: 'error',
        detail: event.message,
        messageKey: event.messageKey,
        lastError: event.message,
        authCode: event.clearAuthCode ? null : state.authCode,
        retryAt: null,
      };
    case 'clear_auth':
      return {
        ...state,
        status: 'auth_required',
        hasStoredAuth: false,
        authCode: null,
        detail: undefined,
        messageKey: undefined,
        retryAt: null,
      };
    default:
      return state;
  }
};
