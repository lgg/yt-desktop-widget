import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AppModel } from '@/app/AppProvider';
import { I18nProvider } from '@/app/i18n';
import { WidgetWindow } from '@/app/WidgetWindow';

const mockUseAppModel = vi.fn<() => AppModel>();
const resolvedAction = () => Promise.resolve();

vi.mock('@/app/AppProvider', () => ({
  useAppModel: (): AppModel => mockUseAppModel(),
}));

describe('WidgetWindow', () => {
  it('renders the connected playback view', () => {
    mockUseAppModel.mockReturnValue({
      ready: true,
      settings: {
        api: { host: '127.0.0.1', port: 9863, sourceMode: 'simulator' },
        ui: {
          hidePlaybackControls: false,
          hideProgressBar: false,
          hideSettingsButton: true,
          hideCloseButton: true,
          themeMode: 'dark',
        },
        window: {
          alwaysOnTop: true,
          launchOnStartup: false,
          closeButtonAction: 'exit',
          mainPosition: null,
          settingsPosition: null,
        },
      },
      resolvedSourceMode: 'simulator',
      session: {
        connection: { status: 'connected', hasStoredAuth: true, retryAttempt: 0, retryAt: null },
        playback: {
          id: 'track-1',
          title: 'Night Train Window',
          artists: ['Moseca Harbor'],
          album: 'Blue Static',
          coverUrl: 'https://example.com/cover.png',
          durationSeconds: 248,
          elapsedSeconds: 12,
          progressRatio: 0.05,
          playbackState: 'playing',
          isAdPlaying: false,
          isLive: false,
          canSeek: true,
          metadataFilled: true,
          lastSyncedAt: Date.now(),
        },
        lastKnownPlayback: null,
      },
      updateSettings: vi.fn(resolvedAction),
      reconnect: vi.fn(resolvedAction),
      generateAuthCode: vi.fn(resolvedAction),
      confirmAuthentication: vi.fn(resolvedAction),
      clearAuth: vi.fn(resolvedAction),
      sendCommand: vi.fn(resolvedAction),
      openSettings: vi.fn(resolvedAction),
      closeWidget: vi.fn(resolvedAction),
      toggleDebugMockMode: vi.fn(resolvedAction),
      openRepository: vi.fn(resolvedAction),
    });

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(screen.getByText('Night Train Window')).toBeInTheDocument();
    expect(screen.getByText('Moseca Harbor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('renders authorization actions when auth is required', () => {
    mockUseAppModel.mockReturnValue({
      ready: true,
      settings: {
        api: { host: '127.0.0.1', port: 9863, sourceMode: 'real' },
        ui: {
          hidePlaybackControls: false,
          hideProgressBar: false,
          hideSettingsButton: true,
          hideCloseButton: true,
          themeMode: 'dark',
        },
        window: {
          alwaysOnTop: true,
          launchOnStartup: false,
          closeButtonAction: 'exit',
          mainPosition: null,
          settingsPosition: null,
        },
      },
      resolvedSourceMode: 'real',
      session: {
        connection: {
          status: 'auth_required',
          hasStoredAuth: false,
          retryAttempt: 0,
          retryAt: null,
          authCode: 'DEV-OK',
        },
        playback: null,
        lastKnownPlayback: null,
      },
      updateSettings: vi.fn(resolvedAction),
      reconnect: vi.fn(resolvedAction),
      generateAuthCode: vi.fn(resolvedAction),
      confirmAuthentication: vi.fn(resolvedAction),
      clearAuth: vi.fn(resolvedAction),
      sendCommand: vi.fn(resolvedAction),
      openSettings: vi.fn(resolvedAction),
      closeWidget: vi.fn(resolvedAction),
      toggleDebugMockMode: vi.fn(resolvedAction),
      openRepository: vi.fn(resolvedAction),
    });

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(screen.getByText('Authorize this widget')).toBeInTheDocument();
    expect(screen.getByText('DEV-OK')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm in YTMDesktop' })).toBeInTheDocument();
  });
});