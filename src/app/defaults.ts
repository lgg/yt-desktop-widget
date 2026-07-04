import type { AppSettings } from '@/domain/playback/types';

export const DEFAULT_SETTINGS: AppSettings = {
  api: {
    host: '127.0.0.1',
    port: 9863,
    sourceMode: 'auto',
  },
  ui: {
    hidePlaybackControls: false,
    hideProgressBar: false,
    hideSettingsButton: true,
    hideCloseButton: true,
    themeMode: 'dark',
  },
  window: {
    alwaysOnTop: false,
    launchOnStartup: false,
    closeButtonAction: 'exit',
    mainPosition: null,
    settingsPosition: null,
  },
};

export const APP_VERSION = '1.0.0';
export const REPOSITORY_URL = 'https://github.com/lgg/yt-desktop-widget';