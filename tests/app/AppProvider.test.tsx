import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppProvider } from '@/app/AppProvider';
import type { AppSettings, PlaybackSessionState } from '@/domain/playback/types';
import type { CompanionAuthEventPayload } from '@/integration/companion/tauriBridge';

const defaultSettings: AppSettings = {
  api: { host: '127.0.0.1', port: 9863, sourceMode: 'real' },
  ui: {
    hidePlaybackControls: false,
    showPlaybackControlsOnHover: true,
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
  authChangeHandler: null as ((payload: CompanionAuthEventPayload) => void) | null,
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
  saveSettings: vi.fn((settings) => Promise.resolve(settings)),
}));

vi.mock('@/integration/companion/realGateway', () => ({
  createRealGateway: vi.fn(() => ({ kind: 'real' })),
}));

vi.mock('@/integration/simulator/simulatorGateway', () => ({
  createSimulatorGateway: vi.fn(() => ({ kind: 'simulator' })),
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

describe('AppProvider auth change handling', () => {
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
});
