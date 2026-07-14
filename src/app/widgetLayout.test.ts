import { describe, expect, it } from 'vitest';

import {
  DEFAULT_WIDGET_BLOCK_ORDER,
  getWidgetBlockVisibilityState,
  moveWidgetBlock,
  normalizeCollapsedSettingsSections,
  normalizeWidgetBlockOrder,
} from '@/app/widgetLayout';

describe('widget layout settings', () => {
  it('normalizes persisted order by removing unknowns and duplicates and appending missing blocks', () => {
    expect(
      normalizeWidgetBlockOrder([
        'progress',
        'artwork',
        'progress',
        'unknown',
        'header',
      ]),
    ).toEqual([
      'progress',
      'artwork',
      'header',
      'trackDetails',
      'likeDislike',
      'playbackControls',
    ]);
    expect(normalizeWidgetBlockOrder('not-an-array')).toEqual(
      DEFAULT_WIDGET_BLOCK_ORDER,
    );
  });

  it('moves one block without mutating the source order or crossing bounds', () => {
    const source = [...DEFAULT_WIDGET_BLOCK_ORDER];

    expect(moveWidgetBlock(source, 'progress', -1)).toEqual([
      'header',
      'artwork',
      'trackDetails',
      'likeDislike',
      'progress',
      'playbackControls',
    ]);
    expect(moveWidgetBlock(source, 'header', -1)).toEqual(source);
    expect(moveWidgetBlock(source, 'progress', 1)).toEqual(source);
    expect(source).toEqual(DEFAULT_WIDGET_BLOCK_ORDER);
  });

  it('distinguishes reserved hover, dynamic hover, and fully hidden geometry', () => {
    expect(getWidgetBlockVisibilityState('always', false)).toEqual({
      rendered: true,
      visible: true,
      reservesSpace: true,
    });
    expect(getWidgetBlockVisibilityState('hoverReserved', false)).toEqual({
      rendered: true,
      visible: false,
      reservesSpace: true,
    });
    expect(getWidgetBlockVisibilityState('hoverReserved', true)).toEqual({
      rendered: true,
      visible: true,
      reservesSpace: true,
    });
    expect(getWidgetBlockVisibilityState('hoverDynamic', false)).toEqual({
      rendered: false,
      visible: false,
      reservesSpace: false,
    });
    expect(getWidgetBlockVisibilityState('hoverDynamic', true)).toEqual({
      rendered: true,
      visible: true,
      reservesSpace: false,
    });
    expect(getWidgetBlockVisibilityState('hidden', true)).toEqual({
      rendered: false,
      visible: false,
      reservesSpace: false,
    });
  });

  it('normalizes collapsed Settings sections as a unique whitelist', () => {
    expect(
      normalizeCollapsedSettingsSections([
        'ui',
        'api',
        'ui',
        'unknown',
        42,
        'about',
      ]),
    ).toEqual(['ui', 'api', 'about']);
    expect(normalizeCollapsedSettingsSections(null)).toEqual([]);
  });
});
