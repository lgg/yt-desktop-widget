import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AppModel } from '@/app/AppProvider';
import { APP_VERSION } from '@/app/defaults';
import { I18nProvider } from '@/app/i18n';
import { SettingsWindow } from '@/app/SettingsWindow';
import { DEFAULT_WIDGET_BLOCK_ORDER } from '@/app/widgetLayout';

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
    api: {
      host: '127.0.0.1',
      port: 9863,
      sourceMode: 'simulator',
      playbackSource: 'companion',
    },
    ui: {
      playbackControlsVisibility: 'hoverReserved',
      progressBarVisibility: 'always',
      trackDetailsVisibility: 'always',
      likeDislikeVisibility: 'hidden',
      connectionBadgeVisibility: 'always',
      muteButtonVisibility: 'hidden',
      widgetBlockOrder: [...DEFAULT_WIDGET_BLOCK_ORDER],
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
  setCiderToken: vi.fn(resolvedAction),
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
  it('puts the persisted playback source selector first and switches to Windows Media Session', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const sourceGroup = screen.getByRole('group', {
      name: 'Playback source',
    });
    const firstSection = document.querySelector('.settings-section');
    expect(firstSection).toContainElement(sourceGroup);

    fireEvent.click(
      within(sourceGroup).getByRole('button', {
        name: 'Windows Media Session',
      }),
    );
    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(
      (recipe?.(model.settings).api as unknown as Record<string, unknown>)
        .playbackSource,
    ).toBe('windowsMediaSession');
  });

  it('hides Companion connection and auth settings in Windows Media Session mode', () => {
    const previous = model.settings.api.playbackSource;
    model.settings.api.playbackSource = 'windowsMediaSession';

    try {
      render(
        <I18nProvider>
          <SettingsWindow />
        </I18nProvider>,
      );

      expect(
        screen.queryByLabelText('Companion endpoint'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Pair' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/Like, Dislike, and mute are unavailable/i),
      ).toBeInTheDocument();
    } finally {
      model.settings.api.playbackSource = previous;
    }
  });

  it('presents the Cider token as one accessible secure credential form', () => {
    const previousSource = model.settings.api.playbackSource;
    model.settings.api.playbackSource = 'cider';

    try {
      render(
        <I18nProvider>
          <SettingsWindow />
        </I18nProvider>,
      );

      const credentialForm = screen.getByRole('group', {
        name: 'Cider application token',
      });
      const tokenInput = within(credentialForm).getByLabelText(
        'Cider application token',
      );
      const saveButton = within(credentialForm).getByRole('button', {
        name: 'Save token securely',
      });

      expect(credentialForm).toHaveClass('cider-credential');
      expect(tokenInput).toHaveClass('cider-credential__input');
      expect(saveButton).toBeDisabled();
      expect(within(credentialForm).getByRole('status')).toHaveTextContent(
        'Stored securely in Windows Credential Manager',
      );
      expect(
        within(credentialForm).getByRole('button', {
          name: 'Clear Cider token',
        }),
      ).toHaveClass('cider-credential__clear');
    } finally {
      model.settings.api.playbackSource = previousSource;
    }
  });

  it('shows source-specific Cider authorization guidance', () => {
    const previousSource = model.settings.api.playbackSource;
    const previousSourceMode = model.settings.api.sourceMode;
    const previousResolvedSourceMode = model.resolvedSourceMode;
    const previousConnection = { ...model.session.connection };
    model.settings.api.playbackSource = 'cider';
    model.settings.api.sourceMode = 'real';
    model.resolvedSourceMode = 'real';
    model.session.connection = {
      status: 'auth_required',
      hasStoredAuth: false,
      retryAttempt: 0,
      retryAt: null,
      messageKey: 'authRequired',
      detail: 'sensitive Cider response',
    };

    try {
      render(
        <I18nProvider>
          <SettingsWindow />
        </I18nProvider>,
      );

      expect(
        screen.getByText(/Cider needs an application token/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/Companion authorization is required/i),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('sensitive Cider response')).toBeNull();
    } finally {
      model.settings.api.playbackSource = previousSource;
      model.settings.api.sourceMode = previousSourceMode;
      model.resolvedSourceMode = previousResolvedSourceMode;
      model.session.connection = previousConnection;
    }
  });

  it('shows actionable safe diagnostics when Windows denies media access', () => {
    const previousSource = model.settings.api.playbackSource;
    const previousMode = model.resolvedSourceMode;
    const previousConnection = model.session.connection;
    model.settings.api.playbackSource = 'windowsMediaSession';
    model.resolvedSourceMode = 'real';
    model.session.connection = {
      status: 'disconnected',
      hasStoredAuth: false,
      retryAttempt: 1,
      retryAt: null,
      messageKey: 'notRunning',
      diagnostic: {
        stage: 'request_manager.await',
        hresult: '0x80070005',
        category: 'access_denied',
      },
    };

    try {
      render(
        <I18nProvider>
          <SettingsWindow />
        </I18nProvider>,
      );

      expect(
        screen.getByText(/Run the portable EXE directly from File Explorer/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/request_manager\.await/)).toHaveTextContent(
        '0x80070005',
      );
    } finally {
      model.settings.api.playbackSource = previousSource;
      model.resolvedSourceMode = previousMode;
      model.session.connection = previousConnection;
    }
  });

  it('puts theme first and exposes track, artwork, and language preferences', () => {
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const theme = screen.getByText('Theme mode').closest('.segmented-control');
    const firstToggle = screen
      .getByText('Use artwork as play/pause control')
      .closest('.toggle-row');
    expect(theme).not.toBeNull();
    expect(firstToggle).not.toBeNull();
    expect(theme?.compareDocumentPosition(firstToggle as Node) ?? 0).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    expect(
      screen.getByRole('group', { name: 'Track title and artist' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Use artwork as play/pause control'),
    ).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Russian' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByText(`Version: ${APP_VERSION}`)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'music-desktop-widget' }),
    ).toBeInTheDocument();
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
    expect(
      within(group).getByRole('button', { name: 'Always' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(group).getByRole('button', { name: 'On hover' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      within(group).getByRole('button', { name: 'Hidden' }),
    ).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(within(group).getByRole('button', { name: 'Hidden' }));
    expect(updateSettings).toHaveBeenCalledTimes(1);
    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui).toMatchObject({
      connectionBadgeVisibility: 'hidden',
    });
  });

  it('offers four visibility modes for each configurable widget content block', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    for (const name of [
      'Track title and artist',
      'Progress bar',
      'Like / Dislike buttons',
      'Playback controls',
    ]) {
      const group = screen.getByRole('group', { name });
      expect(
        within(group).getByRole('button', { name: 'Always' }),
      ).toBeInTheDocument();
      expect(
        within(group).getByRole('button', {
          name: 'On hover — keep space',
        }),
      ).toBeInTheDocument();
      expect(
        within(group).getByRole('button', {
          name: 'On hover — resize widget',
        }),
      ).toBeInTheDocument();
      expect(
        within(group).getByRole('button', { name: 'Hidden' }),
      ).toBeInTheDocument();

      const rows = group.querySelectorAll('.segmented-control__options-row');
      expect(rows).toHaveLength(2);
      expect(
        within(rows[0] as HTMLElement)
          .getAllByRole('button')
          .map((button) => button.textContent),
      ).toEqual(['Always', 'Hidden']);
      expect(
        within(rows[1] as HTMLElement)
          .getAllByRole('button')
          .map((button) => button.textContent),
      ).toEqual(['On hover — keep space', 'On hover — resize widget']);
    }

    const progress = screen.getByRole('group', { name: 'Progress bar' });
    fireEvent.click(
      within(progress).getByRole('button', {
        name: 'On hover — resize widget',
      }),
    );
    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui.progressBarVisibility).toBe(
      'hoverDynamic',
    );
  });

  it('offers independent mute-button visibility without volume controls', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const group = screen.getByRole('group', { name: 'Mute button' });
    expect(
      within(group).getByRole('button', { name: 'Hidden' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByLabelText(/volume/i)).not.toBeInTheDocument();
    fireEvent.click(within(group).getByRole('button', { name: 'On hover' }));
    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui.muteButtonVisibility).toBe('hover');
  });

  it('explains and disables unsupported mute modes for Windows Media Session', () => {
    const previousSource = model.settings.api.playbackSource;
    const previousSourceMode = model.settings.api.sourceMode;
    const previousResolvedSourceMode = model.resolvedSourceMode;
    model.settings.api.playbackSource = 'windowsMediaSession';
    model.settings.api.sourceMode = 'real';
    model.resolvedSourceMode = 'real';

    try {
      render(
        <I18nProvider>
          <SettingsWindow />
        </I18nProvider>,
      );

      expect(
        screen.getByText(/GSMTC does not publish mute or volume controls/i),
      ).toBeInTheDocument();
      const group = screen.getByRole('group', { name: 'Mute button' });
      expect(
        within(group).getByRole('button', { name: 'Always' }),
      ).toBeDisabled();
      expect(
        within(group).getByRole('button', { name: 'On hover' }),
      ).toBeDisabled();
      expect(
        within(group).getByRole('button', { name: 'Hidden' }),
      ).not.toBeDisabled();
    } finally {
      model.settings.api.playbackSource = previousSource;
      model.settings.api.sourceMode = previousSourceMode;
      model.resolvedSourceMode = previousResolvedSourceMode;
    }
  });

  it('presents Settings and Close button visibility as two-choice segmented controls', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    for (const name of ['Settings button', 'Close button']) {
      const group = screen.getByRole('group', { name });
      expect(within(group).getAllByRole('button')).toHaveLength(2);
      expect(
        within(group).getByRole('button', { name: 'Always' }),
      ).toHaveAttribute('aria-pressed', 'false');
      expect(
        within(group).getByRole('button', { name: 'On hover' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        within(group).queryByRole('button', { name: 'Hidden' }),
      ).not.toBeInTheDocument();
    }

    fireEvent.click(
      within(screen.getByRole('group', { name: 'Settings button' })).getByRole(
        'button',
        { name: 'Always' },
      ),
    );
    let recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui.hideSettingsButton).toBe(false);

    fireEvent.click(
      within(screen.getByRole('group', { name: 'Close button' })).getByRole(
        'button',
        { name: 'Always' },
      ),
    );
    recipe = updateSettings.mock.calls[1]?.[0];
    expect(recipe?.(model.settings).ui.hideCloseButton).toBe(false);
  });

  it('maps existing visible Settings and Close button preferences to Always', () => {
    const previousSettings = model.settings.ui.hideSettingsButton;
    const previousClose = model.settings.ui.hideCloseButton;
    model.settings.ui.hideSettingsButton = false;
    model.settings.ui.hideCloseButton = false;

    try {
      render(
        <I18nProvider>
          <SettingsWindow />
        </I18nProvider>,
      );

      for (const name of ['Settings button', 'Close button']) {
        const group = screen.getByRole('group', { name });
        expect(
          within(group).getByRole('button', { name: 'Always' }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(
          within(group).getByRole('button', { name: 'On hover' }),
        ).toHaveAttribute('aria-pressed', 'false');
      }

      updateSettings.mockClear();
      fireEvent.click(
        within(
          screen.getByRole('group', { name: 'Settings button' }),
        ).getByRole('button', { name: 'On hover' }),
      );
      fireEvent.click(
        within(screen.getByRole('group', { name: 'Close button' })).getByRole(
          'button',
          { name: 'On hover' },
        ),
      );
      expect(updateSettings).toHaveBeenCalledTimes(2);
      expect(
        updateSettings.mock.calls[0]?.[0]?.(model.settings).ui
          .hideSettingsButton,
      ).toBe(true);
      expect(
        updateSettings.mock.calls[1]?.[0]?.(model.settings).ui.hideCloseButton,
      ).toBe(true);
    } finally {
      model.settings.ui.hideSettingsButton = previousSettings;
      model.settings.ui.hideCloseButton = previousClose;
    }
  });

  it('moves blocks with accessible controls and persists the new permutation', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const order = screen.getByRole('list', { name: 'Widget block order' });
    expect(
      within(order)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining('Header controls'),
      expect.stringContaining('Artwork'),
      expect.stringContaining('Track title and artist'),
      expect.stringContaining('Like / Dislike buttons'),
      expect.stringContaining('Playback controls'),
      expect.stringContaining('Progress bar'),
    ]);

    fireEvent.click(
      within(order).getByRole('button', { name: 'Move Progress bar up' }),
    );
    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui.widgetBlockOrder).toEqual([
      'header',
      'artwork',
      'trackDetails',
      'likeDislike',
      'progress',
      'playbackControls',
    ]);
  });

  it('persists collapsed top-level Settings sections with semantic expanded state', () => {
    updateSettings.mockClear();
    render(
      <I18nProvider>
        <SettingsWindow />
      </I18nProvider>,
    );

    const apiToggle = screen.getByRole('button', {
      name: 'Collapse API / Connection',
    });
    expect(apiToggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(apiToggle);
    const recipe = updateSettings.mock.calls[0]?.[0];
    expect(recipe?.(model.settings).ui.collapsedSettingsSections).toEqual([
      'api',
    ]);
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
