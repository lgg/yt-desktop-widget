import { describe, expect, it } from 'vitest';

import {
  WIDGET_BASE_HEIGHT,
  WIDGET_BASE_WIDTH,
  WIDGET_CUSTOM_MAX_PERCENTAGE,
  WIDGET_CUSTOM_MIN_PERCENTAGE,
  getCustomWidgetScaleFromHeight,
  getCustomWidgetScaleFromWidth,
  getWidgetReferenceDimensions,
  getWidgetScaleFactor,
  getWidgetWindowSize,
} from '@/app/widgetSize';

describe('widget size calculations', () => {
  it('keeps the approved widget geometry unchanged in Default mode', () => {
    expect(WIDGET_BASE_WIDTH).toBe(336);
    expect(WIDGET_BASE_HEIGHT).toBe(438);
    expect(
      getWidgetScaleFactor({
        widgetSizeMode: 'default',
        customWidgetScalePercentage: 137,
      }),
    ).toBe(1);
    expect(
      getWidgetWindowSize(438, {
        widgetSizeMode: 'default',
        customWidgetScalePercentage: 137,
      }),
    ).toEqual({ width: 336, height: 438, scale: 1 });
  });

  it('maps built-in modes to uniform scale factors', () => {
    expect(
      getWidgetScaleFactor({
        widgetSizeMode: 'compact',
        customWidgetScalePercentage: 100,
      }),
    ).toBe(0.85);
    expect(
      getWidgetScaleFactor({
        widgetSizeMode: 'large',
        customWidgetScalePercentage: 100,
      }),
    ).toBe(1.25);
    expect(
      getWidgetWindowSize(440, {
        widgetSizeMode: 'large',
        customWidgetScalePercentage: 100,
      }),
    ).toEqual({ width: 420, height: 550, scale: 1.25 });
  });

  it('derives linked reference dimensions from either custom field', () => {
    const scaleFromWidth = getCustomWidgetScaleFromWidth(400);
    expect(scaleFromWidth).toBeCloseTo(119.047619, 5);
    expect(getWidgetReferenceDimensions(scaleFromWidth)).toEqual({
      width: 400,
      height: 521,
    });

    const scaleFromHeight = getCustomWidgetScaleFromHeight(600);
    expect(scaleFromHeight).toBeCloseTo(136.986301, 5);
    expect(getWidgetReferenceDimensions(scaleFromHeight)).toEqual({
      width: 460,
      height: 600,
    });
  });

  it('clamps custom dimensions to the safe 75%-150% range', () => {
    expect(WIDGET_CUSTOM_MIN_PERCENTAGE).toBe(75);
    expect(WIDGET_CUSTOM_MAX_PERCENTAGE).toBe(150);
    expect(getCustomWidgetScaleFromWidth(1)).toBe(75);
    expect(getCustomWidgetScaleFromHeight(10_000)).toBe(150);
    expect(getWidgetReferenceDimensions(75)).toEqual({
      width: 252,
      height: 329,
    });
    expect(getWidgetReferenceDimensions(150)).toEqual({
      width: 504,
      height: 657,
    });
  });
});
