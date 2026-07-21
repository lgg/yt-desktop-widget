import type { UiSettings, WidgetSizeMode } from '@/domain/playback/types';

export const WIDGET_BASE_WIDTH = 336;
export const WIDGET_BASE_HEIGHT = 438;
export const WIDGET_BASE_MIN_HEIGHT = 360;
export const WIDGET_BASE_MAX_HEIGHT = 780;
export const WIDGET_CUSTOM_MIN_PERCENTAGE = 75;
export const WIDGET_CUSTOM_MAX_PERCENTAGE = 600;

export const WIDGET_SIZE_MODES = [
  'compact',
  'default',
  'large',
  'custom',
] as const satisfies readonly WidgetSizeMode[];

const PRESET_PERCENTAGES: Record<Exclude<WidgetSizeMode, 'custom'>, number> = {
  compact: 85,
  default: 100,
  large: 125,
};

type WidgetSizePreference = Pick<
  UiSettings,
  'widgetSizeMode' | 'customWidgetScalePercentage'
>;

export const clampCustomWidgetScalePercentage = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 100;
  }

  return Math.min(
    WIDGET_CUSTOM_MAX_PERCENTAGE,
    Math.max(WIDGET_CUSTOM_MIN_PERCENTAGE, value),
  );
};

export const getWidgetScalePercentage = (
  preference: WidgetSizePreference,
): number =>
  preference.widgetSizeMode === 'custom'
    ? clampCustomWidgetScalePercentage(
        preference.customWidgetScalePercentage,
      )
    : PRESET_PERCENTAGES[preference.widgetSizeMode];

export const getWidgetScaleFactor = (
  preference: WidgetSizePreference,
): number => getWidgetScalePercentage(preference) / 100;

export const getCustomWidgetScaleFromWidth = (width: number): number =>
  clampCustomWidgetScalePercentage((width / WIDGET_BASE_WIDTH) * 100);

export const getCustomWidgetScaleFromHeight = (height: number): number =>
  clampCustomWidgetScalePercentage((height / WIDGET_BASE_HEIGHT) * 100);

export const getWidgetReferenceDimensions = (scalePercentage: number) => {
  const scale = clampCustomWidgetScalePercentage(scalePercentage) / 100;
  return {
    width: Math.round(WIDGET_BASE_WIDTH * scale),
    height: Math.round(WIDGET_BASE_HEIGHT * scale),
  };
};

export const getWidgetWindowSize = (
  intrinsicBaseHeight: number,
  preference: WidgetSizePreference,
) => {
  const scale = getWidgetScaleFactor(preference);
  const safeBaseHeight = Math.min(
    WIDGET_BASE_MAX_HEIGHT,
    Math.max(
      WIDGET_BASE_MIN_HEIGHT,
      Number.isFinite(intrinsicBaseHeight)
        ? intrinsicBaseHeight
        : WIDGET_BASE_HEIGHT,
    ),
  );

  return {
    width: Math.round(WIDGET_BASE_WIDTH * scale),
    height: Math.round(safeBaseHeight * scale),
    scale,
  };
};
