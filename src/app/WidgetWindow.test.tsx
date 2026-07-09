import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppModel } from '@/app/AppProvider';
import { I18nProvider } from '@/app/i18n';
import { WidgetWindow } from '@/app/WidgetWindow';

const mockUseAppModel = vi.fn<() => AppModel>();
const resolvedAction = () => Promise.resolve();
const runtimeMock = vi.hoisted(() => ({ isTauri: false }));
const setMainAppWindowHeightMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));

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
  hideProgressBar = false,
}: {
  playbackState?: 'playing' | 'paused';
  hidePlaybackControls?: boolean;
  hideProgressBar?: boolean;
} = {}): AppModel => ({
  ready: true,
  settings: {
    api: { host: '127.0.0.1', port: 9863, sourceMode: 'simulator' },
    ui: {
      hidePlaybackControls,
      hideProgressBar,
      hideSettingsButton: true,
      hideCloseButton: true,
      themeMode: 'dark',
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
    connection: { status: 'connected', hasStoredAuth: true, retryAttempt: 0, retryAt: null },
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
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('keeps paused playback compact without a redundant state card', () => {
    mockUseAppModel.mockReturnValue(createConnectedModel({ playbackState: 'paused' }));

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
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

    fireEvent.pointerEnter(document.querySelector('.widget-window') as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(model.sendCommand).toHaveBeenNthCalledWith(1, { type: 'previous' });
    expect(model.sendCommand).toHaveBeenNthCalledWith(2, { type: 'playPause' });
    expect(model.sendCommand).toHaveBeenNthCalledWith(3, { type: 'next' });
    expect(model.sendCommand).toHaveBeenCalledTimes(3);
  });

  it('removes playback controls from layout when the display preference hides them', () => {
    mockUseAppModel.mockReturnValue(createConnectedModel({ hidePlaybackControls: true }));

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    fireEvent.pointerEnter(document.querySelector('.widget-window') as HTMLElement);

    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('removes the progress scrubber from layout when the display preference hides it', () => {
    mockUseAppModel.mockReturnValue(createConnectedModel({ hideProgressBar: true }));

    render(
      <I18nProvider>
        <WidgetWindow />
      </I18nProvider>,
    );

    expect(screen.queryByRole('slider', { name: 'Seek position' })).not.toBeInTheDocument();
  });

  it('measures intrinsic layout height instead of the current expanded viewport', async () => {
    runtimeMock.isTauri = true;
    mockUseAppModel.mockReturnValue(createConnectedModel({ playbackState: 'paused' }));
    const observeMutations = vi.fn();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('widget-window__layout') ? 438 : 700;
    });
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
    expect(observeMutations).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      {
        childList: true,
        subtree: true,
        characterData: true,
      },
    );
  });

  it('resyncs intrinsic height when display preferences remove footer sections', async () => {
    runtimeMock.isTauri = true;
    let layoutHeight = 490;
    mockUseAppModel.mockReturnValue(createConnectedModel({ playbackState: 'paused' }));

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('widget-window__layout') ? layoutHeight : 700;
    });
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

  it('renders authorization actions when auth is required', () => {
    mockUseAppModel.mockReturnValue({
      ready: true,
      settings: {
        api: { host: '127.0.0.1', port: 9863, sourceMode: 'real' },
        ui: {
          hidePlaybackControls: false,
          hideProgressBar: false,
          hideSettingsButton: true,
          hideCloseButton: true,
          themeMode: 'dark',
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
    expect(screen.getByRole('button', { name: 'Confirm in YTMDesktop' })).toBeInTheDocument();
  });
});
