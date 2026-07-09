import {
  createInitialConnectionState,
  reduceConnectionState,
} from '@/domain/playback/connectionMachine';
import { mapCompanionState } from '@/domain/playback/mapping';
import type {
  CompanionGateway,
  ConnectionState,
  DiscoveryInfo,
  GatewayConnection,
  GatewayDisconnectOptions,
  GatewayDisconnectReason,
  GatewayError,
  PlaybackCommand,
  PlaybackSessionState,
} from '@/domain/playback/types';

const SOCKET_RECONNECT_DELAYS = [1250, 2500, 5000, 10000, 15000] as const;
const DISCOVERY_RECONNECT_DELAYS = [5000, 10000, 15000, 30000, 60000] as const;
const AUTH_CODE_READY_DETAIL =
  'Approve the matching Companion prompt in YTMDesktop. The widget will finish pairing automatically.';
const AUTH_FAILED_DETAIL =
  'Pairing was not completed. Generate a new code, then press Allow in YTMDesktop.';
const STORED_AUTH_REJECTED_DETAIL =
  'YTMDesktop rejected the stored Companion authorization. Reconnect to retry, or clear auth explicitly before pairing again.';
const CREDENTIAL_NOT_PERSISTED_DETAIL =
  'YTMDesktop approved pairing, but the credential storage did not retain the token. Generate a new code after resolving the storage error.';

interface BeginConnectOptions {
  requireStoredAuth?: boolean;
}

interface DisposeOptions {
  disconnectGateway?: boolean;
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error';
};

const getAuthFailureDetail = (error: unknown): string => {
  const message = toErrorMessage(error);
  return message === 'Unexpected error' ? AUTH_FAILED_DETAIL : message;
};

const getDelayForAttempt = (reason: GatewayDisconnectReason, attempt: number) => {
  const delays =
    reason === 'socket_closed' || reason === 'socket_error'
      ? SOCKET_RECONNECT_DELAYS
      : DISCOVERY_RECONNECT_DELAYS;

  return delays[Math.min(attempt, delays.length - 1)] ?? delays[delays.length - 1] ?? 15000;
};

const getRetryDetail = (reason: GatewayDisconnectReason, detail?: string) => {
  if (detail) {
    return detail;
  }

  switch (reason) {
    case 'not_running':
      return 'Waiting for YTMDesktop to start its Companion Server.';
    case 'api_unavailable':
      return 'Companion API is unavailable right now.';
    case 'socket_error':
      return 'Realtime link dropped. Retrying shortly.';
    case 'socket_closed':
    default:
      return 'Connection lost. Retrying shortly.';
  }
};

const areDiscoveriesEqual = (
  left?: DiscoveryInfo,
  right?: DiscoveryInfo,
): boolean => {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.available === right.available &&
    left.supportsRealtime === right.supportsRealtime &&
    left.supportsSeek === right.supportsSeek &&
    left.usingBrowserBridge === right.usingBrowserBridge &&
    left.detail === right.detail &&
    left.apiVersions.length === right.apiVersions.length &&
    left.apiVersions.every((version, index) => version === right.apiVersions[index])
  );
};

const areConnectionStatesEqual = (left: ConnectionState, right: ConnectionState): boolean =>
  left.status === right.status &&
  left.detail === right.detail &&
  left.authCode === right.authCode &&
  left.hasStoredAuth === right.hasStoredAuth &&
  left.retryAttempt === right.retryAttempt &&
  left.retryAt === right.retryAt &&
  left.lastError === right.lastError &&
  areDiscoveriesEqual(left.discovery, right.discovery);

export class PlaybackController {
  private state: PlaybackSessionState = {
    connection: createInitialConnectionState(),
    playback: null,
    lastKnownPlayback: null,
  };

  private readonly subscribers = new Set<(state: PlaybackSessionState) => void>();
  private connection: GatewayConnection | null = null;
  private reconnectTimer: number | null = null;
  private disposed = false;
  private authCode: string | null = null;
  private authCompletionCode: string | null = null;
  private authCompletionPromise: Promise<void> | null = null;

  constructor(private readonly gateway: CompanionGateway) {}

  subscribe(listener: (state: PlaybackSessionState) => void) {
    this.subscribers.add(listener);
    listener(this.state);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  getSnapshot() {
    return this.state;
  }

  async start() {
    await this.beginConnect(false);
  }

  async reconnectNow() {
    this.clearReconnectTimer();
    await this.disconnectInternal();
    await this.beginConnect(true);
  }

  async handleExternalAuthChanged(authorized: boolean) {
    if (authorized) {
      await this.reconnectAfterAuth();
      return;
    }

    this.clearReconnectTimer();
    await this.disconnectInternal();
    this.authCode = null;
    this.authCompletionCode = null;
    this.authCompletionPromise = null;
    this.patchConnection((state) => reduceConnectionState(state, { type: 'clear_auth' }));
  }

  async requestAuthCode() {
    try {
      const { code } = await this.gateway.requestAuthCode();
      this.authCode = code;
      this.patchConnection((state) =>
        reduceConnectionState(state, {
          type: 'auth_required',
          authCode: code,
          detail: AUTH_CODE_READY_DETAIL,
          hasStoredAuth: false,
        }),
      );

      void this.completeAuthentication().catch(() => undefined);
    } catch (error) {
      this.authCode = null;
      this.authCompletionCode = null;
      this.authCompletionPromise = null;
      this.patchConnection((state) =>
        reduceConnectionState(state, {
          type: 'error',
          message: getAuthFailureDetail(error),
        }),
      );
    }
  }

  async completeAuthentication() {
    if (!this.authCode) {
      await this.requestAuthCode();
      return;
    }

    await this.completeAuthCode(this.authCode);
  }

  async clearAuth() {
    await this.gateway.clearAuth();
    await this.disconnectInternal();
    this.authCode = null;
    this.authCompletionCode = null;
    this.authCompletionPromise = null;
    this.patchConnection((state) => reduceConnectionState(state, { type: 'clear_auth' }));
  }

  async sendCommand(command: PlaybackCommand) {
    await this.connection?.send(command);
  }

  async dispose(options: DisposeOptions = {}) {
    this.disposed = true;
    this.clearReconnectTimer();
    await this.disconnectInternal({ closeBackend: options.disconnectGateway ?? true });
    this.subscribers.clear();
  }

  private async completeAuthCode(code: string) {
    if (this.authCompletionPromise && this.authCompletionCode === code) {
      await this.authCompletionPromise;
      return;
    }

    const completionPromise = this.runAuthCompletion(code);
    this.authCompletionCode = code;
    this.authCompletionPromise = completionPromise;

    try {
      await completionPromise;
    } finally {
      if (this.authCompletionPromise === completionPromise) {
        this.authCompletionCode = null;
        this.authCompletionPromise = null;
      }
    }
  }

  private async runAuthCompletion(code: string) {
    this.patchConnection((state) =>
      reduceConnectionState(state, {
        type: 'authenticating',
        authCode: code,
      }),
    );

    try {
      await this.gateway.completeAuth(code);
      if (this.disposed || this.authCode !== code) {
        return;
      }

      this.authCode = null;
      await this.reconnectAfterAuth();
    } catch (error) {
      if (!this.disposed && this.authCode === code) {
        this.authCode = null;
        this.patchConnection((state) =>
          reduceConnectionState(state, {
            type: 'error',
            message: getAuthFailureDetail(error),
            clearAuthCode: true,
          }),
        );
      }

      throw error;
    }
  }

  private async reconnectAfterAuth() {
    this.clearReconnectTimer();
    await this.disconnectInternal();
    await this.beginConnect(true, {
      requireStoredAuth: true,
    });
  }

  private emit() {
    for (const subscriber of this.subscribers) {
      subscriber(this.state);
    }
  }

  private patchConnection(
    recipe: (state: PlaybackSessionState['connection']) => PlaybackSessionState['connection'],
  ) {
    const nextConnection = recipe(this.state.connection);
    if (areConnectionStatesEqual(this.state.connection, nextConnection)) {
      return;
    }

    this.state = {
      ...this.state,
      connection: nextConnection,
    };
    this.emit();
  }

  private patchPlayback(rawState: Parameters<typeof mapCompanionState>[0]) {
    const playback = mapCompanionState(rawState, this.state.lastKnownPlayback);
    this.state = {
      ...this.state,
      playback,
      lastKnownPlayback: playback ?? this.state.lastKnownPlayback,
    };
    this.emit();
  }

  private async beginConnect(reconnecting: boolean, options: BeginConnectOptions = {}) {
    if (this.disposed) {
      return;
    }

    this.clearReconnectTimer();
    let hasStoredAuth: boolean;
    try {
      hasStoredAuth = await this.gateway.hasStoredAuth();
    } catch (error) {
      this.patchConnection((state) =>
        reduceConnectionState(state, {
          type: 'error',
          message: toErrorMessage(error),
          clearAuthCode: options.requireStoredAuth === true,
        }),
      );
      return;
    }

    this.patchConnection((state) =>
      reduceConnectionState(state, {
        type: 'discovering',
        hasStoredAuth,
        reconnecting,
        authCode: options.requireStoredAuth ? null : undefined,
      }),
    );

    try {
      const discovery = await this.gateway.discover();
      this.patchConnection((state) =>
        reduceConnectionState(state, {
          type: 'availability',
          discovery,
          hasStoredAuth,
        }),
      );

      if (!discovery.available) {
        this.scheduleReconnect('not_running', discovery.detail);
        return;
      }

      if (!hasStoredAuth && this.gateway.kind === 'real') {
        if (options.requireStoredAuth) {
          this.patchConnection((state) =>
            reduceConnectionState(state, {
              type: 'error',
              message: CREDENTIAL_NOT_PERSISTED_DETAIL,
            }),
          );
          return;
        }

        this.patchConnection((state) =>
          reduceConnectionState(state, {
            type: 'auth_required',
            hasStoredAuth: false,
          }),
        );
        return;
      }

      const connectedHasStoredAuth = hasStoredAuth;
      const { connection, initialState } = await this.gateway.connect({
        onConnected: () => {
          this.patchConnection((state) =>
            reduceConnectionState(state, {
              type: 'connected',
              hasStoredAuth: connectedHasStoredAuth,
            }),
          );
        },
        onError: (detail) => {
          this.patchConnection((state) =>
            reduceConnectionState(state, { type: 'error', message: detail }),
          );
        },
        onDisconnected: (reason, detail) => {
          this.scheduleReconnect(reason, detail);
        },
        onState: (rawState) => {
          this.patchPlayback(rawState);
        },
      });

      this.connection = connection;
      this.patchConnection((state) =>
        reduceConnectionState(state, {
          type: 'connected',
          hasStoredAuth: connectedHasStoredAuth,
        }),
      );

      if (initialState) {
        this.patchPlayback(initialState);
      }
    } catch (error) {
      const gatewayError = error as GatewayError;
      if (gatewayError?.code === 'authorization_disabled') {
        this.patchConnection((state) =>
          reduceConnectionState(state, {
            type: 'error',
            message: gatewayError.message,
          }),
        );
        return;
      }

      if (gatewayError?.code === 'auth_required') {
        if (hasStoredAuth) {
          this.patchConnection((state) =>
            reduceConnectionState(state, {
              type: 'error',
              message: STORED_AUTH_REJECTED_DETAIL,
            }),
          );
          return;
        }

        this.patchConnection((state) =>
          reduceConnectionState(state, {
            type: 'auth_required',
            detail: gatewayError.message,
            hasStoredAuth: false,
          }),
        );
        return;
      }

      if (gatewayError?.code === 'not_running' || gatewayError?.code === 'api_unavailable') {
        this.scheduleReconnect(
          gatewayError.code === 'not_running' ? 'not_running' : 'api_unavailable',
          gatewayError.message,
        );
        return;
      }

      this.scheduleReconnect('socket_error', toErrorMessage(error));
    }
  }

  private scheduleReconnect(reason: GatewayDisconnectReason, detail?: string) {
    if (this.disposed) {
      return;
    }

    this.clearReconnectTimer();
    const nextAttempt = this.state.connection.retryAttempt + 1;
    const delay = getDelayForAttempt(reason, this.state.connection.retryAttempt);
    const retryAt = Date.now() + delay;

    this.patchConnection((state) =>
      reduceConnectionState(state, {
        type: 'retry_scheduled',
        retryAttempt: nextAttempt,
        retryAt,
        detail: getRetryDetail(reason, detail),
      }),
    );

    this.reconnectTimer = window.setTimeout(() => {
      void this.beginConnect(true);
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer != null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async disconnectInternal(options?: GatewayDisconnectOptions) {
    if (!this.connection) {
      return;
    }

    const activeConnection = this.connection;
    this.connection = null;
    await activeConnection.disconnect(options);
  }
}
