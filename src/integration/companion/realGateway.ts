import {
  GatewayError,
  type CompanionGateway,
  type GatewayConnectResult,
} from '@/domain/playback/types';
import {
  tauriBridge,
  type BackendCommandError,
} from '@/integration/companion/tauriBridge';
import { isTauriRuntime } from '@/utils/runtime';

const RUNTIME_ONLY_MESSAGE =
  'The real Companion bridge is only available inside the Tauri runtime.';
const SOCKET_ERROR_MESSAGE = 'The realtime connection was interrupted.';

const normalizeBridgeError = (error: unknown): GatewayError => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as Partial<BackendCommandError>;
    if (candidate.code && candidate.message) {
      if (
        candidate.code === 'auth_required' ||
        candidate.code === 'not_running' ||
        candidate.code === 'api_unavailable' ||
        candidate.code === 'network' ||
        candidate.code === 'unknown'
      ) {
        return new GatewayError(candidate.code, candidate.message);
      }
    }
  }

  if (error instanceof Error) {
    return new GatewayError('unknown', error.message);
  }

  return new GatewayError('unknown', 'Unknown bridge error.');
};

const requireTauriRuntime = () => {
  if (!isTauriRuntime()) {
    throw new GatewayError('api_unavailable', RUNTIME_ONLY_MESSAGE);
  }
};

const invokeBridge = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw normalizeBridgeError(error);
  }
};

export const createRealGateway = (): CompanionGateway => ({
  kind: 'real',
  async discover() {
    requireTauriRuntime();
    return invokeBridge(() => tauriBridge.companionDiscover());
  },
  async hasStoredAuth() {
    if (!isTauriRuntime()) {
      return false;
    }

    try {
      return await tauriBridge.companionHasAuth();
    } catch {
      return false;
    }
  },
  async connect(handlers, options) {
    requireTauriRuntime();

    let active = true;
    const unlisten = await tauriBridge.listenToCompanionEvents((payload) => {
      if (!active) {
        return;
      }

      if (payload.kind === 'state') {
        handlers.onState(payload.state);
        return;
      }

      if (payload.status === 'socket_closed') {
        handlers.onDisconnected('socket_closed', payload.detail);
        return;
      }

      if (payload.status === 'socket_error') {
        handlers.onDisconnected('socket_error', payload.detail ?? SOCKET_ERROR_MESSAGE);
      }
    });

    const stopListening = () => {
      if (!active) {
        return;
      }

      active = false;
      unlisten();
    };

    try {
      const result = await invokeBridge(() =>
        tauriBridge.companionConnect({
          preserveAuthOnFailure: options?.preserveAuthOnFailure,
        }),
      );
      return {
        initialState: result.initialState,
        connection: {
          send: (command) => invokeBridge(() => tauriBridge.companionSendCommand(command)),
          disconnect: async (options) => {
            stopListening();
            if (options?.closeBackend === false) {
              return;
            }

            await invokeBridge(() => tauriBridge.companionDisconnect());
          },
        },
      } satisfies GatewayConnectResult;
    } catch (error) {
      stopListening();
      throw error;
    }
  },
  requestAuthCode: async () => {
    requireTauriRuntime();
    return invokeBridge(() => tauriBridge.companionRequestAuthCode());
  },
  completeAuth: async (code) => {
    requireTauriRuntime();
    await invokeBridge(() => tauriBridge.companionCompleteAuth(code));
  },
  clearAuth: async () => {
    requireTauriRuntime();
    await invokeBridge(() => tauriBridge.companionClearAuth());
  },
});