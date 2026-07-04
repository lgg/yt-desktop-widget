import { DEFAULT_SETTINGS } from '@/app/defaults';
import type { AppSettings } from '@/domain/playback/types';
import { tauriBridge } from '@/integration/companion/tauriBridge';
import { isTauriRuntime } from '@/utils/runtime';

const STORAGE_KEY = 'ytm-desktop-widget.settings';

const mergeSettings = (partial: Partial<AppSettings> | null): AppSettings => ({
  ...DEFAULT_SETTINGS,
  ...partial,
  api: {
    ...DEFAULT_SETTINGS.api,
    ...(partial?.api ?? {}),
  },
  ui: {
    ...DEFAULT_SETTINGS.ui,
    ...(partial?.ui ?? {}),
  },
  window: {
    ...DEFAULT_SETTINGS.window,
    ...(partial?.window ?? {}),
  },
});

const loadBrowserSettings = (): AppSettings => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    return mergeSettings(JSON.parse(raw) as Partial<AppSettings>);
  } catch (error) {
    console.error('Failed to parse local settings, falling back to defaults.', error);
    window.localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SETTINGS;
  }
};

export const loadSettings = async (): Promise<AppSettings> => {
  if (isTauriRuntime()) {
    return mergeSettings(await tauriBridge.loadSettings());
  }

  return loadBrowserSettings();
};

export const saveSettings = async (settings: AppSettings): Promise<AppSettings> => {
  if (isTauriRuntime()) {
    return mergeSettings(await tauriBridge.saveSettings(settings));
  }

  const merged = mergeSettings(settings);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
};
