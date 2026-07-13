import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppModel } from '@/app/AppProvider';
import { I18nProvider } from '@/app/i18n';
import { WidgetWindow } from '@/app/WidgetWindow';

const mockUseAppModel = vi.fn<() => AppModel>();
const resolvedAction = () => Promise.resolve();
const runtimeMock = vi.hoisted(() => ({ isTauri: false }));
const setMainAppWindowHeightMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve()),
);

vi.mock('@/app/AppProvider', () => ({
  useAppModel: (): AppModel => mockUseAppModel(),
}));

vi.mock('@/utils/runtime', () => ({
  isTauriRuntime: () => runtimeMock.isTauri,
}));

vi.mock('@/app/windowController', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/windowController')>()),
  setMainAppWindowHeight: setMainAppWindowHeightMock,
}));

const createConnectedModel = ({
  playbackState = 'playing',
  hidePlaybackControls = false,
  showPlaybackControlsOnHover = true,
  hideProgressBar = false,
  hideConnectionBadge = false,
  hideTrackDetails = false,
  useArtworkAsPlaybackControl = false,
}: {
  playbackState?: 'playing' | 'paused';
  hidePlaybackControls?: boolean;
  showPlaybackControlsOnHover?: boolean;
  hideProgressBar?: boolean;
  hideConnectionBadge?: boolean;
  hideTrackDetails?: boolean;
  useArtworkAsPlaybackControl?: boolean;
} = {}): AppModel => ({
  ready: true,
  settings: {
    api: { host: '127.0.0.1', port: 9863, sourceMode: 'simulator' },
    ui: {
      hidePlaybackControls,
      showPlaybackControlsOnHover,
      hideProgressBar,
      ...({ hideConnectionBadge } as Record<'hideConnectionBadge', boolean>),
      ...({
        hideTrackDetails,
        useArtworkAsPlaybackControl,
      } as Record<'hideTrackDetails' | 'useArtworkAsPlaybackControl', boolean>),
      hideSettingsButton: true,
      hideCloseButton: true,
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
      playbackState,
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

describe('WidgetWindow', () => {
  afterEach(() => {
    runtimeMock.isTauri = false;
    setMainAppWindowHeightMock.mockReset();
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

  it('hides the connection badge until hover without removing its layout anchor', () => {
    mockUseAppModel.mockReturnValue(
      createConnectedModel({ hideConnectionBadge: true }),
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

    fireEvent.pointerEnter(widget);
    expect(badgeAnchor).not.toHaveClass(
      'widget-window__connection-badge--hidden',
    );

    fireEvent.pointerLeave(widget);
    expect(badgeAnchor).toHaveClass('widget-window__connection-badge--hidden');
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
      expect(setMainAppWindowHeightMock).toHaveBeenLastCalledWith(440);
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
      expect(setMainAppWindowHeightMock).toHaveBeenLastCalledWith(492);
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
      expect(setMainAppWindowHeightMock).toHaveBeenLastCalledWith(406);
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
      expect(setMainAppWindowHeightMock).toHaveBeenLastCalledWith(422);
    });

    layoutHeight = 490;
    fireEvent.pointerEnter(
      document.querySelector('.widget-window') as HTMLElement,
    );
    await Promise.resolve();
    expect(setMainAppWindowHeightMock).toHaveBeenLastCalledWith(422);

    layoutHeight = 420;
    fireEvent.pointerLeave(
      document.querySelector('.widget-window') as HTMLElement,
    );
    await Promise.resolve();
    expect(setMainAppWindowHeightMock).toHaveBeenLastCalledWith(422);
  });

  it('renders authorization actions when auth is required', () => {
    mockUseAppModel.mockReturnValue({
      ready: true,
      settings: {
        api: { host: '127.0.0.1', port: 9863, sourceMode: 'real' },
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
    expect(
      screen.getByRole('button', { name: 'Confirm in YTMDesktop' }),
    ).toBeInTheDocument();
  });
});
