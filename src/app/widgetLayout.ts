import type {
  SettingsSectionId,
  WidgetBlockId,
  WidgetBlockVisibility,
} from '@/domain/playback/types';

export const DEFAULT_WIDGET_BLOCK_ORDER = [
  'header',
  'artwork',
  'trackDetails',
  'likeDislike',
  'playbackControls',
  'progress',
] as const satisfies readonly WidgetBlockId[];

export const WIDGET_BLOCK_IDS = [
  ...DEFAULT_WIDGET_BLOCK_ORDER,
] as const satisfies readonly WidgetBlockId[];

export const WIDGET_BLOCK_VISIBILITY_MODES = [
  'always',
  'hoverReserved',
  'hoverDynamic',
  'hidden',
] as const satisfies readonly WidgetBlockVisibility[];

export const SETTINGS_SECTION_IDS = [
  'api',
  'ui',
  'layout',
  'size',
  'appearance',
  'window',
  'dev',
  'about',
] as const satisfies readonly SettingsSectionId[];

const isWidgetBlockId = (value: unknown): value is WidgetBlockId =>
  typeof value === 'string' &&
  WIDGET_BLOCK_IDS.includes(value as WidgetBlockId);

const isSettingsSectionId = (value: unknown): value is SettingsSectionId =>
  typeof value === 'string' &&
  SETTINGS_SECTION_IDS.includes(value as SettingsSectionId);

export const normalizeWidgetBlockOrder = (
  value: unknown,
): WidgetBlockId[] => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_WIDGET_BLOCK_ORDER];
  }

  const seen = new Set<WidgetBlockId>();
  const normalized: WidgetBlockId[] = [];
  for (const candidate of value) {
    if (!isWidgetBlockId(candidate) || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    normalized.push(candidate);
  }

  for (const blockId of DEFAULT_WIDGET_BLOCK_ORDER) {
    if (!seen.has(blockId)) {
      normalized.push(blockId);
    }
  }

  return normalized;
};

export const moveWidgetBlock = (
  order: readonly WidgetBlockId[],
  blockId: WidgetBlockId,
  direction: -1 | 1,
): WidgetBlockId[] => {
  const normalized = normalizeWidgetBlockOrder(order);
  const currentIndex = normalized.indexOf(blockId);
  const nextIndex = currentIndex + direction;
  if (
    currentIndex < 0 ||
    nextIndex < 0 ||
    nextIndex >= normalized.length
  ) {
    return normalized;
  }

  const nextOrder = [...normalized];
  [nextOrder[currentIndex], nextOrder[nextIndex]] = [
    nextOrder[nextIndex] as WidgetBlockId,
    nextOrder[currentIndex] as WidgetBlockId,
  ];
  return nextOrder;
};

export const getWidgetBlockVisibilityState = (
  visibility: WidgetBlockVisibility,
  interactionActive: boolean,
) => {
  switch (visibility) {
    case 'always':
      return { rendered: true, visible: true, reservesSpace: true };
    case 'hoverReserved':
      return {
        rendered: true,
        visible: interactionActive,
        reservesSpace: true,
      };
    case 'hoverDynamic':
      return {
        rendered: interactionActive,
        visible: interactionActive,
        reservesSpace: false,
      };
    case 'hidden':
    default:
      return { rendered: false, visible: false, reservesSpace: false };
  }
};

export const normalizeCollapsedSettingsSections = (
  value: unknown,
): SettingsSectionId[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<SettingsSectionId>();
  const normalized: SettingsSectionId[] = [];
  for (const candidate of value) {
    if (!isSettingsSectionId(candidate) || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    normalized.push(candidate);
  }
  return normalized;
};
