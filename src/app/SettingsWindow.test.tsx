import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AppModel } from '@/app/AppProvider';
import { I18nProvider } from '@/app/i18n';
import { SettingsWindow } from '@/app/SettingsWindow';

const updateSettings = vi.fn<AppModel['updateSettings']>(() =>
  Promise.resolve(),
);
const resolvedAction = () => Promise.resolve();

const model = {
  ready: true,
  settings: {
    api: { host: '127.0.0.1', port: 9863, sourceMode: 'simulator' },
    ui: {
      hidePlaybackControls: false,
      showPlaybackControlsOnHover: true,
      hideProgressBar: false,
      hideConnectionBadge: false,
      hideTrackDetails: false,
      useArtworkAsPlaybackControl: false,
      hideSettingsButton: true,
      hideCloseButton: true,
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
  },
  session: {
    connection: {
      status: 'connected',
      hasStoredAuth: true,
      retryAttempt: 0,
      retryAt: null,
    },
    playback: null,
    lastKnownPlayback: null,
  },
  resolvedSourceMode: 'simulator',
  updateSettings,
  reconnect: vi.fn(resolvedAction),
  generateAuthCode: vi.fn(resolvedAction),
  confirmAuthentication: vi.fn(resolvedAction),
  clearAuth: vi.fn(resolvedAction),
  sendCommand: vi.fn(resolvedAction),
  openSettings: vi.fn(resolvedAction),
  closeWidget: vi.fn(resolvedAction),
  toggleDebugMockMode: vi.fn(resolvedAction),
  openRepository: vi.fn(resolvedAction),
} satisfies AppModel;

vi.mock('@/app/AppProvider', () => ({
  useAppModel: (): AppModel => model,
}));

describe('SettingsWindow UI display preferences', () => {
  it('puts theme first and exposes track, artwork, and language preferences', () => {
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const theme = screen.getByText('Theme mode').closest('.segmented-control');
    const firstToggle = screen
      .getByText('Hide playback controls')
      .closest('.toggle-row');
    expect(theme).not.toBeNull();
    expect(firstToggle).not.toBeNull();
    expect(theme?.compareDocumentPosition(firstToggle as Node) ?? 0).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    expect(
      screen.getByLabelText('Hide track title and artist'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Use artwork as play/pause control'),
    ).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Russian' })).toBeInTheDocument();
    expect(screen.getByText('Version: 2.0.0')).toBeInTheDocument();
  });

  it('persists the Russian locale through the existing settings update path', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Russian' }));
    expect(updateSettings).toHaveBeenCalledTimes(1);

    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe).toBeTypeOf('function');
    expect(recipe?.(model.settings).ui).toMatchObject({ locale: 'ru' });
  });
});
