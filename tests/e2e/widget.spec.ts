import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const appVersion = (
  JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  ) as { version: string }
).version;

const SETTINGS_STORAGE_KEY = 'ytm-desktop-widget.settings';

const readWidgetSizeMode = async (page: import('@playwright/test').Page) =>
  page.evaluate((storageKey) => {
    const stored = window.localStorage.getItem(storageKey);
    return stored
      ? (JSON.parse(stored) as {
          ui?: {
            widgetSizeMode?: string;
            customWidgetScalePercentage?: number;
          };
        }).ui
      : undefined;
  }, SETTINGS_STORAGE_KEY);

test('renders the simulated widget and settings views', async ({ page }) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');

  await expect(page.getByText('Night Train Window')).toBeVisible();
  await expect(page.getByText('Live')).toBeVisible();
  await page.locator('.widget-window').hover();

  const playingHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  expect(playingHeight).toBeLessThanOrEqual(500);

  const progressMetrics = await page
    .locator('.progress-row')
    .evaluate((row) => {
      const rowRect = row.getBoundingClientRect();
      const layoutRect = row
        .closest('.widget-window__layout')
        ?.getBoundingClientRect();
      const [elapsedTime, durationTime] = Array.from(
        row.querySelectorAll('.progress-row__time'),
      ).map((element) => element.getBoundingClientRect());

      return {
        bottomGap: layoutRect ? layoutRect.bottom - rowRect.bottom : 0,
        leftInset: elapsedTime ? elapsedTime.left - rowRect.left : 0,
        rightInset: durationTime ? rowRect.right - durationTime.right : 0,
      };
    });
  expect(progressMetrics.leftInset).toBeGreaterThanOrEqual(14);
  expect(progressMetrics.rightInset).toBeGreaterThanOrEqual(14);
  expect(progressMetrics.bottomGap).toBeGreaterThanOrEqual(18);

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await expect(page.getByText('Playback is paused')).toHaveCount(0);
  await expect(page.locator('.widget-window__layout')).toHaveJSProperty(
    'scrollHeight',
    playingHeight,
  );

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Soft Signal')).toBeVisible();
  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(page.getByText('Night Train Window')).toBeVisible();

  await page.goto('/?view=settings&source=simulator');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText('API / Connection')).toBeVisible();
  await expect(page.getByText('UI / Display')).toBeVisible();
  await expect(page.getByText('Widget Layout')).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Playback controls' }),
  ).toBeVisible();
});

test('scales the full widget with presets and keeps custom dimensions linked', async ({
  page,
}) => {
  const readGeometry = () =>
    page.evaluate(() => {
      const rect = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect();
      const content = rect('.widget-window__content');
      const cover = rect('.cover-card');
      const action = rect('.widget-window__window-action');
      const progress = rect('.progress-row__track');
      return {
        scale: getComputedStyle(
          document.querySelector('.widget-window') as HTMLElement,
        ).getPropertyValue('--widget-scale'),
        contentWidth: content?.width ?? 0,
        coverWidth: cover?.width ?? 0,
        actionWidth: action?.width ?? 0,
        progressWidth: progress?.width ?? 0,
      };
    });

  await page.setViewportSize({ width: 336, height: 760 });
  await page.goto('/?source=simulator');
  await expect(page.getByText('Night Train Window')).toBeVisible();
  const defaultGeometry = await readGeometry();
  expect(defaultGeometry.scale.trim()).toBe('1');
  expect(defaultGeometry.contentWidth).toBeCloseTo(336, 1);
  expect(defaultGeometry.coverWidth).toBeCloseTo(256, 1);

  await page.setViewportSize({ width: 720, height: 760 });
  await page.goto('/?view=settings&source=simulator');
  await page.getByRole('button', { name: 'Large' }).click();
  await expect
    .poll(async () => (await readWidgetSizeMode(page))?.widgetSizeMode)
    .toBe('large');

  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto('/?source=simulator');
  await expect(page.getByText('Night Train Window')).toBeVisible();
  const largeGeometry = await readGeometry();
  expect(largeGeometry.scale.trim()).toBe('1.25');
  expect(largeGeometry.contentWidth).toBeCloseTo(420, 1);
  expect(largeGeometry.coverWidth / defaultGeometry.coverWidth).toBeCloseTo(
    1.25,
    2,
  );
  expect(largeGeometry.actionWidth / defaultGeometry.actionWidth).toBeCloseTo(
    1.25,
    2,
  );
  expect(
    largeGeometry.progressWidth / defaultGeometry.progressWidth,
  ).toBeCloseTo(1.25, 2);

  await page.setViewportSize({ width: 720, height: 760 });
  await page.goto('/?view=settings&source=simulator');
  await page.getByRole('button', { name: 'Custom' }).click();
  const widthInput = page.getByLabel('Width');
  const heightInput = page.getByLabel('Height');
  await expect(widthInput).toHaveValue('336');
  await expect(heightInput).toHaveValue('438');
  await widthInput.fill('400');
  await widthInput.press('Enter');
  await expect(heightInput).toHaveValue('521');
  await expect
    .poll(async () => {
      const size = await readWidgetSizeMode(page);
      return {
        mode: size?.widgetSizeMode,
        percentage: Math.round(size?.customWidgetScalePercentage ?? 0),
      };
    })
    .toEqual({ mode: 'custom', percentage: 119 });

  await heightInput.fill('600');
  await heightInput.press('Enter');
  await expect(widthInput).toHaveValue('460');
  await expect
    .poll(async () =>
      Math.round(
        (await readWidgetSizeMode(page))?.customWidgetScalePercentage ?? 0,
      ),
    )
    .toBe(137);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Custom' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Height')).toHaveValue('600');
  await expect(page.getByLabel('Width')).toHaveValue('460');
});

test('keeps hover-only playback controls stable while changing visibility', async ({
  page,
}) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await expect(page.getByText('Night Train Window')).toBeVisible();

  const collapsedHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  const layoutDragMetrics = await page
    .locator('.widget-window__layout')
    .evaluate((element) => ({
      hasNativeDragAttribute: element.hasAttribute('data-tauri-drag-region'),
      appRegion: window
        .getComputedStyle(element)
        .getPropertyValue('app-region'),
    }));
  const nativeDragMarkerCount = await page
    .locator(
      '.widget-window [data-tauri-drag-region], .widget-window .drag-region',
    )
    .count();
  const windowActions = page.locator('.widget-window__window-action');
  const idleActionRects = await windowActions.evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    }),
  );
  const transportControls = page.locator('.transport-controls');
  await expect(transportControls).toHaveClass(/transport-controls--hidden/);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeHidden();

  await page.locator('.widget-window').hover();
  const hoveredHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  expect(hoveredHeight).toBe(collapsedHeight);
  await expect
    .poll(() =>
      windowActions.evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          };
        }),
      ),
    )
    .toEqual(idleActionRects);
  expect(layoutDragMetrics).toEqual({
    hasNativeDragAttribute: false,
    appRegion: 'none',
  });
  expect(nativeDragMarkerCount).toBe(0);

  await page.getByRole('button', { name: 'Pause' }).hover();
  const transportTransforms = await page
    .locator('.transport-controls')
    .evaluate((row) => {
      const buttonTransforms = Array.from(
        row.querySelectorAll('.transport-controls__button'),
      ).map((element) => window.getComputedStyle(element).transform);

      return {
        row: window.getComputedStyle(row).transform,
        buttons: buttonTransforms,
      };
    });
  expect(transportTransforms.row).toBe('none');
  expect(transportTransforms.buttons).toEqual(['none', 'none', 'none']);

  await page.mouse.move(2_000, 2_000);
  const collapsedAgainHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  await expect(transportControls).toHaveClass(/transport-controls--hidden/);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeHidden();
  expect(collapsedAgainHeight).toBe(collapsedHeight);

  for (let cycle = 0; cycle < 4; cycle += 1) {
    await page.locator('.widget-window').hover();
    await expect(transportControls).not.toHaveClass(
      /transport-controls--hidden/,
    );
    await page.mouse.move(2_000, 2_000);
    await expect(transportControls).toHaveClass(/transport-controls--hidden/);
  }
});

test('keeps reserved progress space stable and changes dynamic block height', async ({
  page,
}) => {
  await page.setViewportSize({ width: 336, height: 620 });
  await page.goto('/?source=simulator');
  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          playbackControlsVisibility: 'hidden',
          trackDetailsVisibility: 'hidden',
          progressBarVisibility: 'hoverReserved',
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await page.mouse.move(2_000, 2_000);

  const widget = page.locator('.widget-window');
  const layout = page.locator('.widget-window__layout');
  const progress = page.locator('.progress-row');
  const reservedHeight = await layout.evaluate((element) => element.scrollHeight);
  await expect(progress).toHaveCSS('opacity', '0');
  await expect(page.getByRole('slider', { name: 'Seek position' })).toHaveCount(
    0,
  );
  await widget.hover();
  await expect(progress).toHaveCSS('opacity', '1');
  await expect(page.getByRole('slider', { name: 'Seek position' })).toBeVisible();
  await expect(layout).toHaveJSProperty('scrollHeight', reservedHeight);

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          playbackControlsVisibility: 'hidden',
          trackDetailsVisibility: 'hoverDynamic',
          progressBarVisibility: 'hidden',
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await page.mouse.move(2_000, 2_000);
  const compactHeight = await layout.evaluate((element) => element.scrollHeight);
  await expect(page.locator('[data-widget-block="trackDetails"]')).toHaveCount(
    0,
  );
  await widget.hover();
  await expect(
    page.locator('[data-widget-block="trackDetails"]'),
  ).toBeVisible();
  await expect
    .poll(() => layout.evaluate((element) => element.scrollHeight))
    .toBeGreaterThan(compactHeight);
});

test('reveals hover-hidden window actions when they receive keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await page.mouse.move(2_000, 2_000);

  const openSettings = page.getByRole('button', { name: 'Open settings' });
  await expect(openSettings).toHaveCSS('opacity', '0');

  await page.keyboard.press('Tab');

  await expect(openSettings).toBeFocused();
  await expect(openSettings).toHaveCSS('opacity', '1');
});

test('disables hover transitions when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await expect(page.getByText('Night Train Window')).toBeVisible();

  const transitionDurations = await page.evaluate(() =>
    [
      '.widget-window__window-action',
      '.widget-window__connection-badge',
      '.transport-controls',
    ].map(
      (selector) =>
        window.getComputedStyle(document.querySelector<HTMLElement>(selector)!)
          .transitionDuration,
    ),
  );

  expect(transitionDurations).toEqual(['0s', '0s', '0s']);
});

test('persists hover and connection badge preferences without layout shifts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 720, height: 760 });
  await page.goto('/?view=settings&source=simulator');

  const playbackVisibility = page.getByRole('group', {
    name: 'Playback controls',
  });
  const hoverReserved = playbackVisibility.getByRole('button', {
    name: 'On hover — keep space',
  });
  const alwaysVisible = playbackVisibility.getByRole('button', {
    name: 'Always',
  });
  const badgeVisibility = page.getByRole('group', {
    name: 'Connection status badge',
  });
  const onHoverBadge = badgeVisibility.getByRole('button', {
    name: 'On hover',
  });
  await expect(hoverReserved).toHaveAttribute('aria-pressed', 'true');
  await alwaysVisible.click();
  await expect(alwaysVisible).toHaveAttribute('aria-pressed', 'true');
  await hoverReserved.click();
  await expect(hoverReserved).toHaveAttribute('aria-pressed', 'true');
  await onHoverBadge.click();
  await expect(onHoverBadge).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(hoverReserved).toHaveAttribute('aria-pressed', 'true');
  await expect(onHoverBadge).toHaveAttribute('aria-pressed', 'true');

  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await page.mouse.move(2_000, 2_000);
  const badge = page.locator('.widget-window__connection-badge');
  const layout = page.locator('.widget-window__layout');
  const controls = page.locator('.transport-controls');
  const idleHeight = await layout.evaluate((element) => element.scrollHeight);
  await expect(badge).toHaveClass(/widget-window__connection-badge--hidden/);
  await expect(controls).toHaveClass(/transport-controls--hidden/);
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0);

  await page.locator('.widget-window').hover();
  await expect(badge).not.toHaveClass(
    /widget-window__connection-badge--hidden/,
  );
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(layout).toHaveJSProperty('scrollHeight', idleHeight);

  await page.goto('/?view=settings&source=simulator');
  await page
    .getByRole('group', { name: 'Connection status badge' })
    .getByRole('button', { name: 'Hidden' })
    .click();
  await page.goto('/?source=simulator');
  await page.locator('.widget-window').hover();
  await expect(page.locator('.status-badge')).toHaveCount(0);
  await expect(page.locator('.widget-window__connection-badge')).toHaveCount(1);
});

test('persists v3 block controls and sends mute and rating actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 720, height: 820 });
  await page.goto('/?view=settings&source=simulator');

  const muteVisibility = page.getByRole('group', { name: 'Mute button' });
  await muteVisibility.getByRole('button', { name: 'Always' }).click();
  const ratingVisibility = page.getByRole('group', {
    name: 'Like / Dislike buttons',
  });
  await ratingVisibility.getByRole('button', { name: 'Always' }).click();
  await page.getByRole('button', { name: 'Move Progress bar up' }).click();
  await page.getByRole('button', { name: 'Collapse API / Connection' }).click();
  await expect(page.getByLabel('Companion endpoint')).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Expand API / Connection' }),
  ).toHaveAttribute('aria-expanded', 'false');

  await page.setViewportSize({ width: 336, height: 620 });
  await page.goto('/?source=simulator');
  await page.locator('.widget-window').hover();

  const renderedOrder = await page
    .locator('[data-widget-block]')
    .evaluateAll((blocks) =>
      blocks.map((block) => block.getAttribute('data-widget-block')),
    );
  expect(renderedOrder).toEqual([
    'header',
    'artwork',
    'trackDetails',
    'likeDislike',
    'progress',
    'playbackControls',
  ]);

  await page.getByRole('button', { name: 'Mute' }).click();
  await expect(page.getByRole('button', { name: 'Unmute' })).toBeVisible();
  const like = page.getByRole('button', { name: 'Like', exact: true });
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
});

test('advances simulator progress at wall-clock speed', async ({ page }) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  const slider = page.getByRole('slider', { name: 'Seek position' });
  const before = Number(await slider.getAttribute('aria-valuenow'));

  await page.waitForTimeout(2_100);

  const after = Number(await slider.getAttribute('aria-valuenow'));
  expect(after - before).toBeGreaterThanOrEqual(1);
  expect(after - before).toBeLessThanOrEqual(3);
});

test('keeps playback controls mounted when hover-only controls are disabled', async ({
  page,
}) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          playbackControlsVisibility: 'always',
          progressBarVisibility: 'always',
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await expect(page.getByText('Night Train Window')).toBeVisible();

  const alwaysVisibleHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  await page
    .locator('.widget-window')
    .dispatchEvent('pointerout', { relatedTarget: null });
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(page.locator('.widget-window__layout')).toHaveJSProperty(
    'scrollHeight',
    alwaysVisibleHeight,
  );
});

test('collapses the simulated widget when display sections are hidden', async ({
  page,
}) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await page.locator('.widget-window').hover();

  const fullHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(
    page.getByRole('slider', { name: 'Seek position' }),
  ).toBeVisible();

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          playbackControlsVisibility: 'hidden',
          progressBarVisibility: 'always',
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await page.locator('.widget-window').hover();

  const noControlsHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0);
  await expect(
    page.getByRole('slider', { name: 'Seek position' }),
  ).toBeVisible();
  expect(noControlsHeight).toBeLessThan(fullHeight - 40);

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          playbackControlsVisibility: 'hoverReserved',
          progressBarVisibility: 'hidden',
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await page.locator('.widget-window').hover();

  const noProgressHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Seek position' })).toHaveCount(
    0,
  );
  expect(noProgressHeight).toBeLessThan(fullHeight - 15);

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          playbackControlsVisibility: 'hidden',
          progressBarVisibility: 'hidden',
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await page.locator('.widget-window').hover();

  const collapsedHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Seek position' })).toHaveCount(
    0,
  );
  expect(collapsedHeight).toBeLessThan(noControlsHeight);
  expect(collapsedHeight).toBeLessThan(noProgressHeight);
});

test('balances compact widget spacing and header alignment', async ({
  page,
}) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');

  const setCompactSettings = async (hideProgressBar: boolean) => {
    await page.evaluate(
      ({ storageKey, progressHidden }) => {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            ui: {
              playbackControlsVisibility: 'hidden',
              progressBarVisibility: progressHidden ? 'hidden' : 'always',
              trackDetailsVisibility: 'hidden',
              connectionBadgeVisibility: 'always',
              hideSettingsButton: false,
              hideCloseButton: false,
            },
          }),
        );
      },
      { storageKey: SETTINGS_STORAGE_KEY, progressHidden: hideProgressBar },
    );
    await page.reload();

    const layoutHeight = await page
      .locator('.widget-window__layout')
      .evaluate((element) => Math.max(360, element.scrollHeight + 2));
    await page.setViewportSize({ width: 336, height: layoutHeight });
    await expect
      .poll(() =>
        page
          .locator('.widget-window__window-action')
          .first()
          .evaluate((element) => window.getComputedStyle(element).transform),
      )
      .toBe('none');

    return layoutHeight;
  };

  const artworkOnlyHeight = await setCompactSettings(true);

  const artworkOnlyMetrics = await page.evaluate(() => {
    const content = document.querySelector<HTMLElement>(
      '.widget-window__content',
    );
    const cover = document.querySelector<HTMLElement>('.cover-card');
    const badge = document.querySelector<HTMLElement>('.status-badge');
    const settingsButton = document.querySelector<HTMLElement>(
      '.widget-window__window-action',
    );
    if (!content || !cover || !badge || !settingsButton) {
      throw new Error('Compact widget geometry elements are missing.');
    }

    const contentRect = content.getBoundingClientRect();
    const coverRect = cover.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    const settingsRect = settingsButton.getBoundingClientRect();
    return {
      headerCenterDelta: Math.abs(
        badgeRect.top +
          badgeRect.height / 2 -
          (settingsRect.top + settingsRect.height / 2),
      ),
      artworkHorizontalCenterDelta: Math.abs(
        coverRect.left +
          coverRect.width / 2 -
          (contentRect.left + contentRect.width / 2),
      ),
      artworkTopGap: coverRect.top - contentRect.top,
      artworkBottomGap: contentRect.bottom - coverRect.bottom,
      lowerSurfaceUsesNativeDragMarker:
        document
          .elementFromPoint(contentRect.left + 10, contentRect.bottom - 5)
          ?.closest('.widget-window__layout')
          ?.hasAttribute('data-tauri-drag-region') ?? false,
      badgeRect: { top: badgeRect.top, height: badgeRect.height },
      settingsRect: { top: settingsRect.top, height: settingsRect.height },
    };
  });

  expect
    .soft(
      artworkOnlyMetrics.headerCenterDelta,
      JSON.stringify(artworkOnlyMetrics),
    )
    .toBeLessThanOrEqual(1);
  expect
    .soft(artworkOnlyMetrics.artworkHorizontalCenterDelta)
    .toBeLessThanOrEqual(1);
  expect
    .soft(
      Math.abs(
        artworkOnlyMetrics.artworkTopGap - artworkOnlyMetrics.artworkBottomGap,
      ),
    )
    .toBeLessThanOrEqual(2);
  expect.soft(artworkOnlyMetrics.lowerSurfaceUsesNativeDragMarker).toBe(false);

  const progressOnlyHeight = await setCompactSettings(false);

  const progressOnlyMetrics = await page.evaluate(() => {
    const content = document.querySelector<HTMLElement>(
      '.widget-window__content',
    );
    const cover = document.querySelector<HTMLElement>('.cover-card');
    const progress = document.querySelector<HTMLElement>('.progress-row');
    if (!content || !cover || !progress) {
      throw new Error('Progress-only widget geometry elements are missing.');
    }

    const contentRect = content.getBoundingClientRect();
    const coverRect = cover.getBoundingClientRect();
    const progressRect = progress.getBoundingClientRect();
    return {
      progressTopGap: progressRect.top - coverRect.bottom,
      progressBottomGap: contentRect.bottom - progressRect.bottom,
    };
  });

  expect
    .soft(
      Math.abs(
        progressOnlyMetrics.progressTopGap -
          progressOnlyMetrics.progressBottomGap,
      ),
    )
    .toBeLessThanOrEqual(2);
  expect(progressOnlyHeight).toBe(artworkOnlyHeight);
});

test('puts theme first, supports light mode, switches locale, and reports the centralized version', async ({
  page,
}) => {
  await page.setViewportSize({ width: 720, height: 760 });
  await page.goto('/?view=settings&source=simulator');

  const uiSection = page
    .locator('.settings-section')
    .filter({ hasText: 'UI / Display' });
  const themeTop = await uiSection.getByText('Theme mode').boundingBox();
  const languageTop = await uiSection
    .getByText('Language', { exact: true })
    .boundingBox();
  expect(themeTop?.y).toBeLessThan(languageTop?.y ?? 0);
  await expect(page.getByText(`Version: ${appVersion}`)).toBeVisible();

  await page.getByRole('button', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const lightThemeStyles = await page
    .locator('.settings-window__content')
    .evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        colorScheme: window.getComputedStyle(document.documentElement)
          .colorScheme,
        textColor: style.color,
        backgroundImage: window.getComputedStyle(element, '::before')
          .backgroundImage,
      };
    });
  expect(lightThemeStyles.colorScheme).toBe('light');
  expect(lightThemeStyles.textColor).toBe('rgba(27, 30, 40, 0.94)');
  expect(lightThemeStyles.backgroundImage).not.toContain('rgba(10, 13, 22');

  await page.getByRole('button', { name: 'Russian' }).click();
  await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible();
  await expect(page.getByText(`Версия: ${appVersion}`)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible();
});

test('keeps the Settings header fixed after scrolling and persists appearance percentages', async ({
  page,
}) => {
  await page.setViewportSize({ width: 720, height: 760 });
  await page.goto('/?view=settings&source=simulator');

  const header = page.locator('.settings-window__header');
  const dragAnchor = page.locator('.settings-window__drag-anchor');
  const sections = page.locator('.settings-window__sections');
  const headerBefore = await header.boundingBox();
  expect(headerBefore).not.toBeNull();

  await sections.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event('scroll'));
  });
  await expect
    .poll(() => sections.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);

  const headerAfter = await header.boundingBox();
  expect(headerAfter?.y).toBe(headerBefore?.y);
  expect(headerAfter?.height).toBe(headerBefore?.height);
  const anchorReceivesPointer = await dragAnchor.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const target = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    return target === element || element.contains(target);
  });
  expect(anchorReceivesPointer).toBe(true);

  const appearanceHeading = page.getByRole('heading', {
    name: 'Transparency / Background',
  });
  await appearanceHeading.scrollIntoViewIfNeeded();
  const surface = page.getByRole('slider', {
    name: 'Window surface opacity',
    exact: true,
  });
  const artwork = page.getByRole('slider', {
    name: 'Artwork background opacity',
    exact: true,
  });
  const gradient = page.getByRole('slider', {
    name: 'Gradient overlay intensity',
    exact: true,
  });

  await surface.fill('72');
  await expect(surface).toHaveValue('72');
  await artwork.fill('48');
  await expect(artwork).toHaveValue('48');
  await gradient.fill('35');
  await expect(gradient).toHaveValue('35');

  await expect
    .poll(() =>
      page.locator('.settings-window').evaluate((element) => {
        const style = window.getComputedStyle(element);
        return [
          style.getPropertyValue('--window-surface-opacity').trim(),
          style.getPropertyValue('--artwork-background-opacity').trim(),
          style.getPropertyValue('--artwork-gradient-opacity').trim(),
        ];
      }),
    )
    .toEqual(['0.72', '0.48', '0.35']);

  await page.reload();
  await expect(
    page.getByRole('slider', {
      name: 'Window surface opacity',
      exact: true,
    }),
  ).toHaveValue('72');
  await expect(
    page.getByRole('slider', {
      name: 'Artwork background opacity',
      exact: true,
    }),
  ).toHaveValue('48');
  await expect(
    page.getByRole('slider', {
      name: 'Gradient overlay intensity',
      exact: true,
    }),
  ).toHaveValue('35');

  await page
    .getByRole('button', {
      name: 'Reset artwork background opacity to default',
    })
    .click();
  await expect(
    page.getByRole('slider', {
      name: 'Artwork background opacity',
      exact: true,
    }),
  ).toHaveValue('100');
});

test('hides track details and controls playback from the full artwork', async ({
  page,
}) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  const fullHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          trackDetailsVisibility: 'hidden',
          useArtworkAsPlaybackControl: true,
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await page.mouse.move(2_000, 2_000);

  const layout = page.locator('.widget-window__layout');
  const compactHeight = await layout.evaluate(
    (element) => element.scrollHeight,
  );
  const pauseArtwork = page.getByRole('button', {
    name: 'Pause Night Train Window',
  });
  const indicator = page.locator('.cover-card__playback-indicator');
  const indicatorVisuals = await indicator.evaluate((overlay) => {
    const icon = overlay.querySelector<HTMLElement>(
      '.cover-card__playback-icon',
    );
    const svg = icon?.querySelector<SVGElement>('svg');
    if (!icon || !svg) {
      throw new Error('Artwork playback icon is missing.');
    }

    const overlayStyle = window.getComputedStyle(overlay);
    const iconStyle = window.getComputedStyle(icon);
    const svgStyle = window.getComputedStyle(svg);
    return {
      overlayBackground: overlayStyle.backgroundColor,
      iconBackground: iconStyle.backgroundColor,
      iconBorderWidth: iconStyle.borderWidth,
      iconBorderRadius: iconStyle.borderRadius,
      iconBoxShadow: iconStyle.boxShadow,
      iconBackdropFilter: iconStyle.backdropFilter,
      iconColor: iconStyle.color,
      svgWidth: svgStyle.width,
      svgHeight: svgStyle.height,
      svgFilter: svgStyle.filter,
    };
  });
  expect(indicatorVisuals).toEqual({
    overlayBackground: 'rgba(0, 0, 0, 0)',
    iconBackground: 'rgba(0, 0, 0, 0)',
    iconBorderWidth: '0px',
    iconBorderRadius: '0px',
    iconBoxShadow: 'none',
    iconBackdropFilter: 'none',
    iconColor: 'rgba(255, 255, 255, 0.72)',
    svgWidth: '78px',
    svgHeight: '78px',
    svgFilter: 'drop-shadow(rgba(0, 0, 0, 0.82) 0px 2px 8px)',
  });
  await expect(page.getByText('Night Train Window')).toHaveCount(0);
  await expect(pauseArtwork).toBeVisible();
  await expect(indicator).not.toHaveClass(
    /cover-card__playback-indicator--visible/,
  );
  expect(compactHeight).toBeLessThan(fullHeight);

  await page.locator('.widget-window').hover();
  await expect(indicator).toHaveClass(
    /cover-card__playback-indicator--visible/,
  );
  await pauseArtwork.click();
  const playArtwork = page.getByRole('button', {
    name: 'Play Night Train Window',
  });
  await expect(playArtwork).toBeVisible();

  await page.mouse.move(2_000, 2_000);
  await expect(indicator).not.toHaveClass(
    /cover-card__playback-indicator--visible/,
  );

  await playArtwork.focus();
  await page.keyboard.press('Enter');
  const pauseArtworkAgain = page.getByRole('button', {
    name: 'Pause Night Train Window',
  });
  await expect(pauseArtworkAgain).toBeVisible();

  await page.mouse.move(2_000, 2_000);
  await expect(indicator).toHaveClass(
    /cover-card__playback-indicator--visible/,
  );

  await pauseArtworkAgain.evaluate((button) => button.blur());
  await expect(indicator).not.toHaveClass(
    /cover-card__playback-indicator--visible/,
  );
});
