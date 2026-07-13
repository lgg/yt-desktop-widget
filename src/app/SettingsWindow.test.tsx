import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AppModel } from '@/app/AppProvider';
import { APP_VERSION } from '@/app/defaults';
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
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByText(`Version: ${APP_VERSION}`)).toBeInTheDocument();
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

  it('persists an explicit light theme through the existing settings update path', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(updateSettings).toHaveBeenCalledTimes(1);

    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe).toBeTypeOf('function');
    expect(recipe?.(model.settings).ui).toMatchObject({ themeMode: 'light' });
  });

  it('localizes authorization status without rendering raw native details', () => {
    const connection = model.session
      .connection as AppModel['session']['connection'];
    const originalStatus = connection.status;
    connection.status = 'auth_required';
    connection.detail = 'sensitive native authorization response';
    connection.messageKey = 'authRequired';

    try {
      render(
        <I18nProvider locale="ru">
          <SettingsWindow />
        </I18nProvider>,
      );

      expect(
        screen.getByText(
          'Для подключения виджета требуется авторизация Companion.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('sensitive native authorization response'),
      ).toBeNull();
    } finally {
      connection.status = originalStatus;
      delete connection.detail;
      delete connection.messageKey;
    }
  });
});
