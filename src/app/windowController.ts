import { getCurrentWindow } from '@tauri-apps/api/window';

import type { CloseButtonAction } from '@/domain/playback/types';
import { tauriBridge } from '@/integration/companion/tauriBridge';
import { isTauriRuntime } from '@/utils/runtime';

export type AppWindowLabel = 'main' | 'settings';
export const APP_WINDOW_VISIBILITY_EVENT = 'app-window://visibility';

const resolveBrowserView = (): AppWindowLabel => {
  const params = new URLSearchParams(window.location.search);
  const hashView = window.location.hash.replace(/^#/, '');
  const view = params.get('view') ?? hashView;
  return view === 'settings' ? 'settings' : 'main';
};

export const getCurrentAppWindowLabel = (): AppWindowLabel => {
  if (!isTauriRuntime()) {
    return resolveBrowserView();
  }

  try {
    return getCurrentWindow().label === 'settings' ? 'settings' : 'main';
  } catch {
    return 'main';
  }
};

export const showAppWindow = async (label: AppWindowLabel): Promise<void> => {
  if (isTauriRuntime()) {
    await tauriBridge.showWindow(label);
    return;
  }

  if (label === 'settings') {
    window.open(
      `${window.location.pathname}?view=settings`,
      '_blank',
      'noopener,noreferrer',
    );
  }
};

export const hideAppWindow = async (label: AppWindowLabel): Promise<void> => {
  if (isTauriRuntime()) {
    await tauriBridge.hideWindow(label);
    return;
  }

  if (label !== 'main') {
    window.close();
  }
};

export const hideCurrentAppWindow = async (): Promise<void> => {
  await hideAppWindow(getCurrentAppWindowLabel());
};

export const startCurrentAppWindowDragging = async (): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }

  await getCurrentWindow().startDragging();
};

export const setMainAppWindowSize = async (
  width: number,
  height: number,
): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }

  await tauriBridge.setMainWindowSize(width, height);
};

export const exitApp = async (): Promise<void> => {
  if (isTauriRuntime()) {
    await tauriBridge.exitApp();
    return;
  }

  window.close();
};

export const closeWidgetWindow = async (
  action: CloseButtonAction,
): Promise<void> => {
  try {
    if (action === 'hideToTray') {
      try {
        await tauriBridge.hideWidgetStack();
        return;
      } catch (error) {
        if (isTauriRuntime()) {
          throw error;
        }
      }

      await hideAppWindow('main');
      return;
    }

    try {
      await tauriBridge.exitApp();
      return;
    } catch (error) {
      if (isTauriRuntime()) {
        throw error;
      }
    }

    await exitApp();
  } catch (error) {
    console.error('Failed to run widget close action.', { action, error });
    throw error;
  }
};
