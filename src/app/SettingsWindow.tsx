import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useState,
} from 'react';

import { getAppearanceStyle } from '@/app/appearance';
import { APP_VERSION, DEFAULT_SETTINGS } from '@/app/defaults';
import { getConnectionMessage } from '@/app/connectionMessage';
import {
  formatCompanionEndpoint,
  parseCompanionEndpoint,
} from '@/app/endpoint';
import { useAppModel } from '@/app/AppProvider';
import {
  hideCurrentAppWindow,
  startCurrentAppWindowDragging,
} from '@/app/windowController';
import { useI18n } from '@/app/i18n';
import {
  WIDGET_CUSTOM_MAX_PERCENTAGE,
  WIDGET_CUSTOM_MIN_PERCENTAGE,
  getCustomWidgetScaleFromHeight,
  getCustomWidgetScaleFromWidth,
  getWidgetReferenceDimensions,
} from '@/app/widgetSize';
import { ArtworkBackground } from '@/components/ArtworkBackground';
import {
  CloseIcon,
  GitHubIcon,
  RefreshIcon,
  SparkIcon,
} from '@/components/icons';
import {
  SettingsSection,
  SettingsRow,
  Toggle,
} from '@/components/settings/SettingsSection';

type OpacitySettingKey =
  | 'windowSurfaceOpacity'
  | 'artworkBackgroundOpacity'
  | 'artworkGradientOpacity';

interface OpacityControlProps {
  id: string;
  label: string;
  description: string;
  value: number;
  defaultValue: number;
  resetText: string;
  resetLabel: string;
  onChange: (value: number) => void;
  onReset: () => void;
}

const OpacityControl = ({
  id,
  label,
  description,
  value,
  defaultValue,
  resetText,
  resetLabel,
  onChange,
  onReset,
}: OpacityControlProps) => (
  <div className="opacity-control">
    <div className="opacity-control__header">
      <div className="opacity-control__copy">
        <label className="opacity-control__label" htmlFor={id}>
          {label}
        </label>
        <span id={`${id}-description`} className="opacity-control__description">
          {description}
        </span>
      </div>
      <div className="opacity-control__value-actions">
        <output className="opacity-control__value" htmlFor={id}>
          {value}%
        </output>
        <button
          className="ghost-button opacity-control__reset"
          type="button"
          aria-label={resetLabel}
          data-default-value={defaultValue}
          onClick={onReset}
        >
          {resetText}
        </button>
      </div>
    </div>
    <input
      id={id}
      className="opacity-control__range"
      type="range"
      min="0"
      max="100"
      step="1"
      value={value}
      aria-describedby={`${id}-description`}
      aria-valuetext={`${value}%`}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </div>
);

export const SettingsWindow = () => {
  const {
    settings,
    session,
    resolvedSourceMode,
    updateSettings,
    reconnect,
    generateAuthCode,
    confirmAuthentication,
    clearAuth,
    openRepository,
    toggleDebugMockMode,
  } = useAppModel();
  const { t } = useI18n();
  const [endpointDraft, setEndpointDraft] = useState(
    formatCompanionEndpoint(settings.api.host, settings.api.port),
  );
  const [endpointError, setEndpointError] = useState<string | null>(null);
  const debugMockModeActive = settings.api.sourceMode === 'simulator';
  const authBusy = session.connection.status === 'authenticating';
  const authStatusDetail =
    session.connection.status === 'auth_required' ||
    session.connection.status === 'authenticating'
      ? getConnectionMessage(t, session.connection)
      : null;
  const widgetDimensions = getWidgetReferenceDimensions(
    settings.ui.customWidgetScalePercentage,
  );
  const minimumWidgetDimensions = getWidgetReferenceDimensions(
    WIDGET_CUSTOM_MIN_PERCENTAGE,
  );
  const maximumWidgetDimensions = getWidgetReferenceDimensions(
    WIDGET_CUSTOM_MAX_PERCENTAGE,
  );

  useEffect(() => {
    setEndpointDraft(
      formatCompanionEndpoint(settings.api.host, settings.api.port),
    );
    setEndpointError(null);
  }, [settings.api.host, settings.api.port]);

  const commitEndpoint = async () => {
    const parsed = parseCompanionEndpoint(endpointDraft);
    if (!parsed) {
      setEndpointError(t('settingsWindow.sections.api.endpointInvalid'));
      return;
    }

    setEndpointError(null);

    if (
      parsed.host === settings.api.host &&
      parsed.port === settings.api.port
    ) {
      return;
    }

    await updateSettings((current) => ({
      ...current,
      api: {
        ...current.api,
        host: parsed.host,
        port: parsed.port,
      },
    }));
  };

  const handleEndpointKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    void commitEndpoint();
  };

  const commitCustomWidgetScale = (scalePercentage: number) => {
    void updateSettings((current) => ({
      ...current,
      ui: {
        ...current.ui,
        widgetSizeMode: 'custom',
        customWidgetScalePercentage: scalePercentage,
      },
    }));
  };

  const handleCustomSizeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    event.currentTarget.blur();
  };

  const handleHeaderMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    void startCurrentAppWindowDragging().catch((error) => {
      console.error('Failed to start dragging the Settings window.', error);
    });
  };

  const updateOpacity = (key: OpacitySettingKey, value: number) => {
    void updateSettings((current) => ({
      ...current,
      ui: {
        ...current.ui,
        [key]: value,
      },
    }));
  };

  const resetOpacity = (key: OpacitySettingKey) => {
    updateOpacity(key, DEFAULT_SETTINGS.ui[key]);
  };

  const renderOpacityControl = (
    key: OpacitySettingKey,
    translationKey: 'windowSurface' | 'artworkBackground' | 'gradientOverlay',
  ) => {
    const label = t(`settingsWindow.sections.appearance.${translationKey}`);
    const defaultValue = DEFAULT_SETTINGS.ui[key];

    return (
      <OpacityControl
        key={key}
        id={`appearance-${key}`}
        label={label}
        description={t(
          `settingsWindow.sections.appearance.${translationKey}Description`,
        )}
        value={settings.ui[key]}
        defaultValue={defaultValue}
        resetText={t('settingsWindow.sections.appearance.reset')}
        resetLabel={t('settingsWindow.sections.appearance.resetLabel', {
          label: label.toLocaleLowerCase(settings.ui.locale),
        })}
        onChange={(value) => updateOpacity(key, value)}
        onReset={() => resetOpacity(key)}
      />
    );
  };

  return (
    <main
      data-tauri-drag-region
      className="settings-window drag-region"
      style={getAppearanceStyle(settings.ui)}
    >
      <div className="settings-window__content">
        <ArtworkBackground
          artworkUrl={session.lastKnownPlayback?.coverUrl ?? null}
          fallbackClassName="settings-window__background"
        />
        <header className="settings-window__header">
          <div
            className="settings-window__drag-anchor"
            onMouseDown={handleHeaderMouseDown}
          >
            <h1>{t('app.settings')}</h1>
          </div>
          <button
            className="icon-button settings-window__close"
            type="button"
            aria-label={t('settingsWindow.actions.close')}
            onClick={() => void hideCurrentAppWindow()}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="settings-window__sections">
          <SettingsSection
            title={t('settingsWindow.sections.api.title')}
            description={t('settingsWindow.sections.api.description')}
            actions={
              <button
                className="secondary-button"
                type="button"
                onClick={() => void reconnect()}
              >
                <RefreshIcon />
                <span>{t('settingsWindow.actions.reconnect')}</span>
              </button>
            }
          >
            <div className="settings-field">
              <label
                className="settings-field__label"
                htmlFor="companion-endpoint"
              >
                {t('settingsWindow.sections.api.endpoint')}
              </label>
              <input
                id="companion-endpoint"
                className={
                  endpointError
                    ? 'settings-field__input settings-field__input--invalid'
                    : 'settings-field__input'
                }
                value={endpointDraft}
                placeholder={t(
                  'settingsWindow.sections.api.endpointPlaceholder',
                )}
                onChange={(event) => setEndpointDraft(event.target.value)}
                onBlur={() => {
                  void commitEndpoint();
                }}
                onKeyDown={handleEndpointKeyDown}
              />
              {endpointError ? (
                <p className="settings-field__hint settings-field__hint--error">
                  {endpointError}
                </p>
              ) : null}
            </div>
            <div className="settings-row-grid settings-row-grid--status">
              <SettingsRow className="settings-row--stacked settings-row--status">
                <span className="settings-row__label">
                  {t('settingsWindow.sections.api.connected')}
                </span>
                <span className="settings-row__value">
                  {t(`status.${session.connection.status}`)}
                </span>
              </SettingsRow>
              <SettingsRow className="settings-row--stacked settings-row--status">
                <span className="settings-row__label">
                  {t('settingsWindow.sections.api.paired')}
                </span>
                <span className="settings-row__value">
                  {session.connection.hasStoredAuth
                    ? t('settingsWindow.sections.api.pairedYes')
                    : t('settingsWindow.sections.api.pairedNo')}
                </span>
              </SettingsRow>
            </div>
            <div className="settings-actions-row">
              <button
                className="secondary-button"
                type="button"
                onClick={() => void generateAuthCode()}
                disabled={authBusy}
              >
                {t('settingsWindow.actions.pair')}
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => void confirmAuthentication()}
                disabled={!session.connection.authCode || authBusy}
              >
                {t('settingsWindow.actions.confirmPair')}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => void clearAuth()}
              >
                {t('settingsWindow.actions.clearAuth')}
              </button>
            </div>
            {authStatusDetail ? (
              <p className="settings-field__hint">{authStatusDetail}</p>
            ) : null}
            {session.connection.authCode ? (
              <div className="code-chip code-chip--inline">
                <span>{t('widget.auth.codeLabel')}</span>
                <strong>{session.connection.authCode}</strong>
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection
            title={t('settingsWindow.sections.ui.title')}
            description={t('settingsWindow.sections.ui.description')}
          >
            <div className="segmented-control">
              <span className="segmented-control__label">
                {t('settingsWindow.sections.ui.theme')}
              </span>
              <div
                className="segmented-control__options"
                role="group"
                aria-label={t('settingsWindow.sections.ui.theme')}
              >
                {(['dark', 'light', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={settings.ui.themeMode === mode}
                    className={
                      settings.ui.themeMode === mode
                        ? 'segmented-control__option segmented-control__option--active'
                        : 'segmented-control__option'
                    }
                    onClick={() =>
                      void updateSettings((current) => ({
                        ...current,
                        ui: {
                          ...current.ui,
                          themeMode: mode,
                        },
                      }))
                    }
                  >
                    {t(`settingsWindow.theme.${mode}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="segmented-control">
              <span className="segmented-control__label">
                {t('settingsWindow.sections.ui.language')}
              </span>
              <div
                className="segmented-control__options"
                role="group"
                aria-label={t('settingsWindow.sections.ui.language')}
              >
                {(['en', 'ru'] as const).map((locale) => (
                  <button
                    key={locale}
                    type="button"
                    aria-pressed={settings.ui.locale === locale}
                    className={
                      settings.ui.locale === locale
                        ? 'segmented-control__option segmented-control__option--active'
                        : 'segmented-control__option'
                    }
                    onClick={() =>
                      void updateSettings((current) => ({
                        ...current,
                        ui: {
                          ...current.ui,
                          locale,
                        },
                      }))
                    }
                  >
                    {t(`settingsWindow.language.${locale}`)}
                  </button>
                ))}
              </div>
            </div>
            <Toggle
              checked={settings.ui.hidePlaybackControls}
              onChange={(nextValue) =>
                void updateSettings((current) => ({
                  ...current,
                  ui: {
                    ...current.ui,
                    hidePlaybackControls: nextValue,
                  },
                }))
              }
              label={t('settingsWindow.sections.ui.hideControls')}
              description={t(
                'settingsWindow.sections.ui.hideControlsDescription',
              )}
            />
            <Toggle
              checked={settings.ui.showPlaybackControlsOnHover}
              onChange={(nextValue) =>
                void updateSettings((current) => ({
                  ...current,
                  ui: {
                    ...current.ui,
                    showPlaybackControlsOnHover: nextValue,
                  },
                }))
              }
              label={t('settingsWindow.sections.ui.showControlsOnHover')}
              description={t(
                'settingsWindow.sections.ui.showControlsOnHoverDescription',
              )}
            />
            <Toggle
              checked={settings.ui.useArtworkAsPlaybackControl}
              onChange={(nextValue) =>
                void updateSettings((current) => ({
                  ...current,
                  ui: {
                    ...current.ui,
                    useArtworkAsPlaybackControl: nextValue,
                  },
                }))
              }
              label={t('settingsWindow.sections.ui.artworkPlaybackControl')}
              description={t(
                'settingsWindow.sections.ui.artworkPlaybackControlDescription',
              )}
            />
            <Toggle
              checked={settings.ui.hideProgressBar}
              onChange={(nextValue) =>
                void updateSettings((current) => ({
                  ...current,
                  ui: {
                    ...current.ui,
                    hideProgressBar: nextValue,
                  },
                }))
              }
              label={t('settingsWindow.sections.ui.hideProgress')}
              description={t(
                'settingsWindow.sections.ui.hideProgressDescription',
              )}
            />
            <Toggle
              checked={settings.ui.hideTrackDetails}
              onChange={(nextValue) =>
                void updateSettings((current) => ({
                  ...current,
                  ui: {
                    ...current.ui,
                    hideTrackDetails: nextValue,
                  },
                }))
              }
              label={t('settingsWindow.sections.ui.hideTrackDetails')}
              description={t(
                'settingsWindow.sections.ui.hideTrackDetailsDescription',
              )}
            />
            <div className="segmented-control">
              <span className="segmented-control__label">
                {t('settingsWindow.sections.ui.connectionBadgeVisibility')}
              </span>
              <span className="segmented-control__description">
                {t(
                  'settingsWindow.sections.ui.connectionBadgeVisibilityDescription',
                )}
              </span>
              <div
                className="segmented-control__options"
                role="group"
                aria-label={t(
                  'settingsWindow.sections.ui.connectionBadgeVisibility',
                )}
              >
                {(['always', 'hover', 'hidden'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={
                      settings.ui.connectionBadgeVisibility === mode
                    }
                    className={
                      settings.ui.connectionBadgeVisibility === mode
                        ? 'segmented-control__option segmented-control__option--active'
                        : 'segmented-control__option'
                    }
                    onClick={() =>
                      void updateSettings((current) => ({
                        ...current,
                        ui: {
                          ...current.ui,
                          connectionBadgeVisibility: mode,
                        },
                      }))
                    }
                  >
                    {t(`settingsWindow.connectionBadgeVisibility.${mode}`)}
                  </button>
                ))}
              </div>
            </div>
            <Toggle
              checked={settings.ui.hideSettingsButton}
              onChange={(nextValue) =>
                void updateSettings((current) => ({
                  ...current,
                  ui: {
                    ...current.ui,
                    hideSettingsButton: nextValue,
                  },
                }))
              }
              label={t('settingsWindow.sections.ui.hideSettingsButton')}
              description={t(
                'settingsWindow.sections.ui.hideSettingsButtonDescription',
              )}
            />
            <Toggle
              checked={settings.ui.hideCloseButton}
              onChange={(nextValue) =>
                void updateSettings((current) => ({
                  ...current,
                  ui: {
                    ...current.ui,
                    hideCloseButton: nextValue,
                  },
                }))
              }
              label={t('settingsWindow.sections.ui.hideCloseButton')}
              description={t(
                'settingsWindow.sections.ui.hideCloseButtonDescription',
              )}
            />
          </SettingsSection>

          <SettingsSection
            title={t('settingsWindow.sections.size.title')}
            description={t('settingsWindow.sections.size.description')}
          >
            <div className="segmented-control widget-size-control">
              <span className="segmented-control__label">
                {t('settingsWindow.sections.size.mode')}
              </span>
              <span className="segmented-control__description">
                {t('settingsWindow.sections.size.modeDescription')}
              </span>
              <div
                className="segmented-control__options"
                role="group"
                aria-label={t('settingsWindow.sections.size.mode')}
              >
                {(['compact', 'default', 'large', 'custom'] as const).map(
                  (mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-label={t(`settingsWindow.widgetSizeMode.${mode}`)}
                      aria-pressed={settings.ui.widgetSizeMode === mode}
                      className={
                        settings.ui.widgetSizeMode === mode
                          ? 'segmented-control__option segmented-control__option--active'
                          : 'segmented-control__option'
                      }
                      onClick={() =>
                        void updateSettings((current) => ({
                          ...current,
                          ui: {
                            ...current.ui,
                            widgetSizeMode: mode,
                          },
                        }))
                      }
                    >
                      <span>{t(`settingsWindow.widgetSizeMode.${mode}`)}</span>
                      {mode !== 'custom' ? (
                        <small>
                          {t(`settingsWindow.widgetSizeModeScale.${mode}`)}
                        </small>
                      ) : null}
                    </button>
                  ),
                )}
              </div>
            </div>

            {settings.ui.widgetSizeMode === 'custom' ? (
              <div className="widget-size-fields">
                <p
                  id="widget-size-proportion-hint"
                  className="widget-size-fields__hint"
                >
                  {t('settingsWindow.sections.size.proportionLocked')}
                </p>
                <div className="widget-size-fields__grid">
                  <label className="widget-size-field" htmlFor="widget-width">
                    <span>{t('settingsWindow.sections.size.width')}</span>
                    <span className="widget-size-field__input-wrap">
                      <input
                        key={`widget-width-${widgetDimensions.width}`}
                        id="widget-width"
                        className="settings-field__input widget-size-field__input"
                        type="number"
                        inputMode="numeric"
                        min={minimumWidgetDimensions.width}
                        max={maximumWidgetDimensions.width}
                        step="1"
                        defaultValue={widgetDimensions.width}
                        aria-label={t('settingsWindow.sections.size.width')}
                        aria-describedby="widget-size-proportion-hint"
                        onBlur={(event) =>
                          commitCustomWidgetScale(
                            getCustomWidgetScaleFromWidth(
                              Number(event.currentTarget.value),
                            ),
                          )
                        }
                        onKeyDown={handleCustomSizeKeyDown}
                      />
                      <span aria-hidden="true">
                        {t('settingsWindow.sections.size.pixelUnit')}
                      </span>
                    </span>
                  </label>
                  <label
                    className="widget-size-field"
                    htmlFor="widget-height"
                  >
                    <span>{t('settingsWindow.sections.size.height')}</span>
                    <span className="widget-size-field__input-wrap">
                      <input
                        key={`widget-height-${widgetDimensions.height}`}
                        id="widget-height"
                        className="settings-field__input widget-size-field__input"
                        type="number"
                        inputMode="numeric"
                        min={minimumWidgetDimensions.height}
                        max={maximumWidgetDimensions.height}
                        step="1"
                        defaultValue={widgetDimensions.height}
                        aria-label={t('settingsWindow.sections.size.height')}
                        aria-describedby="widget-size-proportion-hint"
                        onBlur={(event) =>
                          commitCustomWidgetScale(
                            getCustomWidgetScaleFromHeight(
                              Number(event.currentTarget.value),
                            ),
                          )
                        }
                        onKeyDown={handleCustomSizeKeyDown}
                      />
                      <span aria-hidden="true">
                        {t('settingsWindow.sections.size.pixelUnit')}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection
            title={t('settingsWindow.sections.appearance.title')}
            description={t('settingsWindow.sections.appearance.description')}
          >
            {renderOpacityControl('windowSurfaceOpacity', 'windowSurface')}
            {renderOpacityControl(
              'artworkBackgroundOpacity',
              'artworkBackground',
            )}
            {renderOpacityControl('artworkGradientOpacity', 'gradientOverlay')}
          </SettingsSection>

          <SettingsSection
            title={t('settingsWindow.sections.window.title')}
            description={t('settingsWindow.sections.window.description')}
          >
            <Toggle
              checked={settings.window.alwaysOnTop}
              onChange={(nextValue) =>
                void updateSettings((current) => ({
                  ...current,
                  window: {
                    ...current.window,
                    alwaysOnTop: nextValue,
                  },
                }))
              }
              label={t('settingsWindow.sections.window.alwaysOnTop')}
              description={t(
                'settingsWindow.sections.window.alwaysOnTopDescription',
              )}
            />
            <Toggle
              checked={settings.window.launchOnStartup}
              onChange={(nextValue) =>
                void updateSettings((current) => ({
                  ...current,
                  window: {
                    ...current.window,
                    launchOnStartup: nextValue,
                  },
                }))
              }
              label={t('settingsWindow.sections.window.startup')}
              description={t(
                'settingsWindow.sections.window.startupDescription',
              )}
            />
            <div className="segmented-control segmented-control--split">
              <span className="segmented-control__label">
                {t('settingsWindow.sections.window.closeButtonAction')}
              </span>
              <div className="segmented-control__options" role="tablist">
                {(['exit', 'hideToTray'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={
                      settings.window.closeButtonAction === mode
                        ? 'segmented-control__option segmented-control__option--active'
                        : 'segmented-control__option'
                    }
                    onClick={() =>
                      void updateSettings((current) => ({
                        ...current,
                        window: {
                          ...current.window,
                          closeButtonAction: mode,
                        },
                      }))
                    }
                  >
                    {t(`settingsWindow.closeButtonAction.${mode}`)}
                  </button>
                ))}
              </div>
            </div>
          </SettingsSection>

          {import.meta.env.DEV ? (
            <SettingsSection
              title={t('settingsWindow.sections.dev.title')}
              description={t('settingsWindow.sections.dev.description')}
            >
              <div className="segmented-control">
                <span className="segmented-control__label">
                  {t('settingsWindow.sections.dev.sourceMode')}
                </span>
                <div className="segmented-control__options">
                  {(['auto', 'real', 'simulator'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={
                        settings.api.sourceMode === mode
                          ? 'segmented-control__option segmented-control__option--active'
                          : 'segmented-control__option'
                      }
                      onClick={() =>
                        void updateSettings((current) => ({
                          ...current,
                          api: {
                            ...current.api,
                            sourceMode: mode,
                          },
                        }))
                      }
                    >
                      {t(`settingsWindow.sourceMode.${mode}`)}
                    </button>
                  ))}
                </div>
              </div>
              <SettingsRow>
                <span className="settings-row__label">
                  {t('settingsWindow.sections.dev.resolvedMode')}
                </span>
                <span className="settings-row__value">
                  {t(`settingsWindow.sourceMode.${resolvedSourceMode}`)}
                </span>
              </SettingsRow>
            </SettingsSection>
          ) : null}

          <SettingsSection title={t('settingsWindow.sections.about.title')}>
            <p className="settings-about__version">
              {t('settingsWindow.sections.about.version')}: {APP_VERSION}
            </p>
            <div className="settings-actions-row">
              <button
                className="secondary-button"
                type="button"
                onClick={() => void openRepository()}
              >
                <GitHubIcon />
                <span>{t('settingsWindow.actions.openRepo')}</span>
              </button>
              <button
                className={
                  debugMockModeActive ? 'primary-button' : 'secondary-button'
                }
                type="button"
                onClick={() => void toggleDebugMockMode()}
              >
                <SparkIcon />
                <span>
                  {debugMockModeActive
                    ? t('settingsWindow.actions.stopDebugMockMode')
                    : t('settingsWindow.actions.runDebugMockMode')}
                </span>
              </button>
            </div>
          </SettingsSection>
        </div>
      </div>
    </main>
  );
};
