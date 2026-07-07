import type { ConnectionState, DiscoveryInfo } from '@/domain/playback/types';

export type ConnectionEvent =
  | { type: 'discovering'; hasStoredAuth: boolean; reconnecting: boolean }
  | { type: 'availability'; discovery: DiscoveryInfo; hasStoredAuth: boolean }
  | { type: 'connected'; hasStoredAuth?: boolean | undefined }
  | {
      type: 'auth_required';
      detail?: string | undefined;
      authCode?: string | null | undefined;
      hasStoredAuth?: boolean | undefined;
    }
  | { type: 'authenticating'; authCode: string }
  | { type: 'retry_scheduled'; retryAttempt: number; retryAt: number; detail: string }
  | { type: 'error'; message: string }
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
        lastError: undefined,
        retryAt: null,
        authCode: state.authCode,
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
        lastError: undefined,
      };
    case 'retry_scheduled':
      return {
        ...state,
        status: state.discovery?.available ? 'reconnecting' : 'disconnected',
        detail: event.detail,
        retryAttempt: event.retryAttempt,
        retryAt: event.retryAt,
      };
    case 'error':
      return {
        ...state,
        status: 'error',
        detail: event.message,
        lastError: event.message,
        retryAt: null,
      };
    case 'clear_auth':
      return {
        ...state,
        status: 'auth_required',
        hasStoredAuth: false,
        authCode: null,
        detail: undefined,
        retryAt: null,
      };
    default:
      return state;
  }
};