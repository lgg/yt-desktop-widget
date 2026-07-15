import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import type {
  AppSettings,
  CompanionRawState,
  DiscoveryInfo,
  GatewayDiagnostic,
  PlaybackCommand,
} from '@/domain/playback/types';

export type CompanionEventPayload =
  | { kind: 'state'; state: CompanionRawState }
  | {
      kind: 'status';
      status: 'socket_open' | 'socket_closed' | 'socket_error';
      detail?: string | null;
      diagnostic?: GatewayDiagnostic | null;
    };

export type WindowsMediaEventPayload = CompanionEventPayload;

export interface CompanionAuthEventPayload {
  authorized: boolean;
}

export interface CompanionConnectResponse {
  initialState: CompanionRawState | null;
}

export interface BackendCommandError {
  code: string;
  message: string;
  diagnostic?: GatewayDiagnostic;
}

export const tauriBridge = {
  loadSettings: () => invoke<AppSettings>('load_settings'),
  saveSettings: (settings: AppSettings) =>
    invoke<AppSettings>('save_settings', { settings }),
  listenToSettingsChanges: (handler: (settings: AppSettings) => void) =>
    listen<AppSettings>('app-settings://changed', (event) => {
      handler(event.payload);
    }),
  showWindow: (label: string) => invoke<void>('show_window', { label }),
  hideWindow: (label: string) => invoke<void>('hide_window', { label }),
  setMainWindowSize: (width: number, height: number) =>
    invoke<void>('set_main_window_size', { width, height }),
  hideWidgetStack: () => invoke<void>('hide_widget_stack'),
  exitApp: () => invoke<void>('exit_app'),
  openRepository: () => invoke<void>('open_repository'),
  companionHasAuth: () => invoke<boolean>('companion_has_auth'),
  companionDiscover: () => invoke<DiscoveryInfo>('companion_discover'),
  companionConnect: () => invoke<CompanionConnectResponse>('companion_connect'),
  companionDisconnect: () => invoke<void>('companion_disconnect'),
  companionRequestAuthCode: () =>
    invoke<{ code: string }>('companion_request_auth_code'),
  companionCompleteAuth: (code: string) =>
    invoke<void>('companion_complete_auth', { code }),
  companionClearAuth: () => invoke<void>('companion_clear_auth'),
  companionSendCommand: (command: PlaybackCommand) =>
    invoke<void>('companion_send_command', { command }),
  listenToCompanionEvents: (
    handler: (payload: CompanionEventPayload) => void,
  ) =>
    listen<CompanionEventPayload>('companion://event', (event) => {
      handler(event.payload);
    }),
  listenToCompanionAuthChanges: (
    handler: (payload: CompanionAuthEventPayload) => void,
  ) =>
    listen<CompanionAuthEventPayload>('companion://auth-changed', (event) => {
      handler(event.payload);
    }),
  windowsMediaDiscover: () => invoke<DiscoveryInfo>('windows_media_discover'),
  windowsMediaConnect: () =>
    invoke<CompanionConnectResponse>('windows_media_connect'),
  windowsMediaDisconnect: () => invoke<void>('windows_media_disconnect'),
  windowsMediaSendCommand: (command: PlaybackCommand) =>
    invoke<void>('windows_media_send_command', { command }),
  listenToWindowsMediaEvents: (
    handler: (payload: WindowsMediaEventPayload) => void,
  ) =>
    listen<WindowsMediaEventPayload>('windows-media://event', (event) => {
      handler(event.payload);
    }),
  ciderHasAuth: () => invoke<boolean>('cider_has_auth'),
  ciderStoreAuth: (token: string) => invoke<void>('cider_store_auth', { token }),
  ciderClearAuth: () => invoke<void>('cider_clear_auth'),
  ciderDiscover: () => invoke<DiscoveryInfo>('cider_discover'),
  ciderConnect: () => invoke<CompanionConnectResponse>('cider_connect'),
  ciderDisconnect: () => invoke<void>('cider_disconnect'),
  ciderSendCommand: (command: PlaybackCommand) => invoke<void>('cider_send_command', { command }),
  listenToCiderEvents: (handler: (payload: WindowsMediaEventPayload) => void) =>
    listen<WindowsMediaEventPayload>('cider://event', (event) => handler(event.payload)),
  listenToCiderAuthChanges: (handler: (payload: CompanionAuthEventPayload) => void) =>
    listen<CompanionAuthEventPayload>('cider://auth-changed', (event) => handler(event.payload)),
};
