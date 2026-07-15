import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppModel } from '@/app/AppProvider';
import { I18nProvider } from '@/app/i18n';
import { WidgetWindow } from '@/app/WidgetWindow';
import { DEFAULT_WIDGET_BLOCK_ORDER } from '@/app/widgetLayout';

const mockUseAppModel = vi.fn<() => AppModel>();
const resolvedAction = () => Promise.resolve();
const runtimeMock = vi.hoisted(() => ({ isTauri: false }));
const windowControllerMocks = vi.hoisted(() => ({
  setMainAppWindowSize: vi.fn(() => Promise.resolve()),
  startCurrentAppWindowDragging: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/app/AppProvider', () => ({
  useAppModel: (): AppModel => mockUseAppModel(),
}));

vi.mock('@/utils/runtime', () => ({
  isTauriRuntime: () => runtimeMock.isTauri,
}));

vi.mock('@/app/windowController', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/windowController')>()),
  ...windowControllerMocks,
}));

const createConnectedModel = ({
  playbackState = 'playing',
  hidePlaybackControls = false,
  showPlaybackControlsOnHover = true,
  hideProgressBar = false,
  connectionBadgeVisibility = 'always',
  hideTrackDetails = false,
  playbackControlsVisibility,
  progressBarVisibility,
  trackDetailsVisibility,
  likeDislikeVisibility = 'hidden',
  muteButtonVisibility = 'hidden',
  widgetBlockOrder = [...DEFAULT_WIDGET_BLOCK_ORDER],
  useArtworkAsPlaybackControl = false,
  widgetSizeMode = 'default',
  customWidgetScalePercentage = 100,
}: {
  playbackState?: 'playing' | 'paused';
  hidePlaybackControls?: boolean;
  showPlaybackControlsOnHover?: boolean;
  hideProgressBar?: boolean;
  connectionBadgeVisibility?: 'always' | 'hover' | 'hidden';
  hideTrackDetails?: boolean;
  playbackControlsVisibility?:
    | 'always'
    | 'hoverReserved'
    | 'hoverDynamic'
    | 'hidden';
  progressBarVisibility?:
    | 'always'
    | 'hoverReserved'
    | 'hoverDynamic'
    | 'hidden';
  trackDetailsVisibility?:
    | 'always'
    | 'hoverReserved'
    | 'hoverDynamic'
    | 'hidden';
  likeDislikeVisibility?:
    | 'always'
    | 'hoverReserved'
    | 'hoverDynamic'
    | 'hidden';
  muteButtonVisibility?: 'always' | 'hover' | 'hidden';
  widgetBlockOrder?: AppModel['settings']['ui']['widgetBlockOrder'];
  useArtworkAsPlaybackControl?: boolean;
  widgetSizeMode?: 'compact' | 'default' | 'large' | 'custom';
  customWidgetScalePercentage?: number;
} = {}): AppModel => ({
  ready: true,
  settings: {
    api: {
      host: '127.0.0.1',
      port: 9863,
      sourceMode: 'simulator',
      playbackSource: 'companion',
    },
    ui: {
      playbackControlsVisibility:
        playbackControlsVisibility ??
        (hidePlaybackControls
          ? 'hidden'
          : showPlaybackControlsOnHover
            ? 'hoverReserved'
            : 'always'),
      progressBarVisibility:
        progressBarVisibility ?? (hideProgressBar ? 'hidden' : 'always'),
      trackDetailsVisibility:
        trackDetailsVisibility ?? (hideTrackDetails ? 'hidden' : 'always'),
      likeDislikeVisibility,
      connectionBadgeVisibility,
      muteButtonVisibility,
      widgetBlockOrder,
      collapsedSettingsSections: [],
      useArtworkAsPlaybackControl,
      hideSettingsButton: true,
      hideCloseButton: true,
      windowSurfaceOpacity: 100,
      artworkBackgroundOpacity: 100,
      artworkGradientOpacity: 100,
      widgetSizeMode,
      customWidgetScalePercentage,
      themeMode: 'dark',
      locale: 'en',
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
    connection: {
      status: 'connected',
      hasStoredAuth: true,
      retryAttempt: 0,
      retryAt: null,
    },
    playback: {
      id: 'track-1',
      title: 'Night Train Window',
      artists: ['Moseca Harbor'],
      album: 'Blue Static',
      coverUrl: 'https://example.com/cover.png',
      durationSeconds: 248,
      elapsedSeconds: 12,
      progressRatio: 0.05,
      volume: 55,
      isMuted: false,
      likeStatus: 'indifferent',
      playbackState,
      isAdPlaying: false,
      isLive: false,
      canSeek: true,
      canPlayPause: true,
      canGoPrevious: true,
      canGoNext: true,
      canMute: true,
      canRate: true,
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
  setCiderToken: vi.fn(resolvedAction),
  sendCommand: vi.fn(resolvedAction),
  openSettings: vi.fn(resolvedAction),
  closeWidget: vi.fn(resolvedAction),
  toggleDebugMockMode: vi.fn(resolvedAction),
  openRepository: vi.fn(resolvedAction),
});

describe('WidgetWindow', () => {
  afterEach(() => {
    runtimeMock.isTauri = false;
    windowControllerMocks.setMainAppWindowSize.mockReset();
    windowControllerMocks.startCurrentAppWindowDragging.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the connected playback view', () => {
    mockUseAppModel.mockReturnValue(createConnectedModel());

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(screen.getByText('Night Train Window')).toBeInTheDocument();
    expect(screen.getByText('Moseca Harbor')).toBeInTheDocument();
    fireEvent.pointerEnter(
      document.querySelector('.widget-window') as HTMLElement,
    );
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('applies the persisted appearance percentages to the widget root', () => {
    const connectedModel = createConnectedModel();
    Object.assign(connectedModel.settings.ui, {
      windowSurfaceOpacity: 72,
      artworkBackgroundOpacity: 48,
      artworkGradientOpacity: 35,
    });
    mockUseAppModel.mockReturnValue(connectedModel);

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(document.querySelector('.widget-window')).toHaveStyle({
      '--window-surface-opacity': '0.72',
      '--artwork-background-opacity': '0.48',
      '--artwork-gradient-opacity': '0.35',
    });
  });

  it('keeps Default at scale one and applies one uniform custom scale variable', () => {
    mockUseAppModel.mockReturnValue(createConnectedModel());
    const { rerender } = render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );
    expect(document.querySelector('.widget-window')).toHaveStyle({
      '--widget-scale': '1',
    });
    expect(document.querySelector('.widget-window__content')).not.toHaveClass(
      'widget-window__content--scaled',
    );

    mockUseAppModel.mockReturnValue(
      createConnectedModel({
        widgetSizeMode: 'custom',
        customWidgetScalePercentage: 137,
      }),
    );
    rerender(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );
    expect(document.querySelector('.widget-window')).toHaveStyle({
      '--widget-scale': '1.37',
    });
    expect(document.querySelector('.widget-window__content')).toHaveClass(
      'widget-window__content--scaled',
    );
  });

  it('keeps paused playback compact without a redundant state card', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ playbackState: 'paused' }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    fireEvent.pointerEnter(
      document.querySelector('.widget-window') as HTMLElement,
    );
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.queryByText('Playback is paused')).not.toBeInTheDocument();
  });

  it('dispatches one command for each transport activation', () => {
    const model = createConnectedModel();
    mockUseAppModel.mockReturnValue(model);

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    fireEvent.pointerEnter(
      document.querySelector('.widget-window') as HTMLElement,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(model.sendCommand).toHaveBeenNthCalledWith(1, { type: 'previous' });
    expect(model.sendCommand).toHaveBeenNthCalledWith(2, { type: 'playPause' });
    expect(model.sendCommand).toHaveBeenNthCalledWith(3, { type: 'next' });
    expect(model.sendCommand).toHaveBeenCalledTimes(3);
  });

  it('renders every enabled primary block in the persisted order', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({
        playbackControlsVisibility: 'always',
        likeDislikeVisibility: 'always',
        widgetBlockOrder: [
          'progress',
          'header',
          'artwork',
          'trackDetails',
          'likeDislike',
          'playbackControls',
        ],
      }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      [...document.querySelectorAll('[data-widget-block]')].map((element) =>
        element.getAttribute('data-widget-block'),
      ),
    ).toEqual([
      'progress',
      'header',
      'artwork',
      'trackDetails',
      'likeDislike',
      'playbackControls',
    ]);
  });

  it('uses the current Companion mute state and never sends a numeric volume', () => {
    const model = createConnectedModel({ muteButtonVisibility: 'always' });
    mockUseAppModel.mockReturnValue(model);
    const view = render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    expect(model.sendCommand).toHaveBeenLastCalledWith({ type: 'mute' });

    if (model.session.playback) {
      model.session.playback.volume = 0;
      model.session.playback.isMuted = true;
    }
    mockUseAppModel.mockReturnValue(model);
    view.rerender(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
    expect(model.sendCommand).toHaveBeenLastCalledWith({ type: 'unmute' });
    expect(model.sendCommand).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setVolume' }),
    );
  });

  it('shows active Like/Dislike state and dispatches typed toggle commands', () => {
    const model = createConnectedModel({
      likeDislikeVisibility: 'always',
    });
    if (model.session.playback) {
      model.session.playback.likeStatus = 'liked';
    }
    mockUseAppModel.mockReturnValue(model);

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const like = screen.getByRole('button', { name: 'Like' });
    const dislike = screen.getByRole('button', { name: 'Dislike' });
    expect(like).toHaveAttribute('aria-pressed', 'true');
    expect(dislike).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(like);
    fireEvent.click(dislike);
    expect(model.sendCommand).toHaveBeenNthCalledWith(1, {
      type: 'toggleLike',
    });
    expect(model.sendCommand).toHaveBeenNthCalledWith(2, {
      type: 'toggleDislike',
    });
  });

  it('uses Windows Media Session copy when no compatible player is active', () => {
    const model = createConnectedModel();
    model.settings.api.playbackSource = 'windowsMediaSession';
    model.settings.api.sourceMode = 'real';
    model.resolvedSourceMode = 'real';
    model.session.playback = null;

    mockUseAppModel.mockReturnValue(model);
    render(
      <I18nProvider locale="en">
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      screen.getByText('Start playback in a compatible Windows media app.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/YTMDesktop/i)).not.toBeInTheDocument();
  });

  it('keeps unsupported rating controls disabled and omits unsupported mute', () => {
    const model = createConnectedModel({
      likeDislikeVisibility: 'always',
      muteButtonVisibility: 'always',
    });
    Object.assign(model.session.playback ?? {}, {
      canRate: false,
      canMute: false,
    });
    mockUseAppModel.mockReturnValue(model);

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const like = screen.getByRole('button', { name: 'Like' });
    const dislike = screen.getByRole('button', { name: 'Dislike' });
    expect(
      screen.queryByRole('button', { name: 'Mute' }),
    ).not.toBeInTheDocument();
    expect(like).toBeDisabled();
    expect(dislike).toBeDisabled();

    fireEvent.click(like);
    fireEvent.click(dislike);
    expect(model.sendCommand).not.toHaveBeenCalled();
  });

  it('never reveals hover-only mute when the active source lacks mute capability', () => {
    const model = createConnectedModel({ muteButtonVisibility: 'hover' });
    model.settings.api.sourceMode = 'real';
    model.settings.api.playbackSource = 'cider';
    model.resolvedSourceMode = 'real';
    if (model.session.playback) {
      model.session.playback.canMute = false;
    }
    mockUseAppModel.mockReturnValue(model);

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    fireEvent.pointerEnter(
      document.querySelector('.widget-window') as HTMLElement,
    );
    expect(
      screen.queryByRole('button', { name: 'Mute' }),
    ).not.toBeInTheDocument();
  });

  it('reveals supported hover-only mute only inside the interaction boundary', () => {
    const model = createConnectedModel({ muteButtonVisibility: 'hover' });
    mockUseAppModel.mockReturnValue(model);
    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const widget = document.querySelector('.widget-window') as HTMLElement;
    expect(
      screen.queryByRole('button', { name: 'Mute' }),
    ).not.toBeInTheDocument();
    fireEvent.pointerEnter(widget);
    expect(screen.getByRole('button', { name: 'Mute' })).toBeVisible();
    fireEvent.pointerLeave(widget);
    expect(
      screen.queryByRole('button', { name: 'Mute' }),
    ).not.toBeInTheDocument();
  });

  it('renders dynamic-hover blocks only inside the active pointer boundary', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({
        trackDetailsVisibility: 'hoverDynamic',
        playbackControlsVisibility: 'hidden',
        progressBarVisibility: 'hidden',
      }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const widget = document.querySelector('.widget-window') as HTMLElement;
    expect(
      document.querySelector('[data-widget-block="trackDetails"]'),
    ).not.toBeInTheDocument();
    fireEvent.pointerEnter(widget);
    expect(
      document.querySelector('[data-widget-block="trackDetails"]'),
    ).toBeInTheDocument();
    fireEvent.pointerLeave(widget);
    expect(
      document.querySelector('[data-widget-block="trackDetails"]'),
    ).not.toBeInTheDocument();
  });

  it('removes playback controls from layout when the display preference hides them', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ hidePlaybackControls: true }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    fireEvent.pointerEnter(
      document.querySelector('.widget-window') as HTMLElement,
    );

    expect(
      screen.queryByRole('button', { name: 'Previous' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pause' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  it('keeps hover-only playback controls mounted while changing only visibility', () => {
    mockUseAppModel.mockReturnValue(createConnectedModel());

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const widget = document.querySelector('.widget-window') as HTMLElement;
    const controls = document.querySelector(
      '.transport-controls',
    ) as HTMLElement;
    expect(controls).toBeInTheDocument();
    expect(controls).toHaveClass('transport-controls--hidden');
    expect(
      screen.queryByRole('button', { name: 'Pause' }),
    ).not.toBeInTheDocument();

    fireEvent.pointerEnter(widget);
    expect(controls).not.toHaveClass('transport-controls--hidden');
    expect(
      screen.getByRole('button', { name: 'Previous' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();

    fireEvent.pointerLeave(widget);
    expect(controls).toHaveClass('transport-controls--hidden');
    expect(
      screen.queryByRole('button', { name: 'Pause' }),
    ).not.toBeInTheDocument();
  });

  it('reveals hover-only controls for keyboard focus and hides them after focus leaves the widget', () => {
    mockUseAppModel.mockReturnValue(createConnectedModel());

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const openSettings = screen.getByRole('button', {
      name: 'Open settings',
    });
    const controls = document.querySelector(
      '.transport-controls',
    ) as HTMLElement;
    expect(openSettings).not.toHaveClass(
      'widget-window__window-action--visible',
    );
    expect(controls).toHaveClass('transport-controls--hidden');

    fireEvent.keyDown(window, { key: 'Tab' });
    fireEvent.focus(openSettings);
    expect(openSettings).toHaveClass('widget-window__window-action--visible');
    expect(controls).not.toHaveClass('transport-controls--hidden');
    expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled();

    fireEvent.blur(openSettings, { relatedTarget: document.body });
    expect(openSettings).not.toHaveClass(
      'widget-window__window-action--visible',
    );
    expect(controls).toHaveClass('transport-controls--hidden');
  });

  it('clears hover-only UI when the window loses focus and restores it on pointer movement', () => {
    mockUseAppModel.mockReturnValue(createConnectedModel());

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const widget = document.querySelector('.widget-window') as HTMLElement;
    const controls = document.querySelector(
      '.transport-controls',
    ) as HTMLElement;

    fireEvent.pointerEnter(widget);
    expect(controls).not.toHaveClass('transport-controls--hidden');

    fireEvent.blur(window);
    expect(controls).toHaveClass('transport-controls--hidden');

    fireEvent.pointerMove(widget);
    expect(controls).not.toHaveClass('transport-controls--hidden');
  });

  it('hides the connection badge until hover without removing its layout anchor', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ connectionBadgeVisibility: 'hover' }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const widget = document.querySelector('.widget-window') as HTMLElement;
    const badgeAnchor = document.querySelector(
      '.widget-window__connection-badge',
    ) as HTMLElement;
    expect(badgeAnchor).toBeInTheDocument();
    expect(badgeAnchor).toHaveClass('widget-window__connection-badge--hidden');
    expect(screen.getByText('Live')).toBeInTheDocument();

    fireEvent.pointerEnter(widget);
    expect(badgeAnchor).not.toHaveClass(
      'widget-window__connection-badge--hidden',
    );

    fireEvent.pointerLeave(widget);
    expect(badgeAnchor).toHaveClass('widget-window__connection-badge--hidden');
  });

  it('fully omits the connection badge even while the widget is hovered', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ connectionBadgeVisibility: 'hidden' }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const widget = document.querySelector('.widget-window') as HTMLElement;
    const badgeAnchor = document.querySelector(
      '.widget-window__connection-badge',
    ) as HTMLElement;
    expect(badgeAnchor).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();

    fireEvent.pointerEnter(widget);
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('uses explicit native dragging for blank layout surface without turning the hover container into a drag region', () => {
    runtimeMock.isTauri = true;
    mockUseAppModel.mockReturnValue(
      createConnectedModel({
        hidePlaybackControls: true,
        hideProgressBar: true,
        hideTrackDetails: true,
        useArtworkAsPlaybackControl: true,
      }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const layout = document.querySelector('.widget-window__layout');
    expect(layout).not.toHaveAttribute('data-tauri-drag-region');
    expect(layout).not.toHaveClass('drag-region');
    fireEvent.mouseDown(layout as Element, { button: 0, buttons: 1 });
    expect(
      windowControllerMocks.startCurrentAppWindowDragging,
    ).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(
      screen.getByRole('button', { name: 'Pause Night Train Window' }),
      { button: 0, buttons: 1 },
    );
    expect(
      windowControllerMocks.startCurrentAppWindowDragging,
    ).toHaveBeenCalledTimes(1);
  });

  it('drags from non-interactive artwork without any native drag markers and ignores interactive descendants', () => {
    runtimeMock.isTauri = true;
    mockUseAppModel.mockReturnValue(createConnectedModel());

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      document.querySelectorAll(
        '.widget-window [data-tauri-drag-region], .widget-window .drag-region',
      ),
    ).toHaveLength(0);

    fireEvent.mouseDown(document.querySelector('.cover-card') as Element, {
      button: 0,
      buttons: 1,
    });
    expect(
      windowControllerMocks.startCurrentAppWindowDragging,
    ).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(document.querySelector('.cover-card') as Element, {
      button: 2,
      buttons: 2,
    });

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Open settings' }), {
      button: 0,
      buttons: 1,
    });
    fireEvent.mouseDown(screen.getByRole('slider', { name: 'Seek position' }), {
      button: 0,
      buttons: 1,
    });
    expect(
      windowControllerMocks.startCurrentAppWindowDragging,
    ).toHaveBeenCalledTimes(1);
  });

  it('keeps enabled playback controls in layout when hover-only mode is disabled', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ showPlaybackControlsOnHover: false }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const widget = document.querySelector('.widget-window') as HTMLElement;
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    fireEvent.pointerLeave(widget);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('removes the progress scrubber from layout when the display preference hides it', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ hideProgressBar: true }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      screen.queryByRole('slider', { name: 'Seek position' }),
    ).not.toBeInTheDocument();
  });

  it('removes track title and artist from layout when the display preference hides them', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ hideTrackDetails: true }),
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      document.querySelector('.widget-window__meta'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Night Train Window')).not.toBeInTheDocument();
    expect(screen.queryByText('Moseca Harbor')).not.toBeInTheDocument();
  });

  it('uses the full artwork as one accessible play-pause control when enabled', () => {
    const model = createConnectedModel({ useArtworkAsPlaybackControl: true });
    mockUseAppModel.mockReturnValue(model);

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    const artworkControl = screen.getByRole('button', {
      name: 'Pause Night Train Window',
    });
    const indicator = document.querySelector('.cover-card__playback-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).not.toHaveClass(
      'cover-card__playback-indicator--visible',
    );

    fireEvent.pointerEnter(
      document.querySelector('.widget-window') as HTMLElement,
    );
    expect(indicator).toHaveClass('cover-card__playback-indicator--visible');
    fireEvent.click(artworkControl);

    expect(model.sendCommand).toHaveBeenCalledTimes(1);
    expect(model.sendCommand).toHaveBeenCalledWith({ type: 'playPause' });
  });

  it('keeps the artwork non-interactive when artwork playback control is disabled', () => {
    mockUseAppModel.mockReturnValue(createConnectedModel());

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      screen.queryByRole('button', { name: 'Pause Night Train Window' }),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('.cover-card__playback-indicator'),
    ).not.toBeInTheDocument();
  });

  it('measures intrinsic layout height instead of the current expanded viewport', async () => {
    runtimeMock.isTauri = true;
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ playbackState: 'paused' }),
    );
    const observeMutations = vi.fn();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(
      () => undefined,
    );
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains('widget-window__layout') ? 438 : 700;
      },
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          width: 336,
          height: 700,
          top: 0,
          right: 336,
          bottom: 700,
          left: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: MutationCallback) {
          void callback;
        }
        observe = observeMutations;
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(
        windowControllerMocks.setMainAppWindowSize,
      ).toHaveBeenLastCalledWith(336, 440);
    });
    expect(observeMutations).toHaveBeenCalledWith(expect.any(HTMLElement), {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });

  it('resyncs intrinsic height when display preferences remove footer sections', async () => {
    runtimeMock.isTauri = true;
    let layoutHeight = 490;
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ playbackState: 'paused' }),
    );

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(
      () => undefined,
    );
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains('widget-window__layout')
          ? layoutHeight
          : 700;
      },
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: MutationCallback) {
          void callback;
        }
        observe() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    );

    const { rerender } = render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(
        windowControllerMocks.setMainAppWindowSize,
      ).toHaveBeenLastCalledWith(336, 492);
    });

    layoutHeight = 404;
    mockUseAppModel.mockReturnValue(
      createConnectedModel({
        playbackState: 'paused',
        hidePlaybackControls: true,
        hideProgressBar: true,
      }),
    );
    rerender(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(
        windowControllerMocks.setMainAppWindowSize,
      ).toHaveBeenLastCalledWith(336, 406);
    });
  });

  it('keeps intrinsic height stable when hover-only controls change visibility', async () => {
    runtimeMock.isTauri = true;
    let layoutHeight = 420;
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ playbackState: 'paused' }),
    );

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(
      () => undefined,
    );
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains('widget-window__layout')
          ? layoutHeight
          : 700;
      },
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: MutationCallback) {
          void callback;
        }
        observe() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    );

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(
        windowControllerMocks.setMainAppWindowSize,
      ).toHaveBeenLastCalledWith(336, 422);
    });

    layoutHeight = 490;
    fireEvent.pointerEnter(
      document.querySelector('.widget-window') as HTMLElement,
    );
    await Promise.resolve();
    expect(windowControllerMocks.setMainAppWindowSize).toHaveBeenLastCalledWith(
      336,
      422,
    );

    layoutHeight = 420;
    fireEvent.pointerLeave(
      document.querySelector('.widget-window') as HTMLElement,
    );
    await Promise.resolve();
    expect(windowControllerMocks.setMainAppWindowSize).toHaveBeenLastCalledWith(
      336,
      422,
    );
  });

  it('renders authorization actions when auth is required', () => {
    mockUseAppModel.mockReturnValue({
      ready: true,
      settings: {
        api: {
          host: '127.0.0.1',
          port: 9863,
          sourceMode: 'real',
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
      setCiderToken: vi.fn(resolvedAction),
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
    expect(
      screen.getByRole('button', { name: 'Confirm in YTMDesktop' }),
    ).toBeInTheDocument();
  });

  it('renders Cider token recovery without Companion pairing actions', () => {
    const model = createConnectedModel();
    model.settings.api.sourceMode = 'real';
    model.settings.api.playbackSource = 'cider';
    model.resolvedSourceMode = 'real';
    model.session.connection = {
      status: 'auth_required',
      hasStoredAuth: false,
      retryAttempt: 0,
      retryAt: null,
      messageKey: 'authRequired',
    };
    model.session.playback = null;
    model.session.lastKnownPlayback = null;
    mockUseAppModel.mockReturnValue(model);

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      screen.getByText('Cider application token required'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open Settings and save a token created in Cider/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Authorize this widget')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Generate code' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Open settings', { selector: 'button' }));
    expect(model.openSettings).toHaveBeenCalledOnce();
    expect(model.generateAuthCode).not.toHaveBeenCalled();
  });

  it('opens Settings for a rejected stored Cider token', () => {
    const model = createConnectedModel();
    model.settings.api.sourceMode = 'real';
    model.settings.api.playbackSource = 'cider';
    model.resolvedSourceMode = 'real';
    model.session.connection = {
      status: 'error',
      hasStoredAuth: true,
      retryAttempt: 0,
      retryAt: null,
      messageKey: 'storedAuthRejected',
    };
    model.session.playback = null;
    mockUseAppModel.mockReturnValue(model);

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      screen.getByText(/Cider rejected the stored application token/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Open settings', { selector: 'button' }));
    expect(model.openSettings).toHaveBeenCalledOnce();
    expect(model.reconnect).not.toHaveBeenCalled();
  });

  it('never exposes Companion pairing for Windows Media Session state', () => {
    const model = createConnectedModel();
    model.settings.api.sourceMode = 'real';
    model.settings.api.playbackSource = 'windowsMediaSession';
    model.resolvedSourceMode = 'real';
    model.session.connection = {
      status: 'auth_required',
      hasStoredAuth: false,
      retryAttempt: 0,
      retryAt: null,
      messageKey: 'authRequired',
    };
    model.session.playback = null;
    mockUseAppModel.mockReturnValue(model);

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      screen.getByText('The media session needs attention'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/YTMDesktop/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Generate code' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
    expect(model.reconnect).toHaveBeenCalledOnce();
  });

  it('localizes a connection problem without rendering raw native details', () => {
    const disconnectedModel = createConnectedModel();
    disconnectedModel.settings.ui.locale = 'ru';
    disconnectedModel.session.playback = null;
    disconnectedModel.session.lastKnownPlayback = null;
    disconnectedModel.session.connection = {
      ...disconnectedModel.session.connection,
      status: 'error',
      detail: 'sensitive native response body',
    };
    Object.assign(disconnectedModel.session.connection, {
      messageKey: 'apiUnavailable',
    });
    mockUseAppModel.mockReturnValue(disconnectedModel);

    render(
      <I18nProvider locale="ru">
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(
      screen.getByText('Companion API сейчас недоступен.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('sensitive native response body')).toBeNull();
  });
});
