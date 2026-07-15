import {
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAppModel } from '@/app/AppProvider';
import { getAppearanceStyle } from '@/app/appearance';
import { getConnectionMessage } from '@/app/connectionMessage';
import { useI18n } from '@/app/i18n';
import { getWidgetBlockVisibilityState } from '@/app/widgetLayout';
import {
  setMainAppWindowSize,
  startCurrentAppWindowDragging,
} from '@/app/windowController';
import {
  WIDGET_BASE_HEIGHT,
  WIDGET_BASE_MAX_HEIGHT,
  WIDGET_BASE_MIN_HEIGHT,
  WIDGET_BASE_WIDTH,
  getWidgetScaleFactor,
  getWidgetWindowSize,
} from '@/app/widgetSize';
import { ArtworkBackground } from '@/components/ArtworkBackground';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import {
  CloseIcon,
  MutedIcon,
  PauseIcon,
  PlayIcon,
  SettingsIcon,
  SparkIcon,
  VolumeIcon,
} from '@/components/icons';
import { CoverCard } from '@/components/widget/CoverCard';
import { ProgressScrubber } from '@/components/widget/ProgressScrubber';
import { RatingControls } from '@/components/widget/RatingControls';
import { TransportControls } from '@/components/widget/TransportControls';
import { WidgetStateCard } from '@/components/widget/WidgetStateCard';
import type { WidgetBlockId } from '@/domain/playback/types';
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

const NON_DRAGGABLE_TARGET_SELECTOR = [
  '.no-drag',
  'a',
  'button',
  'input',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="slider"]',
  '[role="tab"]',
].join(',');

type WidgetWindowStyle = CSSProperties & {
  '--widget-scale': number;
  '--widget-base-width': string;
  '--widget-base-height': string;
};

export const WidgetWindow = () => {
  const {
    ready,
    session,
    settings,
    resolvedSourceMode,
    reconnect,
    generateAuthCode,
    confirmAuthentication,
    sendCommand,
    openSettings,
    closeWidget,
  } = useAppModel();
  const { t } = useI18n();
  const windowsMediaSessionActive =
    resolvedSourceMode === 'real' &&
    settings.api.playbackSource === 'windowsMediaSession';
  const ciderActive = resolvedSourceMode === 'real' && settings.api.playbackSource === 'cider';
  const activePlaybackSource = windowsMediaSessionActive ? 'windowsMediaSession' : ciderActive ? 'cider' : 'companion';
  const sourceStateKey = (
    state: 'discovering' | 'disconnected' | 'reconnecting' | 'error' | 'empty',
    field: 'eyebrow' | 'title' | 'body',
  ) =>
    windowsMediaSessionActive
      ? `widget.windowsMediaStates.${state}.${field}`
      : ciderActive
        ? `widget.ciderStates.${state}.${field}`
      : `widget.states.${state}.${field}`;
  const connectionMessage = getConnectionMessage(
    t,
    session.connection,
    activePlaybackSource,
  );
  const [hovered, setHovered] = useState(false);
  const [focusedWithin, setFocusedWithin] = useState(false);
  const [baseWindowHeight, setBaseWindowHeight] = useState(WIDGET_BASE_HEIGHT);
  const keyboardInteractionRef = useRef(false);
  const widgetRef = useRef<HTMLElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const syncSizeRef = useRef<() => void>(() => undefined);
  const playback = session.playback ?? session.lastKnownPlayback;
  const widgetScale = getWidgetScaleFactor(settings.ui);
  const widgetStyle: WidgetWindowStyle = {
    ...getAppearanceStyle(settings.ui),
    '--widget-scale': widgetScale,
    '--widget-base-width': `${WIDGET_BASE_WIDTH}px`,
    '--widget-base-height': `${baseWindowHeight}px`,
  };
  const interactionActive = hovered || focusedWithin;
  const controlsState = getWidgetBlockVisibilityState(
    settings.ui.playbackControlsVisibility,
    interactionActive,
  );
  const progressState = getWidgetBlockVisibilityState(
    settings.ui.progressBarVisibility,
    interactionActive,
  );
  const trackDetailsState = getWidgetBlockVisibilityState(
    settings.ui.trackDetailsVisibility,
    interactionActive,
  );
  const ratingState = getWidgetBlockVisibilityState(
    settings.ui.likeDislikeVisibility,
    interactionActive,
  );
  const compactArtworkLayout =
    session.connection.status === 'connected' &&
    !!playback &&
    !trackDetailsState.rendered &&
    !playback.isAdPlaying;
  const artworkOnlyLayout =
    compactArtworkLayout &&
    !controlsState.rendered &&
    !ratingState.rendered &&
    !progressState.rendered;
  const progressOnlyLayout =
    compactArtworkLayout &&
    !controlsState.rendered &&
    !ratingState.rendered &&
    progressState.rendered;
  const connectionBadgeRendered =
    settings.ui.connectionBadgeVisibility !== 'hidden';
  const connectionBadgeVisible =
    settings.ui.connectionBadgeVisibility === 'always' ||
    (settings.ui.connectionBadgeVisibility === 'hover' && interactionActive);
  const muteButtonRendered = settings.ui.muteButtonVisibility !== 'hidden';
  const muteButtonVisible =
    settings.ui.muteButtonVisibility === 'always' ||
    (settings.ui.muteButtonVisibility === 'hover' && interactionActive);
  const settingsButtonVisible =
    !settings.ui.hideSettingsButton || interactionActive;
  const closeButtonVisible = !settings.ui.hideCloseButton || interactionActive;
  const canSendCommands =
    session.connection.status === 'connected' && !!session.playback;
  const titleLine =
    playback?.title ??
    t(
      sourceStateKey(
        session.connection.status === 'connected' ? 'empty' : 'disconnected',
        'title',
      ),
    );
  const artistLine = playback
    ? formatArtistLine(playback.artists)
    : (connectionMessage ?? '');
  const coverState =
    session.connection.status === 'discovering'
      ? {
          eyebrow: t(sourceStateKey('discovering', 'eyebrow')),
          title: t(sourceStateKey('discovering', 'title')),
        }
      : session.connection.status === 'disconnected'
        ? {
            eyebrow: t(sourceStateKey('disconnected', 'eyebrow')),
            title: t(sourceStateKey('disconnected', 'title')),
          }
        : session.connection.status === 'reconnecting'
          ? {
              eyebrow: t(sourceStateKey('reconnecting', 'eyebrow')),
              title: t(sourceStateKey('reconnecting', 'title')),
            }
          : session.connection.status === 'error'
            ? {
                eyebrow: t(sourceStateKey('error', 'eyebrow')),
                title: t(sourceStateKey('error', 'title')),
              }
            : null;
  const artworkAction =
    settings.ui.useArtworkAsPlaybackControl && playback && !coverState
      ? {
          label: t(
            playback.playbackState === 'playing'
              ? 'widget.artwork.pause'
              : 'widget.artwork.play',
            { title: titleLine },
          ),
          disabled: !canSendCommands || !playback.canPlayPause,
          visible: interactionActive,
          icon:
            playback.playbackState === 'playing' ? <PauseIcon /> : <PlayIcon />,
          onActivate: () => {
            void sendCommand({ type: 'playPause' });
          },
        }
      : undefined;

  const syncSizeSoon = () => {
    syncSizeRef.current();
    window.setTimeout(() => syncSizeRef.current(), 0);
    window.setTimeout(() => syncSizeRef.current(), 180);
  };

  const handleReconnect = async () => {
    try {
      await reconnect();
    } finally {
      syncSizeSoon();
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

  const handleLayoutMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      event.button !== 0 ||
      (target instanceof Element &&
        target.closest(NON_DRAGGABLE_TARGET_SELECTOR))
    ) {
      return;
    }

    event.preventDefault();
    void startCurrentAppWindowDragging().catch((error) => {
      console.error('Failed to start dragging the widget window.', error);
    });
  };

  const handleBlurCapture = (event: ReactFocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      !(nextTarget instanceof Node) ||
      !event.currentTarget.contains(nextTarget)
    ) {
      setFocusedWithin(false);
    }
  };

  const handleFocusCapture = () => {
    setFocusedWithin(keyboardInteractionRef.current);
  };

  useEffect(() => {
    const clearInteractionState = () => {
      setHovered(false);
      setFocusedWithin(false);
    };

    const markKeyboardInteraction = () => {
      keyboardInteractionRef.current = true;
      if (widgetRef.current?.contains(document.activeElement)) {
        setFocusedWithin(true);
      }
    };
    const markPointerInteraction = () => {
      keyboardInteractionRef.current = false;
      setFocusedWithin(false);
    };

    window.addEventListener('blur', clearInteractionState);
    window.addEventListener('keydown', markKeyboardInteraction, true);
    window.addEventListener('pointerdown', markPointerInteraction, true);
    return () => {
      window.removeEventListener('blur', clearInteractionState);
      window.removeEventListener('keydown', markKeyboardInteraction, true);
      window.removeEventListener('pointerdown', markPointerInteraction, true);
    };
  }, []);

  useEffect(() => {
    const layout = layoutRef.current;
    const ResizeObserverCtor = window.ResizeObserver;
    const MutationObserverCtor = window.MutationObserver;
    if (!layout || !ResizeObserverCtor || !MutationObserverCtor) {
      return undefined;
    }

    let frameId = 0;
    const nativeRuntime = isTauriRuntime();
    let lastWidth = 0;
    let lastHeight = 0;

    const syncSize = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const nextLayout = layoutRef.current;
        if (!nextLayout) {
          return;
        }

        const measuredBaseHeight = Math.ceil(nextLayout.scrollHeight + 2);
        const nextBaseHeight = Math.min(
          WIDGET_BASE_MAX_HEIGHT,
          Math.max(WIDGET_BASE_MIN_HEIGHT, measuredBaseHeight),
        );
        const nextSize = getWidgetWindowSize(nextBaseHeight, settings.ui);
        setBaseWindowHeight((currentHeight) =>
          currentHeight === nextBaseHeight ? currentHeight : nextBaseHeight,
        );

        if (
          Math.abs(nextSize.width - lastWidth) < 1 &&
          Math.abs(nextSize.height - lastHeight) < 1
        ) {
          return;
        }

        lastWidth = nextSize.width;
        lastHeight = nextSize.height;
        if (nativeRuntime) {
          void setMainAppWindowSize(nextSize.width, nextSize.height);
        }
      });
    };

    syncSizeRef.current = syncSize;
    syncSize();

    const observer = new ResizeObserverCtor(() => {
      syncSize();
    });
    observer.observe(layout);

    const mutationObserver = new MutationObserverCtor(() => {
      syncSize();
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
  }, [settings.ui, widgetScale]);
  useEffect(() => {
    syncSizeRef.current();
  }, [
    session.connection.status,
    session.connection.messageKey,
    session.connection.authCode,
    playback?.id,
    playback?.playbackState,
    settings.ui.playbackControlsVisibility,
    settings.ui.progressBarVisibility,
    settings.ui.trackDetailsVisibility,
    settings.ui.likeDislikeVisibility,
    settings.ui.widgetBlockOrder,
    widgetScale,
    ready,
  ]);
  const renderStateCard = () => {
    switch (session.connection.status) {
      case 'discovering':
        return (
          <WidgetStateCard
            body={t(sourceStateKey('discovering', 'body'))}
            compact
          />
        );
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
            body={
              connectionMessage ?? t(sourceStateKey('disconnected', 'body'))
            }
            compact
            actions={
              <button
                className="secondary-button"
                type="button"
                onClick={() => void handleReconnect()}
              >
                {t('app.retry')}
              </button>
            }
          />
        );
      case 'reconnecting':
        return (
          <WidgetStateCard
            body={
              connectionMessage ?? t(sourceStateKey('reconnecting', 'body'))
            }
            compact
            actions={
              <button
                className="secondary-button"
                type="button"
                onClick={() => void handleReconnect()}
              >
                {t('app.retry')}
              </button>
            }
          />
        );
      case 'error':
        return (
          <WidgetStateCard
            body={connectionMessage ?? t(sourceStateKey('error', 'body'))}
            compact
            actions={
              <button
                className="secondary-button"
                type="button"
                onClick={() => void handleReconnect()}
              >
                {t('app.retry')}
              </button>
            }
          />
        );
      case 'connected':
        if (!session.playback) {
          return (
            <WidgetStateCard
              eyebrow={t(sourceStateKey('empty', 'eyebrow'))}
              title={t(sourceStateKey('empty', 'title'))}
              body={t(sourceStateKey('empty', 'body'))}
            />
          );
        }

        return null;
      default:
        return null;
    }
  };

  const renderWidgetBlock = (blockId: WidgetBlockId) => {
    switch (blockId) {
      case 'header':
        return (
          <header
            key={blockId}
            className="widget-window__header widget-block widget-block--header"
            data-widget-block={blockId}
          >
            <div
              className={
                connectionBadgeVisible
                  ? 'widget-window__drag-anchor widget-window__connection-badge'
                  : 'widget-window__drag-anchor widget-window__connection-badge widget-window__connection-badge--hidden'
              }
              aria-hidden={!connectionBadgeVisible}
            >
              {connectionBadgeRendered ? (
                <ConnectionBadge
                  status={session.connection.status}
                  label={getStatusLabel(t, session.connection.status)}
                />
              ) : null}
            </div>
            <div className="widget-window__window-actions no-drag">
              {muteButtonRendered && playback ? (
                <button
                  className={
                    muteButtonVisible
                      ? 'icon-button widget-window__window-action widget-window__window-action--visible'
                      : 'icon-button widget-window__window-action'
                  }
                  type="button"
                  disabled={
                    !canSendCommands || !playback.canMute || !muteButtonVisible
                  }
                  aria-hidden={!muteButtonVisible}
                  aria-label={
                    playback.isMuted
                      ? t('widget.actions.unmute')
                      : t('widget.actions.mute')
                  }
                  onClick={() =>
                    void sendCommand({
                      type: playback.isMuted ? 'unmute' : 'mute',
                    })
                  }
                >
                  {playback.isMuted ? <MutedIcon /> : <VolumeIcon />}
                </button>
              ) : null}
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
        );
      case 'artwork':
        return (
          <section
            key={blockId}
            className="widget-block widget-block--artwork"
            data-widget-block={blockId}
          >
            <CoverCard
              artworkUrl={playback?.coverUrl ?? null}
              title={titleLine}
              action={artworkAction}
            >
              {coverState ? (
                <div className="cover-card__state">
                  <span className="cover-card__state-eyebrow">
                    {coverState.eyebrow}
                  </span>
                  <h2 className="cover-card__state-title">
                    {coverState.title}
                  </h2>
                </div>
              ) : null}
            </CoverCard>
            {!coverState && playback?.isAdPlaying ? (
              <div className="inline-pill">
                <SparkIcon />
                <span>{t('widget.adPlaying')}</span>
              </div>
            ) : null}
          </section>
        );
      case 'trackDetails':
        if (!playback || !trackDetailsState.rendered || coverState) {
          return null;
        }
        return (
          <div
            key={blockId}
            className={
              trackDetailsState.visible
                ? 'widget-block widget-block--track-details'
                : 'widget-block widget-block--track-details widget-block--hidden'
            }
            data-widget-block={blockId}
            aria-hidden={!trackDetailsState.visible}
          >
            <div className="widget-window__meta">
              <h1>{ready ? titleLine : t('app.loading')}</h1>
              <p>{artistLine}</p>
            </div>
          </div>
        );
      case 'likeDislike':
        if (!playback || !ratingState.rendered) {
          return null;
        }
        return (
          <div
            key={blockId}
            className="widget-block widget-block--rating"
            data-widget-block={blockId}
          >
            <RatingControls
              likeStatus={playback.likeStatus}
              disabled={!canSendCommands || !playback.canRate}
              visible={ratingState.visible}
              onToggleLike={() => void sendCommand({ type: 'toggleLike' })}
              onToggleDislike={() =>
                void sendCommand({ type: 'toggleDislike' })
              }
            />
          </div>
        );
      case 'playbackControls':
        if (!playback || !controlsState.rendered) {
          return null;
        }
        return (
          <div
            key={blockId}
            className="widget-block widget-block--playback-controls"
            data-widget-block={blockId}
          >
            <TransportControls
              playbackState={playback.playbackState}
              disabled={!canSendCommands}
              previousDisabled={!playback.canGoPrevious}
              playPauseDisabled={!playback.canPlayPause}
              nextDisabled={!playback.canGoNext}
              visible={controlsState.visible}
              onPrevious={() => void sendCommand({ type: 'previous' })}
              onPlayPause={() => void sendCommand({ type: 'playPause' })}
              onNext={() => void sendCommand({ type: 'next' })}
            />
          </div>
        );
      case 'progress':
        if (!playback || !progressState.rendered) {
          return null;
        }
        return (
          <div
            key={blockId}
            className={
              progressOnlyLayout
                ? 'widget-block widget-block--progress widget-block--progress-only'
                : 'widget-block widget-block--progress'
            }
            data-widget-block={blockId}
            aria-hidden={!progressState.visible}
          >
            <ProgressScrubber
              playback={playback}
              disabled={!canSendCommands || !playback.canSeek}
              visible={progressState.visible}
              onSeek={(seconds) => sendCommand({ type: 'seekTo', seconds })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main
      ref={widgetRef}
      className="widget-window"
      style={widgetStyle}
      onPointerEnter={() => setHovered(true)}
      onPointerMove={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <div
        className={
          widgetScale === 1
            ? 'widget-window__content'
            : 'widget-window__content widget-window__content--scaled'
        }
      >
        <ArtworkBackground artworkUrl={playback?.coverUrl ?? null} />
        <div
          ref={layoutRef}
          onMouseDown={handleLayoutMouseDown}
          className={
            artworkOnlyLayout
              ? 'widget-window__layout widget-window__layout--artwork-only'
              : progressOnlyLayout
                ? 'widget-window__layout widget-window__layout--progress-only'
                : 'widget-window__layout'
          }
        >
          {settings.ui.widgetBlockOrder.map(renderWidgetBlock)}

          {session.connection.authCode &&
          session.connection.status === 'auth_required' ? (
            <div className="code-chip code-chip--floating">
              <span>{t('widget.auth.codeLabel')}</span>
              <strong>{session.connection.authCode}</strong>
            </div>
          ) : null}

          {renderStateCard()}
        </div>
      </div>
    </main>
  );
};
