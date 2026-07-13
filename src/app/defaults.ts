import packageJson from '../../package.json';

import type { AppSettings } from '@/domain/playback/types';

export const DEFAULT_SETTINGS: AppSettings = {
  api: {
    host: '127.0.0.1',
    port: 9863,
    sourceMode: 'auto',
  },
  ui: {
    hidePlaybackControls: false,
    showPlaybackControlsOnHover: true,
    hideProgressBar: false,
    connectionBadgeVisibility: 'always',
    hideTrackDetails: false,
    useArtworkAsPlaybackControl: false,
    hideSettingsButton: true,
    hideCloseButton: true,
    windowSurfaceOpacity: 100,
    artworkBackgroundOpacity: 100,
    artworkGradientOpacity: 100,
    themeMode: 'dark',
    locale: 'en',
  },
  window: {
    alwaysOnTop: false,
    launchOnStartup: false,
    closeButtonAction: 'exit',
    mainPosition: null,
    settingsPosition: null,
  },
};

export const APP_VERSION = packageJson.version;
export const REPOSITORY_URL = 'https://github.com/lgg/yt-desktop-widget';
