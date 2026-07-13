import { DEFAULT_SETTINGS } from '@/app/defaults';
import type {
  AppSettings,
  CloseButtonAction,
  DataSourceMode,
  Locale,
  ThemeMode,
  WindowPosition,
} from '@/domain/playback/types';
import { tauriBridge } from '@/integration/companion/tauriBridge';
import { isTauriRuntime } from '@/utils/runtime';

const STORAGE_KEY = 'ytm-desktop-widget.settings';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  typeof value === 'object' && value !== null ? (value as UnknownRecord) : {};

const booleanOr = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

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
      hidePlaybackControls: booleanOr(
        ui.hidePlaybackControls,
        DEFAULT_SETTINGS.ui.hidePlaybackControls,
      ),
      showPlaybackControlsOnHover: booleanOr(
        ui.showPlaybackControlsOnHover,
        DEFAULT_SETTINGS.ui.showPlaybackControlsOnHover,
      ),
      hideProgressBar: booleanOr(
        ui.hideProgressBar,
        DEFAULT_SETTINGS.ui.hideProgressBar,
      ),
      hideConnectionBadge: booleanOr(
        ui.hideConnectionBadge,
        DEFAULT_SETTINGS.ui.hideConnectionBadge,
      ),
      hideTrackDetails: booleanOr(
        ui.hideTrackDetails,
        DEFAULT_SETTINGS.ui.hideTrackDetails,
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
