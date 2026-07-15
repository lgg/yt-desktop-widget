import packageJson from '../../package.json';

import type { AppSettings } from '@/domain/playback/types';
import { DEFAULT_WIDGET_BLOCK_ORDER } from '@/app/widgetLayout';

export const DEFAULT_SETTINGS: AppSettings = {
  api: {
    host: '127.0.0.1',
    port: 9863,
    sourceMode: 'auto',
    playbackSource: 'companion',
  },
  ui: {
    playbackControlsVisibility: 'hoverReserved',
    progressBarVisibility: 'always',
    trackDetailsVisibility: 'always',
    likeDislikeVisibility: 'hidden',
    connectionBadgeVisibility: 'always',
    muteButtonVisibility: 'hidden',
    widgetBlockOrder: [...DEFAULT_WIDGET_BLOCK_ORDER],
    collapsedSettingsSections: [],
    useArtworkAsPlaybackControl: false,
    hideSettingsButton: true,
    hideCloseButton: true,
    windowSurfaceOpacity: 100,
    artworkBackgroundOpacity: 100,
    artworkGradientOpacity: 100,
    widgetSizeMode: 'default',
    customWidgetScalePercentage: 100,
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
export const REPOSITORY_URL = 'https://github.com/lgg/music-desktop-widget';
