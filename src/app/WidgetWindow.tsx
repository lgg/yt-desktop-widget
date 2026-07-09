import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAppModel } from '@/app/AppProvider';
import { useI18n } from '@/app/i18n';
import { setMainAppWindowHeight } from '@/app/windowController';
import { ArtworkBackground } from '@/components/ArtworkBackground';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { CloseIcon, SettingsIcon, SparkIcon } from '@/components/icons';
import { CoverCard } from '@/components/widget/CoverCard';
import { ProgressScrubber } from '@/components/widget/ProgressScrubber';
import { TransportControls } from '@/components/widget/TransportControls';
import { WidgetStateCard } from '@/components/widget/WidgetStateCard';
import { isTauriRuntime } from '@/utils/runtime';
import { formatArtistLine } from '@/utils/time';

const getStatusLabel = (
  t: (key: string) => string,
  status: ReturnType<typeof useAppModel>['session']['connection']['status'],
) => {
  switch (status) {
    case 'connected':
      return t('status.connected');
    case 'auth_required':
      return t('status.auth_required');
    case 'authenticating':
      return t('status.authenticating');
    case 'reconnecting':
      return t('status.reconnecting');
    case 'error':
      return t('status.error');
    case 'disconnected':
      return t('status.disconnected');
    case 'discovering':
    default:
      return t('status.discovering');
  }
};

export const WidgetWindow = () => {
  const {
    ready,
    session,
    settings,
    reconnect,
    generateAuthCode,
    confirmAuthentication,
    sendCommand,
    openSettings,
    closeWidget,
  } = useAppModel();
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const syncHeightRef = useRef<() => void>(() => undefined);
  const playback = session.playback ?? session.lastKnownPlayback;
  const controlsVisible = hovered && !settings.ui.hidePlaybackControls && !!playback;
  const progressVisible = !settings.ui.hideProgressBar && !!playback;
  const settingsButtonVisible = !settings.ui.hideSettingsButton || hovered;
  const closeButtonVisible = !settings.ui.hideCloseButton || hovered;
  const canSendCommands = session.connection.status === 'connected' && !!session.playback;
  const titleLine = playback?.title ?? t('widget.states.disconnected.title');
  const artistLine = playback ? formatArtistLine(playback.artists) : session.connection.detail;
  const coverState =
    session.connection.status === 'discovering'
      ? {
          eyebrow: t('widget.states.discovering.eyebrow'),
          title: t('widget.states.discovering.title'),
        }
      : session.connection.status === 'disconnected'
        ? {
            eyebrow: t('widget.states.disconnected.eyebrow'),
            title: t('widget.states.disconnected.title'),
          }
        : session.connection.status === 'reconnecting'
          ? {
              eyebrow: t('widget.states.reconnecting.eyebrow'),
              title: t('widget.states.reconnecting.title'),
            }
          : session.connection.status === 'error'
            ? {
                eyebrow: t('widget.states.error.eyebrow'),
                title: t('widget.states.error.title'),
              }
            : null;

  const syncHeightSoon = () => {
    syncHeightRef.current();
    window.setTimeout(() => syncHeightRef.current(), 0);
    window.setTimeout(() => syncHeightRef.current(), 180);
  };

  const handleReconnect = async () => {
    try {
      await reconnect();
    } finally {
      syncHeightSoon();
    }
  };

  const runWindowAction = (action: () => Promise<void>) => {
    void action().catch((error) => {
      console.error('Widget window action failed.', error);
    });
  };

  const buildWindowActionClick =
    (action: () => Promise<void>) =>
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      runWindowAction(action);
    };

  const buildWindowActionKeyDown =
    (action: () => Promise<void>) =>
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      runWindowAction(action);
    };

  useEffect(() => {
    if (!isTauriRuntime()) {
      return undefined;
    }

    const layout = layoutRef.current;
    const ResizeObserverCtor = window.ResizeObserver;
    const MutationObserverCtor = window.MutationObserver;
    if (!layout || !ResizeObserverCtor || !MutationObserverCtor) {
      return undefined;
    }

    let frameId = 0;
    let lastHeight = 0;

    const syncHeight = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const nextLayout = layoutRef.current;
        if (!nextLayout) {
          return;
        }

        const nextHeight = Math.ceil(nextLayout.scrollHeight + 2);
        if (Math.abs(nextHeight - lastHeight) < 1) {
          return;
        }

        lastHeight = nextHeight;
        void setMainAppWindowHeight(nextHeight);
      });
    };

    syncHeightRef.current = syncHeight;
    syncHeight();

    const observer = new ResizeObserverCtor(() => {
      syncHeight();
    });
    observer.observe(layout);

    const mutationObserver = new MutationObserverCtor(() => {
      syncHeight();
    });
    mutationObserver.observe(layout, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, []);
  useEffect(() => {
    syncHeightRef.current();
  }, [
    session.connection.status,
    session.connection.detail,
    session.connection.authCode,
    playback?.id,
    playback?.playbackState,
    ready,
  ]);
  const renderStateCard = () => {
    switch (session.connection.status) {
      case 'discovering':
        return <WidgetStateCard body={t('widget.states.discovering.body')} compact />;
      case 'auth_required':
        return (
          <WidgetStateCard
            eyebrow={t('widget.states.auth_required.eyebrow')}
            title={t('widget.states.auth_required.title')}
            body={t('widget.states.auth_required.body')}
            actions={
              <>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void generateAuthCode()}
                >
                  {session.connection.authCode
                    ? t('widget.auth.regenerate')
                    : t('widget.auth.generate')}
                </button>
                {session.connection.authCode ? (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => void confirmAuthentication()}
                  >
                    {t('widget.auth.confirm')}
                  </button>
                ) : null}
              </>
            }
          />
        );
      case 'authenticating':
        return (
          <WidgetStateCard
            eyebrow={t('widget.states.authenticating.eyebrow')}
            title={t('widget.states.authenticating.title')}
            body={t('widget.states.authenticating.body')}
            actions={
              session.connection.authCode ? (
                <div className="code-chip">
                  <span>{t('widget.auth.codeLabel')}</span>
                  <strong>{session.connection.authCode}</strong>
                </div>
              ) : null
            }
          />
        );
      case 'disconnected':
        return (
          <WidgetStateCard
            body={session.connection.detail ?? t('widget.states.disconnected.body')}
            compact
            actions={
              <button className="secondary-button" type="button" onClick={() => void handleReconnect()}>
                {t('app.retry')}
              </button>
            }
          />
        );
      case 'reconnecting':
        return (
          <WidgetStateCard
            body={session.connection.detail ?? t('widget.states.reconnecting.body')}
            compact
            actions={
              <button className="secondary-button" type="button" onClick={() => void handleReconnect()}>
                {t('app.retry')}
              </button>
            }
          />
        );
      case 'error':
        return (
          <WidgetStateCard
            body={session.connection.detail ?? t('widget.states.error.body')}
            compact
            actions={
              <button className="secondary-button" type="button" onClick={() => void handleReconnect()}>
                {t('app.retry')}
              </button>
            }
          />
        );
      case 'connected':
        if (!session.playback) {
          return (
            <WidgetStateCard
              eyebrow={t('widget.states.empty.eyebrow')}
              title={t('widget.states.empty.title')}
              body={t('widget.states.empty.body')}
            />
          );
        }

        return null;
      default:
        return null;
    }
  };

  return (
    <main
      className="widget-window"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="widget-window__content">
        <ArtworkBackground artworkUrl={playback?.coverUrl ?? null} />
        <div ref={layoutRef} className="widget-window__layout">
          <header className="widget-window__header">
            <div data-tauri-drag-region className="widget-window__drag-anchor drag-region">
              <ConnectionBadge
                status={session.connection.status}
                label={getStatusLabel(t, session.connection.status)}
              />
            </div>
            <div className="widget-window__window-actions no-drag">
              <button
                className={
                  settingsButtonVisible
                    ? 'icon-button widget-window__window-action widget-window__window-action--visible'
                    : 'icon-button widget-window__window-action'
                }
                type="button"
                aria-label={t('widget.actions.openSettings')}
                onClick={buildWindowActionClick(openSettings)}
                onKeyDown={buildWindowActionKeyDown(openSettings)}
              >
                <SettingsIcon />
              </button>
              <button
                className={
                  closeButtonVisible
                    ? 'icon-button widget-window__window-action widget-window__window-action--visible'
                    : 'icon-button widget-window__window-action'
                }
                type="button"
                aria-label={t('widget.actions.closeWidget')}
                onClick={buildWindowActionClick(closeWidget)}
                onKeyDown={buildWindowActionKeyDown(closeWidget)}
              >
                <CloseIcon />
              </button>
            </div>
          </header>

          <section data-tauri-drag-region className="widget-window__hero drag-region">
            <CoverCard artworkUrl={playback?.coverUrl ?? null} title={titleLine}>
              {coverState ? (
                <div className="cover-card__state">
                  <span className="cover-card__state-eyebrow">{coverState.eyebrow}</span>
                  <h2 className="cover-card__state-title">{coverState.title}</h2>
                </div>
              ) : null}
            </CoverCard>
            {!coverState ? (
              <div className="widget-window__meta">
                <h1>{ready ? titleLine : t('app.loading')}</h1>
                <p>{artistLine}</p>
                {playback?.isAdPlaying ? (
                  <div className="inline-pill">
                    <SparkIcon />
                    <span>{t('widget.adPlaying')}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {session.connection.authCode && session.connection.status === 'auth_required' ? (
            <div className="code-chip code-chip--floating">
              <span>{t('widget.auth.codeLabel')}</span>
              <strong>{session.connection.authCode}</strong>
            </div>
          ) : null}

          {renderStateCard()}

          {playback ? (
            <footer className="widget-window__footer">
              <TransportControls
                playbackState={playback.playbackState}
                disabled={!canSendCommands}
                visible={controlsVisible}
                onPrevious={() => void sendCommand({ type: 'previous' })}
                onPlayPause={() => void sendCommand({ type: 'playPause' })}
                onNext={() => void sendCommand({ type: 'next' })}
              />
              <ProgressScrubber
                playback={playback}
                disabled={!canSendCommands || !playback.canSeek}
                visible={progressVisible}
                onSeek={(seconds) => sendCommand({ type: 'seekTo', seconds })}
              />
            </footer>
          ) : null}
        </div>
      </div>
    </main>
  );
};
