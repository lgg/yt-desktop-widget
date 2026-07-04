import { type KeyboardEvent, useEffect, useState } from 'react';

import { APP_VERSION } from '@/app/defaults';
import { useAppModel } from '@/app/AppProvider';
import { hideCurrentAppWindow } from '@/app/windowController';
import { useI18n } from '@/app/i18n';
import { ArtworkBackground } from '@/components/ArtworkBackground';
import { CloseIcon, GitHubIcon, RefreshIcon, SparkIcon } from '@/components/icons';
import { SettingsSection, SettingsRow, Toggle } from '@/components/settings/SettingsSection';

const formatEndpoint = (host: string, port: number) => `${host}:${port}`;

const parseEndpoint = (value: string): { host: string; port: number } | null => {
  const trimmed = value.trim();
  const separatorIndex = trimmed.lastIndexOf(':');

  if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) {
    return null;
  }

  const host = trimmed.slice(0, separatorIndex).trim();
  const portValue = Number.parseInt(trimmed.slice(separatorIndex + 1).trim(), 10);

  if (!host || !Number.isInteger(portValue) || portValue < 1 || portValue > 65535) {
    return null;
  }

  return {
    host,
    port: portValue,
  };
};

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
  const [endpointDraft, setEndpointDraft] = useState(formatEndpoint(settings.api.host, settings.api.port));
  const [endpointError, setEndpointError] = useState<string | null>(null);
  const debugMockModeActive = settings.api.sourceMode === 'simulator';

  useEffect(() => {
    setEndpointDraft(formatEndpoint(settings.api.host, settings.api.port));
    setEndpointError(null);
  }, [settings.api.host, settings.api.port]);

  const commitEndpoint = async () => {
    const parsed = parseEndpoint(endpointDraft);
    if (!parsed) {
      setEndpointError(t('settingsWindow.sections.api.endpointInvalid'));
      return;
    }

    setEndpointError(null);

    if (parsed.host === settings.api.host && parsed.port === settings.api.port) {
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

  return (
    <main data-tauri-drag-region className="settings-window drag-region">
      <div className="settings-window__content">
        <ArtworkBackground
          artworkUrl={session.lastKnownPlayback?.coverUrl ?? null}
          fallbackClassName="settings-window__background"
        />
        <header className="settings-window__header">
          <div data-tauri-drag-region className="settings-window__drag-anchor drag-region">
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
              <button className="secondary-button" type="button" onClick={() => void reconnect()}>
                <RefreshIcon />
                <span>{t('settingsWindow.actions.reconnect')}</span>
              </button>
            }
          >
            <div className="settings-field">
              <label className="settings-field__label" htmlFor="companion-endpoint">
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
                placeholder={t('settingsWindow.sections.api.endpointPlaceholder')}
                onChange={(event) => setEndpointDraft(event.target.value)}
                onBlur={() => {
                  void commitEndpoint();
                }}
                onKeyDown={handleEndpointKeyDown}
              />
              {endpointError ? <p className="settings-field__hint settings-field__hint--error">{endpointError}</p> : null}
            </div>
            <div className="settings-row-grid settings-row-grid--status">
              <SettingsRow className="settings-row--stacked settings-row--status">
                <span className="settings-row__label">{t('settingsWindow.sections.api.connected')}</span>
                <span className="settings-row__value">{t(`status.${session.connection.status}`)}</span>
              </SettingsRow>
              <SettingsRow className="settings-row--stacked settings-row--status">
                <span className="settings-row__label">{t('settingsWindow.sections.api.paired')}</span>
                <span className="settings-row__value">
                  {session.connection.hasStoredAuth
                    ? t('settingsWindow.sections.api.pairedYes')
                    : t('settingsWindow.sections.api.pairedNo')}
                </span>
              </SettingsRow>
            </div>
            <div className="settings-actions-row">
              <button className="secondary-button" type="button" onClick={() => void generateAuthCode()}>
                {t('settingsWindow.actions.pair')}
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => void confirmAuthentication()}
                disabled={!session.connection.authCode}
              >
                {t('settingsWindow.actions.confirmPair')}
              </button>
              <button className="ghost-button" type="button" onClick={() => void clearAuth()}>
                {t('settingsWindow.actions.clearAuth')}
              </button>
            </div>
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
              description={t('settingsWindow.sections.ui.hideControlsDescription')}
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
              description={t('settingsWindow.sections.ui.hideProgressDescription')}
            />
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
              description={t('settingsWindow.sections.ui.hideSettingsButtonDescription')}
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
              description={t('settingsWindow.sections.ui.hideCloseButtonDescription')}
            />
            <div className="segmented-control">
              <span className="segmented-control__label">{t('settingsWindow.sections.ui.theme')}</span>
              <div className="segmented-control__options" role="tablist">
                {(['dark', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
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
              description={t('settingsWindow.sections.window.alwaysOnTopDescription')}
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
              description={t('settingsWindow.sections.window.startupDescription')}
            />
            <div className="segmented-control segmented-control--split">
              <span className="segmented-control__label">{t('settingsWindow.sections.window.closeButtonAction')}</span>
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
                <span className="segmented-control__label">{t('settingsWindow.sections.dev.sourceMode')}</span>
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
                <span className="settings-row__label">Resolved mode</span>
                <span className="settings-row__value">{resolvedSourceMode}</span>
              </SettingsRow>
            </SettingsSection>
          ) : null}

          <SettingsSection title={t('settingsWindow.sections.about.title')}>
            <p className="settings-about__version">
              {t('settingsWindow.sections.about.version')}: {APP_VERSION}
            </p>
            <div className="settings-actions-row">
              <button className="secondary-button" type="button" onClick={() => void openRepository()}>
                <GitHubIcon />
                <span>{t('settingsWindow.actions.openRepo')}</span>
              </button>
              <button
                className={debugMockModeActive ? 'primary-button' : 'secondary-button'}
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