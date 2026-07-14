import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProvider, useAppModel } from '@/app/AppProvider';
import type {
  AppSettings,
  PlaybackSessionState,
} from '@/domain/playback/types';
import type { CompanionAuthEventPayload } from '@/integration/companion/tauriBridge';

const defaultSettings: AppSettings = {
  api: {
    host: '127.0.0.1',
    port: 9863,
    sourceMode: 'real',
    playbackSource: 'companion',
  },
  ui: {
    playbackControlsVisibility: 'hoverReserved',
    progressBarVisibility: 'always',
    trackDetailsVisibility: 'always',
    likeDislikeVisibility: 'hidden',
    connectionBadgeVisibility: 'always',
    muteButtonVisibility: 'hidden',
    widgetBlockOrder: [
      'header',
      'artwork',
      'trackDetails',
      'likeDislike',
      'playbackControls',
      'progress',
    ],
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

const initialSession: PlaybackSessionState = {
  connection: {
    status: 'auth_required',
    hasStoredAuth: false,
    retryAttempt: 0,
    retryAt: null,
    authCode: null,
  },
  playback: null,
  lastKnownPlayback: null,
};

const appProviderMocks = vi.hoisted(() => ({
  saveSettings: vi.fn((settings: AppSettings) => Promise.resolve(settings)),
  authChangeHandler: null as
    | ((payload: CompanionAuthEventPayload) => void)
    | null,
  createWindowsMediaGateway: vi.fn(() => ({ kind: 'windowsMediaSession' })),
  controllerInstances: [] as Array<{
    subscribe: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    reconnectNow: ReturnType<typeof vi.fn>;
    handleExternalAuthChanged: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock('@/utils/runtime', () => ({
  isTauriRuntime: () => true,
}));

vi.mock('@/app/settingsRepository', () => ({
  loadSettings: vi.fn(() => Promise.resolve(defaultSettings)),
  saveSettings: appProviderMocks.saveSettings,
}));

vi.mock('@/integration/companion/realGateway', () => ({
  createRealGateway: vi.fn(() => ({ kind: 'real' })),
}));

vi.mock('@/integration/simulator/simulatorGateway', () => ({
  createSimulatorGateway: vi.fn(() => ({ kind: 'simulator' })),
}));

vi.mock('@/integration/windowsMedia/windowsMediaGateway', () => ({
  createWindowsMediaGateway: appProviderMocks.createWindowsMediaGateway,
}));

vi.mock('@/integration/companion/tauriBridge', () => ({
  tauriBridge: {
    listenToSettingsChanges: vi.fn(() => Promise.resolve(vi.fn())),
    listenToCompanionAuthChanges: vi.fn(
      (handler: (payload: CompanionAuthEventPayload) => void) => {
        appProviderMocks.authChangeHandler = handler;
        return Promise.resolve(vi.fn());
      },
    ),
  },
}));

vi.mock('@/domain/playback/controller', () => ({
  PlaybackController: vi.fn().mockImplementation(() => {
    const instance = {
      subscribe: vi.fn((listener: (state: PlaybackSessionState) => void) => {
        listener(initialSession);
        return vi.fn();
      }),
      start: vi.fn(() => Promise.resolve()),
      reconnectNow: vi.fn(() => Promise.resolve()),
      handleExternalAuthChanged: vi.fn(() => Promise.resolve()),
      dispose: vi.fn(() => Promise.resolve()),
    };

    appProviderMocks.controllerInstances.push(instance);
    return instance;
  }),
}));

const SettingsUpdateProbe = () => {
  const { ready, settings, updateSettings } = useAppModel();

  return (
    <button
      type="button"
      onClick={() =>
        void updateSettings((current) => ({
          ...current,
          ui: {
            ...current.ui,
            windowSurfaceOpacity: 72,
          },
        }))
      }
    >
      {ready ? 'ready' : 'loading'}:{settings.ui.windowSurfaceOpacity}
    </button>
  );
};

const BadgeModeUpdateProbe = () => {
  const { ready, settings, updateSettings } = useAppModel();
  const visibility = settings.ui.connectionBadgeVisibility;

  return (
    <button
      type="button"
      onClick={() =>
        void updateSettings((current) => ({
          ...current,
          ui: {
            ...current.ui,
            connectionBadgeVisibility: 'hidden',
          },
        }))
      }
    >
      {ready ? 'ready' : 'loading'}:{visibility}
    </button>
  );
};

describe('AppProvider', () => {
  beforeEach(() => {
    appProviderMocks.authChangeHandler = null;
    appProviderMocks.controllerInstances.length = 0;
    appProviderMocks.saveSettings.mockClear();
    appProviderMocks.createWindowsMediaGateway.mockClear();
  });

  it('reconnects the main real controller when another window changes Companion auth', async () => {
    render(
      <AppProvider windowLabel="main">
        <div />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(appProviderMocks.controllerInstances).toHaveLength(1);
      expect(appProviderMocks.authChangeHandler).toBeTypeOf('function');
    });

    act(() => {
      appProviderMocks.authChangeHandler?.({ authorized: true });
    });

    await waitFor(() => {
      expect(
        appProviderMocks.controllerInstances[0]?.handleExternalAuthChanged,
      ).toHaveBeenCalledWith(true);
    });
  });

  it('uses the Windows Media gateway without installing a Companion auth listener', async () => {
    defaultSettings.api.playbackSource = 'windowsMediaSession';
    try {
      render(
        <AppProvider windowLabel="main">
          <div />
        </AppProvider>,
      );

      await waitFor(() => {
        expect(appProviderMocks.createWindowsMediaGateway).toHaveBeenCalledOnce();
        expect(appProviderMocks.controllerInstances).toHaveLength(1);
      });
      expect(appProviderMocks.authChangeHandler).toBeNull();
    } finally {
      defaultSettings.api.playbackSource = 'companion';
    }
  });

  it('persists an appearance-only settings update', async () => {
    render(
      <AppProvider windowLabel="main">
        <SettingsUpdateProbe />
      </AppProvider>,
    );

    const updateButton = await screen.findByRole('button', {
      name: 'ready:100',
    });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(updateButton).toHaveTextContent('ready:72');
      expect(appProviderMocks.saveSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('persists a connection badge visibility-only settings update', async () => {
    render(
      <AppProvider windowLabel="main">
        <BadgeModeUpdateProbe />
      </AppProvider>,
    );

    const updateButton = await screen.findByRole('button', {
      name: 'ready:always',
    });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(updateButton).toHaveTextContent('ready:hidden');
      expect(appProviderMocks.saveSettings).toHaveBeenCalledTimes(1);
    });
  });
});
