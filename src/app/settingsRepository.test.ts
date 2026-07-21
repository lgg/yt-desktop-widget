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

  it('defaults and validates the user-facing playback source independently from dev mode', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ api: { sourceMode: 'real' } }),
    );
    const legacy = await loadSettings();
    expect(
      (legacy.api as unknown as Record<string, unknown>).playbackSource,
    ).toBe('companion');

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        api: {
          sourceMode: 'real',
          playbackSource: 'windowsMediaSession',
        },
      }),
    );
    const windowsMedia = await loadSettings();
    expect(
      (windowsMedia.api as unknown as Record<string, unknown>).playbackSource,
    ).toBe('windowsMediaSession');

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ api: { playbackSource: 'unsupported' } }),
    );
    const repaired = await loadSettings();
    expect(
      (repaired.api as unknown as Record<string, unknown>).playbackSource,
    ).toBe('companion');
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
    expect(settings.ui.progressBarVisibility).toBe(
      DEFAULT_SETTINGS.ui.progressBarVisibility,
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

  it('defaults, validates, and clamps widget size preferences', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ui: {} }));
    const legacySettings = await loadSettings();
    expect(legacySettings.ui.widgetSizeMode).toBe('default');
    expect(legacySettings.ui.customWidgetScalePercentage).toBe(100);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ui: {
          widgetSizeMode: 'wide',
          customWidgetScalePercentage: 999,
        },
      }),
    );
    const invalidSettings = await loadSettings();
    expect(invalidSettings.ui.widgetSizeMode).toBe('default');
    expect(invalidSettings.ui.customWidgetScalePercentage).toBe(600);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ui: {
          widgetSizeMode: 'custom',
          customWidgetScalePercentage: 72,
        },
      }),
    );
    const undersizedSettings = await loadSettings();
    expect(undersizedSettings.ui.widgetSizeMode).toBe('custom');
    expect(undersizedSettings.ui.customWidgetScalePercentage).toBe(75);
  });

  it('migrates legacy display booleans to explicit block visibility without changing v2 behavior', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ui: {
          hidePlaybackControls: false,
          showPlaybackControlsOnHover: true,
          hideProgressBar: false,
          hideTrackDetails: true,
        },
      }),
    );

    const settings = await loadSettings();

    expect(settings.ui.playbackControlsVisibility).toBe('hoverReserved');
    expect(settings.ui.progressBarVisibility).toBe('always');
    expect(settings.ui.trackDetailsVisibility).toBe('hidden');
    expect(settings.ui.likeDislikeVisibility).toBe('hidden');
    expect(settings.ui.muteButtonVisibility).toBe('hidden');
    expect(settings.ui.widgetBlockOrder).toEqual([
      'header',
      'artwork',
      'trackDetails',
      'likeDislike',
      'playbackControls',
      'progress',
    ]);
  });

  it('repairs explicit visibility, block order, and collapsed-section preferences', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ui: {
          playbackControlsVisibility: 'hoverDynamic',
          progressBarVisibility: 'unsupported',
          trackDetailsVisibility: 'hoverReserved',
          likeDislikeVisibility: 'always',
          muteButtonVisibility: 'hover',
          widgetBlockOrder: [
            'progress',
            'header',
            'progress',
            'unknown',
          ],
          collapsedSettingsSections: ['ui', 'api', 'ui', 'unknown'],
        },
      }),
    );

    const settings = await loadSettings();

    expect(settings.ui.playbackControlsVisibility).toBe('hoverDynamic');
    expect(settings.ui.progressBarVisibility).toBe('always');
    expect(settings.ui.trackDetailsVisibility).toBe('hoverReserved');
    expect(settings.ui.likeDislikeVisibility).toBe('always');
    expect(settings.ui.muteButtonVisibility).toBe('hover');
    expect(settings.ui.widgetBlockOrder).toEqual([
      'progress',
      'header',
      'artwork',
      'trackDetails',
      'likeDislike',
      'playbackControls',
    ]);
    expect(settings.ui.collapsedSettingsSections).toEqual(['ui', 'api']);
  });
});
