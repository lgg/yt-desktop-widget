import {
  GatewayError,
  type CompanionGateway,
  type GatewayConnectResult,
  type PlaybackCommand,
} from '@/domain/playback/types';
import {
  tauriBridge,
  type BackendCommandError,
} from '@/integration/companion/tauriBridge';
import { isTauriRuntime } from '@/utils/runtime';

const RUNTIME_ONLY_MESSAGE =
  'Windows Media Session is only available inside the Windows Tauri runtime.';
const SESSION_ERROR_MESSAGE = 'The Windows media session was interrupted.';

const normalizeBridgeError = (error: unknown): GatewayError => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as Partial<BackendCommandError>;
    if (candidate.code && candidate.message) {
      return new GatewayError(
        candidate.code === 'api_unavailable' ||
          candidate.code === 'not_running' ||
          candidate.code === 'network'
          ? candidate.code
          : 'unknown',
        candidate.message,
        candidate.diagnostic,
      );
    }
  }

  return new GatewayError(
    'unknown',
    error instanceof Error ? error.message : SESSION_ERROR_MESSAGE,
  );
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

const isUnsupportedCommand = (command: PlaybackCommand) =>
  command.type === 'mute' ||
  command.type === 'unmute' ||
  command.type === 'toggleLike' ||
  command.type === 'toggleDislike';

export const createWindowsMediaGateway = (): CompanionGateway => ({
  kind: 'windowsMediaSession',
  async discover() {
    requireTauriRuntime();
    return invokeBridge(() => tauriBridge.windowsMediaDiscover());
  },
  hasStoredAuth: () => Promise.resolve(false),
  async connect(handlers) {
    requireTauriRuntime();

    let active = true;
    const unlisten = await tauriBridge.listenToWindowsMediaEvents((payload) => {
      if (!active) {
        return;
      }

      if (payload.kind === 'state') {
        handlers.onState(payload.state);
        return;
      }

      if (payload.status === 'socket_open') {
        handlers.onConnected();
        return;
      }

      if (payload.status === 'socket_closed') {
        handlers.onDisconnected('socket_closed', payload.detail ?? undefined);
        return;
      }

      handlers.onError(
        payload.detail ?? SESSION_ERROR_MESSAGE,
        payload.diagnostic ?? undefined,
      );
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
        tauriBridge.windowsMediaConnect(),
      );
      return {
        initialState: result.initialState,
        connection: {
          send: async (command) => {
            if (isUnsupportedCommand(command)) {
              return;
            }
            await invokeBridge(() =>
              tauriBridge.windowsMediaSendCommand(command),
            );
          },
          disconnect: async (options) => {
            stopListening();
            if (options?.closeBackend === false) {
              return;
            }
            await invokeBridge(() => tauriBridge.windowsMediaDisconnect());
          },
        },
      } satisfies GatewayConnectResult;
    } catch (error) {
      stopListening();
      void tauriBridge.windowsMediaDisconnect().catch(() => undefined);
      throw error;
    }
  },
  requestAuthCode: () =>
    Promise.reject(
      new GatewayError(
        'authorization_disabled',
        'Windows Media Session does not require pairing.',
      ),
    ),
  completeAuth: () =>
    Promise.reject(
      new GatewayError(
        'authorization_disabled',
        'Windows Media Session does not require pairing.',
      ),
    ),
  clearAuth: () => Promise.resolve(),
});
