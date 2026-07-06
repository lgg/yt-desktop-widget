import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import type {
  AppSettings,
  CompanionRawState,
  DiscoveryInfo,
  PlaybackCommand,
} from '@/domain/playback/types';

export type CompanionEventPayload =
  | { kind: 'state'; state: CompanionRawState }
  | {
      kind: 'status';
      status: 'socket_open' | 'socket_closed' | 'socket_error';
      detail?: string;
    };

export interface CompanionConnectResponse {
  initialState: CompanionRawState | null;
}

export interface BackendCommandError {
  code: string;
  message: string;
}

export const tauriBridge = {
  loadSettings: () => invoke<AppSettings>('load_settings'),
  saveSettings: (settings: AppSettings) => invoke<AppSettings>('save_settings', { settings }),
  listenToSettingsChanges: (handler: (settings: AppSettings) => void) =>
    listen<AppSettings>('app-settings://changed', (event) => {
      handler(event.payload);
    }),
  showWindow: (label: string) => invoke<void>('show_window', { label }),
  hideWindow: (label: string) => invoke<void>('hide_window', { label }),
  setMainWindowHeight: (height: number) => invoke<void>('set_main_window_height', { height }),
  hideWidgetStack: () => invoke<void>('hide_widget_stack'),
  exitApp: () => invoke<void>('exit_app'),
  openRepository: () => invoke<void>('open_repository'),
  companionHasAuth: () => invoke<boolean>('companion_has_auth'),
  companionDiscover: () => invoke<DiscoveryInfo>('companion_discover'),
  companionConnect: () => invoke<CompanionConnectResponse>('companion_connect'),
  companionDisconnect: () => invoke<void>('companion_disconnect'),
  companionRequestAuthCode: () => invoke<{ code: string }>('companion_request_auth_code'),
  companionCompleteAuth: (code: string) => invoke<void>('companion_complete_auth', { code }),
  companionClearAuth: () => invoke<void>('companion_clear_auth'),
  companionSendCommand: (command: PlaybackCommand) =>
    invoke<void>('companion_send_command', { command }),
  listenToCompanionEvents: (handler: (payload: CompanionEventPayload) => void) =>
    listen<CompanionEventPayload>('companion://event', (event) => {
      handler(event.payload);
    }),
};