import { GatewayError, type CompanionGateway } from '@/domain/playback/types';
import { tauriBridge, type BackendCommandError } from '@/integration/companion/tauriBridge';
import { isTauriRuntime } from '@/utils/runtime';

const normalize = (error: unknown) => {
  const value = error as Partial<BackendCommandError>;
  return new GatewayError(
    value.code === 'auth_required' || value.code === 'credential_storage' || value.code === 'not_running' || value.code === 'api_unavailable' || value.code === 'network' ? value.code : 'unknown',
    value.message ?? 'Cider local API returned an unexpected error.',
    value.diagnostic,
  );
};

const invoke = async <T>(action: () => Promise<T>) => {
  try { return await action(); } catch (error) { throw normalize(error); }
};

export const createCiderGateway = (): CompanionGateway => ({
  kind: 'cider',
  discover: () => invoke(() => tauriBridge.ciderDiscover()),
  hasStoredAuth: () => invoke(() => tauriBridge.ciderHasAuth()),
  async connect(handlers) {
    if (!isTauriRuntime()) throw new GatewayError('api_unavailable', 'Cider is available only in the desktop runtime.');
    let active = true;
    const unlisten = await tauriBridge.listenToCiderEvents((payload) => {
      if (!active) return;
      if (payload.kind === 'state') handlers.onState(payload.state);
      else if (payload.status === 'socket_open') handlers.onConnected();
      else if (payload.status === 'socket_closed') handlers.onDisconnected('socket_closed', payload.detail ?? undefined);
      else handlers.onError(payload.detail ?? 'Cider WebSockets were interrupted.');
    });
    try {
      const result = await invoke(() => tauriBridge.ciderConnect());
      return { initialState: result.initialState, connection: {
        send: (command) => invoke(() => tauriBridge.ciderSendCommand(command)),
        disconnect: async (options) => { active = false; unlisten(); if (options?.closeBackend !== false) await invoke(() => tauriBridge.ciderDisconnect()); },
      }};
    } catch (error) { active = false; unlisten(); throw error; }
  },
  requestAuthCode: () => Promise.reject(new GatewayError('authorization_disabled', 'Paste a Cider application token in Settings.')),
  completeAuth: (token) => invoke(() => tauriBridge.ciderStoreAuth(token)),
  clearAuth: () => invoke(() => tauriBridge.ciderClearAuth()),
});
