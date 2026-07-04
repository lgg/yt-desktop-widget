import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DEFAULT_SETTINGS, REPOSITORY_URL } from '@/app/defaults';
import { closeWidgetWindow, APP_WINDOW_VISIBILITY_EVENT, showAppWindow, type AppWindowLabel } from '@/app/windowController';
import { loadSettings, saveSettings } from '@/app/settingsRepository';
import { PlaybackController } from '@/domain/playback/controller';
import { createInitialConnectionState } from '@/domain/playback/connectionMachine';
import type {
  AppSettings,
  DataSourceMode,
  PlaybackCommand,
  PlaybackSessionState,
  WindowPosition,
} from '@/domain/playback/types';
import { createRealGateway } from '@/integration/companion/realGateway';
import { tauriBridge } from '@/integration/companion/tauriBridge';
import { createSimulatorGateway } from '@/integration/simulator/simulatorGateway';
import { isTauriRuntime } from '@/utils/runtime';

export interface AppModel {
  ready: boolean;
  settings: AppSettings;
  session: PlaybackSessionState;
  resolvedSourceMode: Exclude<DataSourceMode, 'auto'>;
  updateSettings: (recipe: (current: AppSettings) => AppSettings) => Promise<void>;
  reconnect: () => Promise<void>;
  generateAuthCode: () => Promise<void>;
  confirmAuthentication: () => Promise<void>;
  clearAuth: () => Promise<void>;
  sendCommand: (command: PlaybackCommand) => Promise<void>;
  openSettings: () => Promise<void>;
  closeWidget: () => Promise<void>;
  toggleDebugMockMode: () => Promise<void>;
  openRepository: () => Promise<void>;
}

const initialSession: PlaybackSessionState = {
  connection: createInitialConnectionState(),
  playback: null,
  lastKnownPlayback: null,
};

const AppContext = createContext<AppModel>({
  ready: false,
  settings: DEFAULT_SETTINGS,
  session: initialSession,
  resolvedSourceMode: 'simulator',
  updateSettings: async () => Promise.resolve(),
  reconnect: async () => Promise.resolve(),
  generateAuthCode: async () => Promise.resolve(),
  confirmAuthentication: async () => Promise.resolve(),
  clearAuth: async () => Promise.resolve(),
  sendCommand: async () => Promise.resolve(),
  openSettings: async () => Promise.resolve(),
  closeWidget: async () => Promise.resolve(),
  toggleDebugMockMode: async () => Promise.resolve(),
  openRepository: async () => Promise.resolve(),
});

const sameWindowPosition = (
  left: WindowPosition | null,
  right: WindowPosition | null,
): boolean => {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return left.x === right.x && left.y === right.y;
};

const areSettingsEqual = (left: AppSettings, right: AppSettings): boolean =>
  left.api.host === right.api.host &&
  left.api.port === right.api.port &&
  left.api.sourceMode === right.api.sourceMode &&
  left.ui.hidePlaybackControls === right.ui.hidePlaybackControls &&
  left.ui.hideProgressBar === right.ui.hideProgressBar &&
  left.ui.hideSettingsButton === right.ui.hideSettingsButton &&
  left.ui.hideCloseButton === right.ui.hideCloseButton &&
  left.ui.themeMode === right.ui.themeMode &&
  left.window.alwaysOnTop === right.window.alwaysOnTop &&
  left.window.launchOnStartup === right.window.launchOnStartup &&
  left.window.closeButtonAction === right.window.closeButtonAction &&
  sameWindowPosition(left.window.mainPosition, right.window.mainPosition) &&
  sameWindowPosition(left.window.settingsPosition, right.window.settingsPosition);

const resolveSourceMode = (preferredMode: DataSourceMode): Exclude<DataSourceMode, 'auto'> => {
  const searchParams = new URLSearchParams(window.location.search);
  const queryMode = searchParams.get('source');
  const envMode = import.meta.env.VITE_YTM_DATA_SOURCE as string | undefined;
  const candidate = queryMode ?? envMode ?? preferredMode;

  if (candidate === 'real' || candidate === 'simulator') {
    return candidate;
  }

  return isTauriRuntime() ? 'real' : 'simulator';
};

const shouldStartController = (windowLabel: AppWindowLabel, windowVisible: boolean) =>
  windowLabel === 'main' || windowVisible;

export const AppProvider = ({
  children,
  windowLabel,
}: React.PropsWithChildren<{ windowLabel: AppWindowLabel }>) => {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [session, setSession] = useState(initialSession);
  const [windowVisible, setWindowVisible] = useState(windowLabel !== 'settings');
  const controllerRef = useRef<PlaybackController | null>(null);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const previousSourceModeRef = useRef<DataSourceMode>('auto');
  const saveRequestIdRef = useRef(0);
  const resolvedSourceMode = useMemo(
    () => resolveSourceMode(settings.api.sourceMode),
    [settings.api.sourceMode],
  );

  useEffect(() => {
    settingsRef.current = settings;
    if (settings.api.sourceMode !== 'simulator') {
      previousSourceModeRef.current = settings.api.sourceMode;
    }
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    void loadSettings()
      .then((loadedSettings) => {
        if (cancelled) {
          return;
        }

        settingsRef.current = loadedSettings;
        if (loadedSettings.api.sourceMode !== 'simulator') {
          previousSourceModeRef.current = loadedSettings.api.sourceMode;
        }
        setSettings(loadedSettings);
      })
      .catch((error) => {
        console.error('Failed to load settings, falling back to defaults.', error);
        if (cancelled) {
          return;
        }

        settingsRef.current = DEFAULT_SETTINGS;
        previousSourceModeRef.current = DEFAULT_SETTINGS.api.sourceMode;
        setSettings(DEFAULT_SETTINGS);
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (windowLabel !== 'settings' || !isTauriRuntime()) {
      setWindowVisible(true);
      return undefined;
    }

    let active = true;
    let unlistenVisibility: (() => void) | null = null;
    let unlistenFocus: (() => void) | null = null;
    const currentWindow = getCurrentWindow();

    const syncVisibility = () => {
      void currentWindow
        .isVisible()
        .then((visible) => {
          if (active) {
            setWindowVisible(visible);
          }
        })
        .catch(() => {
          if (active) {
            setWindowVisible(false);
          }
        });
    };

    syncVisibility();

    void currentWindow
      .listen<boolean>(APP_WINDOW_VISIBILITY_EVENT, ({ payload }) => {
        if (active) {
          setWindowVisible(payload);
        }
      })
      .then((unlisten) => {
        unlistenVisibility = unlisten;
      })
      .catch(() => undefined);

    void currentWindow
      .onFocusChanged(({ payload: focused }) => {
        if (!active) {
          return;
        }

        if (focused) {
          setWindowVisible(true);
          return;
        }

        syncVisibility();
      })
      .then((unlisten) => {
        unlistenFocus = unlisten;
      })
      .catch(() => undefined);

    return () => {
      active = false;
      unlistenVisibility?.();
      unlistenFocus?.();
    };
  }, [windowLabel]);

  useEffect(() => {
    if (!ready || !shouldStartController(windowLabel, windowVisible)) {
      return undefined;
    }

    const gateway =
      resolvedSourceMode === 'real' ? createRealGateway() : createSimulatorGateway();
    const controller = new PlaybackController(gateway);
    controllerRef.current = controller;

    const unsubscribe = controller.subscribe((nextState) => {
      startTransition(() => {
        setSession(nextState);
      });
    });

    void controller.start();

    return () => {
      unsubscribe();
      void controller.dispose();
      controllerRef.current = null;
    };
  }, [ready, resolvedSourceMode, settings.api.host, settings.api.port, windowLabel, windowVisible]);

  const updateSettings = async (recipe: (current: AppSettings) => AppSettings) => {
    const currentSettings = settingsRef.current;
    const nextSettings = recipe(currentSettings);

    if (areSettingsEqual(currentSettings, nextSettings)) {
      return;
    }

    settingsRef.current = nextSettings;
    setSettings(nextSettings);

    const requestId = ++saveRequestIdRef.current;

    try {
      const persisted = await saveSettings(nextSettings);
      if (requestId !== saveRequestIdRef.current) {
        return;
      }

      if (!areSettingsEqual(settingsRef.current, persisted)) {
        settingsRef.current = persisted;
        setSettings(persisted);
      }
    } catch (error) {
      if (requestId === saveRequestIdRef.current) {
        settingsRef.current = currentSettings;
        setSettings(currentSettings);
      }
      throw error;
    }
  };

  const openSettings = async () => {
    await showAppWindow('settings');
  };

  const closeWidget = async () => {
    try {
      await closeWidgetWindow(settingsRef.current.window.closeButtonAction);
    } catch (error) {
      console.error('Failed to close widget.', {
        action: settingsRef.current.window.closeButtonAction,
        error,
      });
      throw error;
    }
  };

  const toggleDebugMockMode = async () => {
    await updateSettings((current) => ({
      ...current,
      api: {
        ...current.api,
        sourceMode:
          current.api.sourceMode === 'simulator'
            ? previousSourceModeRef.current === 'simulator'
              ? 'auto'
              : previousSourceModeRef.current
            : 'simulator',
      },
    }));
  };

  const openRepository = async () => {
    if (isTauriRuntime()) {
      await tauriBridge.openRepository();
      return;
    }

    window.open(REPOSITORY_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <AppContext.Provider
      value={{
        ready,
        settings,
        session,
        resolvedSourceMode,
        updateSettings,
        reconnect: async () => controllerRef.current?.reconnectNow(),
        generateAuthCode: async () => controllerRef.current?.requestAuthCode(),
        confirmAuthentication: async () => controllerRef.current?.completeAuthentication(),
        clearAuth: async () => controllerRef.current?.clearAuth(),
        sendCommand: async (command) => controllerRef.current?.sendCommand(command),
        openSettings,
        closeWidget,
        toggleDebugMockMode,
        openRepository,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppModel = () => useContext(AppContext);