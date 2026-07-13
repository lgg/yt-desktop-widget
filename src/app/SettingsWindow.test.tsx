import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AppModel } from '@/app/AppProvider';
import { APP_VERSION } from '@/app/defaults';
import { I18nProvider } from '@/app/i18n';
import { SettingsWindow } from '@/app/SettingsWindow';

const windowControllerMocks = vi.hoisted(() => ({
  hideCurrentAppWindow: vi.fn(() => Promise.resolve()),
  startCurrentAppWindowDragging: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/app/windowController', () => windowControllerMocks);

const updateSettings = vi.fn<AppModel['updateSettings']>(() =>
  Promise.resolve(),
);
const resolvedAction = () => Promise.resolve();

const model: AppModel = {
  ready: true,
  settings: {
    api: { host: '127.0.0.1', port: 9863, sourceMode: 'simulator' },
    ui: {
      hidePlaybackControls: false,
      showPlaybackControlsOnHover: true,
      hideProgressBar: false,
      connectionBadgeVisibility: 'always',
      hideTrackDetails: false,
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
};

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

  it('offers and persists all three connection badge visibility modes', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const group = screen.getByRole('group', {
      name: 'Connection status badge',
    });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Always' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'On hover' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Hidden' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hidden' }));
    expect(updateSettings).toHaveBeenCalledTimes(1);
    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui).toMatchObject({
      connectionBadgeVisibility: 'hidden',
    });
  });

  it('starts native dragging from the persistent header after the sections scroll', () => {
    windowControllerMocks.startCurrentAppWindowDragging.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const sections = document.querySelector<HTMLElement>(
      '.settings-window__sections',
    );
    const dragAnchor = screen
      .getByRole('heading', { name: 'Settings' })
      .closest('.settings-window__drag-anchor');
    expect(sections).not.toBeNull();
    expect(dragAnchor).not.toBeNull();

    if (sections) {
      sections.scrollTop = 320;
      fireEvent.scroll(sections);
    }
    fireEvent.mouseDown(dragAnchor as Element, {
      button: 0,
      buttons: 1,
    });

    expect(
      windowControllerMocks.startCurrentAppWindowDragging,
    ).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Hide settings' }), {
      button: 0,
      buttons: 1,
    });
    expect(
      windowControllerMocks.startCurrentAppWindowDragging,
    ).toHaveBeenCalledTimes(1);
  });

  it('places three live transparency controls before Window / Behavior', () => {
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const appearanceHeading = screen.getByRole('heading', {
      name: 'Transparency / Background',
    });
    const windowHeading = screen.getByRole('heading', {
      name: 'Window / Behavior',
    });
    expect(appearanceHeading.compareDocumentPosition(windowHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    expect(screen.getByLabelText('Window surface opacity')).toHaveValue('100');
    expect(screen.getByLabelText('Artwork background opacity')).toHaveValue(
      '100',
    );
    expect(screen.getByLabelText('Gradient overlay intensity')).toHaveValue(
      '100',
    );
    expect(document.querySelector('.settings-window')).toHaveStyle({
      '--window-surface-opacity': '1',
      '--artwork-background-opacity': '1',
      '--artwork-gradient-opacity': '1',
    });
  });

  it('places a separate Widget Size section before transparency and persists presets', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const sizeHeading = screen.getByRole('heading', { name: 'Widget Size' });
    const appearanceHeading = screen.getByRole('heading', {
      name: 'Transparency / Background',
    });
    expect(sizeHeading.compareDocumentPosition(appearanceHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    expect(screen.getByRole('button', { name: 'Compact' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Default' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Large' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Custom' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Large' }));
    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui).toMatchObject({
      widgetSizeMode: 'large',
      customWidgetScalePercentage: 100,
    });
  });

  it('exposes linked width and height inputs in Custom mode', () => {
    const originalMode = model.settings.ui.widgetSizeMode;
    const originalScale = model.settings.ui.customWidgetScalePercentage;
    model.settings.ui.widgetSizeMode = 'custom';
    model.settings.ui.customWidgetScalePercentage = 100;
    updateSettings.mockClear();

    try {
      render(
        <I18nProvider>
          <SettingsWindow />
        </I18nProvider>,
      );

      expect(screen.getByRole('button', { name: 'Custom' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      const width = screen.getByLabelText('Width');
      const height = screen.getByLabelText('Height');
      expect(width).toHaveValue(336);
      expect(height).toHaveValue(438);
      expect(width).toHaveAttribute('min', '252');
      expect(width).toHaveAttribute('max', '504');
      expect(height).toHaveAttribute('min', '329');
      expect(height).toHaveAttribute('max', '657');
      expect(screen.getByText('Proportions are locked.')).toBeInTheDocument();

      fireEvent.change(width, { target: { value: '400' } });
      fireEvent.blur(width);
      let recipe = updateSettings.mock.calls[0]?.[0];
      expect(recipe?.(model.settings).ui.widgetSizeMode).toBe('custom');
      expect(
        recipe?.(model.settings).ui.customWidgetScalePercentage,
      ).toBeCloseTo(119.047619, 5);

      updateSettings.mockClear();
      fireEvent.change(height, { target: { value: '600' } });
      fireEvent.blur(height);
      recipe = updateSettings.mock.calls[0]?.[0];
      expect(recipe?.(model.settings).ui.widgetSizeMode).toBe('custom');
      expect(
        recipe?.(model.settings).ui.customWidgetScalePercentage,
      ).toBeCloseTo(136.986301, 5);
    } finally {
      model.settings.ui.widgetSizeMode = originalMode;
      model.settings.ui.customWidgetScalePercentage = originalScale;
    }
  });

  it('persists and individually resets a transparency percentage', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    fireEvent.change(screen.getByLabelText('Window surface opacity'), {
      target: { value: '64' },
    });
    expect(updateSettings).toHaveBeenCalledTimes(1);
    let recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui).toMatchObject({
      windowSurfaceOpacity: 64,
    });

    updateSettings.mockClear();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Reset window surface opacity to default',
      }),
    );
    expect(updateSettings).toHaveBeenCalledTimes(1);
    recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui).toMatchObject({
      windowSurfaceOpacity: 100,
    });
  });

  it('localizes authorization status without rendering raw native details', () => {
    const connection = model.session.connection;
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
