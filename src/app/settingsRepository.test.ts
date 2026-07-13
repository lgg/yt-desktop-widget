import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from '@/app/defaults';
import { loadSettings } from '@/app/settingsRepository';

const STORAGE_KEY = 'ytm-desktop-widget.settings';

describe('settingsRepository browser persistence', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('falls back from unsupported persisted enum values', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        api: { sourceMode: 'legacy-source' },
        ui: {
          locale: 'de',
          themeMode: 'sepia',
          connectionBadgeVisibility: 'sometimes',
        },
        window: { closeButtonAction: 'minimize' },
      }),
    );

    const settings = await loadSettings();

    expect(settings.api.sourceMode).toBe(DEFAULT_SETTINGS.api.sourceMode);
    expect(settings.ui.locale).toBe(DEFAULT_SETTINGS.ui.locale);
    expect(settings.ui.themeMode).toBe(DEFAULT_SETTINGS.ui.themeMode);
    expect(settings.ui.connectionBadgeVisibility).toBe('always');
    expect(settings.window.closeButtonAction).toBe(
      DEFAULT_SETTINGS.window.closeButtonAction,
    );
  });

  it('migrates legacy connection badge booleans without losing hover behavior', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ui: { hideConnectionBadge: true } }),
    );
    const legacyHover = await loadSettings();
    expect(legacyHover.ui.connectionBadgeVisibility).toBe('hover');

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ui: { hideConnectionBadge: false } }),
    );
    const legacyAlways = await loadSettings();
    expect(legacyAlways.ui.connectionBadgeVisibility).toBe('always');

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ui: { connectionBadgeVisibility: 'hidden' } }),
    );
    const explicitHidden = await loadSettings();
    expect(explicitHidden.ui.connectionBadgeVisibility).toBe('hidden');
  });

  it('repairs malformed primitive values and window positions', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        api: { host: 42, port: 99_999 },
        ui: { hideProgressBar: 'yes' },
        window: {
          alwaysOnTop: 1,
          mainPosition: { x: Number.NaN, y: '12' },
          settingsPosition: { x: 20, y: -15 },
        },
      }),
    );

    const settings = await loadSettings();

    expect(settings.api.host).toBe(DEFAULT_SETTINGS.api.host);
    expect(settings.api.port).toBe(DEFAULT_SETTINGS.api.port);
    expect(settings.ui.hideProgressBar).toBe(
      DEFAULT_SETTINGS.ui.hideProgressBar,
    );
    expect(settings.window.alwaysOnTop).toBe(
      DEFAULT_SETTINGS.window.alwaysOnTop,
    );
    expect(settings.window.mainPosition).toBeNull();
    expect(settings.window.settingsPosition).toEqual({ x: 20, y: -15 });
  });

  it('defaults, clamps, and repairs persisted transparency percentages', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ui: {
          windowSurfaceOpacity: -15,
          artworkBackgroundOpacity: 140,
          artworkGradientOpacity: '70',
        },
      }),
    );

    const settings = await loadSettings();

    expect(settings.ui.windowSurfaceOpacity).toBe(0);
    expect(settings.ui.artworkBackgroundOpacity).toBe(100);
    expect(settings.ui.artworkGradientOpacity).toBe(
      DEFAULT_SETTINGS.ui.artworkGradientOpacity,
    );

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ui: {} }));
    const legacySettings = await loadSettings();
    expect(legacySettings.ui.windowSurfaceOpacity).toBe(100);
    expect(legacySettings.ui.artworkBackgroundOpacity).toBe(100);
    expect(legacySettings.ui.artworkGradientOpacity).toBe(100);
  });
});
