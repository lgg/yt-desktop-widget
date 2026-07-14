import { DEFAULT_SETTINGS } from '@/app/defaults';
import type {
  AppSettings,
  CloseButtonAction,
  ConnectionBadgeVisibility,
  DataSourceMode,
  Locale,
  ThemeMode,
  WidgetBlockVisibility,
  WidgetSizeMode,
  WindowPosition,
} from '@/domain/playback/types';
import {
  WIDGET_BLOCK_VISIBILITY_MODES,
  normalizeCollapsedSettingsSections,
  normalizeWidgetBlockOrder,
} from '@/app/widgetLayout';
import {
  WIDGET_CUSTOM_MAX_PERCENTAGE,
  WIDGET_CUSTOM_MIN_PERCENTAGE,
  WIDGET_SIZE_MODES,
} from '@/app/widgetSize';
import { tauriBridge } from '@/integration/companion/tauriBridge';
import { isTauriRuntime } from '@/utils/runtime';

const STORAGE_KEY = 'ytm-desktop-widget.settings';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  typeof value === 'object' && value !== null ? (value as UnknownRecord) : {};

const booleanOr = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

const percentageOr = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.round(Math.min(100, Math.max(0, value)))
    : fallback;

const rangedNumberOr = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;

const enumOr = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T =>
  typeof value === 'string' && allowed.includes(value as T)
    ? (value as T)
    : fallback;

const positionOr = (
  value: unknown,
  fallback: WindowPosition | null,
): WindowPosition | null => {
  if (value === null) {
    return null;
  }

  const position = asRecord(value);
  return typeof position.x === 'number' &&
    Number.isFinite(position.x) &&
    typeof position.y === 'number' &&
    Number.isFinite(position.y)
    ? { x: position.x, y: position.y }
    : fallback;
};

export const normalizeSettings = (value: unknown): AppSettings => {
  const settings = asRecord(value);
  const api = asRecord(settings.api);
  const ui = asRecord(settings.ui);
  const windowSettings = asRecord(settings.window);
  const host = typeof api.host === 'string' ? api.host.trim() : '';
  const port = api.port;
  const legacyConnectionBadgeVisibility: ConnectionBadgeVisibility = booleanOr(
    ui.hideConnectionBadge,
    false,
  )
    ? 'hover'
    : DEFAULT_SETTINGS.ui.connectionBadgeVisibility;
  const legacyPlaybackControlsVisibility: WidgetBlockVisibility = booleanOr(
    ui.hidePlaybackControls,
    false,
  )
    ? 'hidden'
    : booleanOr(ui.showPlaybackControlsOnHover, true)
      ? 'hoverReserved'
      : 'always';
  const legacyProgressBarVisibility: WidgetBlockVisibility = booleanOr(
    ui.hideProgressBar,
    false,
  )
    ? 'hidden'
    : 'always';
  const legacyTrackDetailsVisibility: WidgetBlockVisibility = booleanOr(
    ui.hideTrackDetails,
    false,
  )
    ? 'hidden'
    : 'always';

  return {
    api: {
      host: host || DEFAULT_SETTINGS.api.host,
      port:
        typeof port === 'number' &&
        Number.isInteger(port) &&
        port >= 1 &&
        port <= 65_535
          ? port
          : DEFAULT_SETTINGS.api.port,
      sourceMode: enumOr<DataSourceMode>(
        api.sourceMode,
        ['auto', 'real', 'simulator'],
        DEFAULT_SETTINGS.api.sourceMode,
      ),
    },
    ui: {
      playbackControlsVisibility: enumOr<WidgetBlockVisibility>(
        ui.playbackControlsVisibility,
        WIDGET_BLOCK_VISIBILITY_MODES,
        legacyPlaybackControlsVisibility,
      ),
      progressBarVisibility: enumOr<WidgetBlockVisibility>(
        ui.progressBarVisibility,
        WIDGET_BLOCK_VISIBILITY_MODES,
        legacyProgressBarVisibility,
      ),
      trackDetailsVisibility: enumOr<WidgetBlockVisibility>(
        ui.trackDetailsVisibility,
        WIDGET_BLOCK_VISIBILITY_MODES,
        legacyTrackDetailsVisibility,
      ),
      likeDislikeVisibility: enumOr<WidgetBlockVisibility>(
        ui.likeDislikeVisibility,
        WIDGET_BLOCK_VISIBILITY_MODES,
        DEFAULT_SETTINGS.ui.likeDislikeVisibility,
      ),
      connectionBadgeVisibility: enumOr<ConnectionBadgeVisibility>(
        ui.connectionBadgeVisibility,
        ['always', 'hover', 'hidden'],
        legacyConnectionBadgeVisibility,
      ),
      muteButtonVisibility: enumOr<ConnectionBadgeVisibility>(
        ui.muteButtonVisibility,
        ['always', 'hover', 'hidden'],
        DEFAULT_SETTINGS.ui.muteButtonVisibility,
      ),
      widgetBlockOrder: normalizeWidgetBlockOrder(ui.widgetBlockOrder),
      collapsedSettingsSections: normalizeCollapsedSettingsSections(
        ui.collapsedSettingsSections,
      ),
      useArtworkAsPlaybackControl: booleanOr(
        ui.useArtworkAsPlaybackControl,
        DEFAULT_SETTINGS.ui.useArtworkAsPlaybackControl,
      ),
      hideSettingsButton: booleanOr(
        ui.hideSettingsButton,
        DEFAULT_SETTINGS.ui.hideSettingsButton,
      ),
      hideCloseButton: booleanOr(
        ui.hideCloseButton,
        DEFAULT_SETTINGS.ui.hideCloseButton,
      ),
      windowSurfaceOpacity: percentageOr(
        ui.windowSurfaceOpacity,
        DEFAULT_SETTINGS.ui.windowSurfaceOpacity,
      ),
      artworkBackgroundOpacity: percentageOr(
        ui.artworkBackgroundOpacity,
        DEFAULT_SETTINGS.ui.artworkBackgroundOpacity,
      ),
      artworkGradientOpacity: percentageOr(
        ui.artworkGradientOpacity,
        DEFAULT_SETTINGS.ui.artworkGradientOpacity,
      ),
      widgetSizeMode: enumOr<WidgetSizeMode>(
        ui.widgetSizeMode,
        WIDGET_SIZE_MODES,
        DEFAULT_SETTINGS.ui.widgetSizeMode,
      ),
      customWidgetScalePercentage: rangedNumberOr(
        ui.customWidgetScalePercentage,
        DEFAULT_SETTINGS.ui.customWidgetScalePercentage,
        WIDGET_CUSTOM_MIN_PERCENTAGE,
        WIDGET_CUSTOM_MAX_PERCENTAGE,
      ),
      themeMode: enumOr<ThemeMode>(
        ui.themeMode,
        ['dark', 'light', 'system'],
        DEFAULT_SETTINGS.ui.themeMode,
      ),
      locale: enumOr<Locale>(
        ui.locale,
        ['en', 'ru'],
        DEFAULT_SETTINGS.ui.locale,
      ),
    },
    window: {
      alwaysOnTop: booleanOr(
        windowSettings.alwaysOnTop,
        DEFAULT_SETTINGS.window.alwaysOnTop,
      ),
      launchOnStartup: booleanOr(
        windowSettings.launchOnStartup,
        DEFAULT_SETTINGS.window.launchOnStartup,
      ),
      closeButtonAction: enumOr<CloseButtonAction>(
        windowSettings.closeButtonAction,
        ['exit', 'hideToTray'],
        DEFAULT_SETTINGS.window.closeButtonAction,
      ),
      mainPosition: positionOr(
        windowSettings.mainPosition,
        DEFAULT_SETTINGS.window.mainPosition,
      ),
      settingsPosition: positionOr(
        windowSettings.settingsPosition,
        DEFAULT_SETTINGS.window.settingsPosition,
      ),
    },
  };
};

const loadBrowserSettings = (): AppSettings => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    return normalizeSettings(JSON.parse(raw));
  } catch (error) {
    console.error(
      'Failed to parse local settings, falling back to defaults.',
      error,
    );
    window.localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SETTINGS;
  }
};

export const loadSettings = async (): Promise<AppSettings> => {
  if (isTauriRuntime()) {
    return normalizeSettings(await tauriBridge.loadSettings());
  }

  return loadBrowserSettings();
};

export const saveSettings = async (
  settings: AppSettings,
): Promise<AppSettings> => {
  if (isTauriRuntime()) {
    return normalizeSettings(await tauriBridge.saveSettings(settings));
  }

  const normalized = normalizeSettings(settings);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};
