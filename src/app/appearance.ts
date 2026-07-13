import type { CSSProperties } from 'react';

import type { UiSettings } from '@/domain/playback/types';

type AppearanceCustomProperties = {
  '--window-surface-opacity': number;
  '--artwork-background-opacity': number;
  '--artwork-gradient-opacity': number;
};

export type AppearanceStyle = CSSProperties & AppearanceCustomProperties;

export const getAppearanceStyle = (
  settings: Pick<
    UiSettings,
    | 'windowSurfaceOpacity'
    | 'artworkBackgroundOpacity'
    | 'artworkGradientOpacity'
  >,
): AppearanceStyle => ({
  '--window-surface-opacity': settings.windowSurfaceOpacity / 100,
  '--artwork-background-opacity': settings.artworkBackgroundOpacity / 100,
  '--artwork-gradient-opacity': settings.artworkGradientOpacity / 100,
});
