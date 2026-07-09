import { expect, test } from '@playwright/test';

const SETTINGS_STORAGE_KEY = 'ytm-desktop-widget.settings';

test('renders the simulated widget and settings views', async ({ page }) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');

  await expect(page.getByText('Night Train Window')).toBeVisible();
  await expect(page.getByText('Live')).toBeVisible();
  await page.locator('.widget-window').hover();

  const playingHeight = await page.locator('.widget-window__layout').evaluate(
    (element) => element.scrollHeight,
  );
  expect(playingHeight).toBeLessThanOrEqual(500);

  const progressMetrics = await page.locator('.progress-row').evaluate((row) => {
    const rowRect = row.getBoundingClientRect();
    const layoutRect = row.closest('.widget-window__layout')?.getBoundingClientRect();
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
  await expect(page.getByText('Show playback controls only on hover')).toBeVisible();
});

test('mounts hover-only playback controls only while the widget is hovered', async ({ page }) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await expect(page.getByText('Night Train Window')).toBeVisible();

  const collapsedHeight = await page.locator('.widget-window__layout').evaluate(
    (element) => element.scrollHeight,
  );
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0);

  await page.locator('.widget-window').hover();
  const hoveredHeight = await page.locator('.widget-window__layout').evaluate(
    (element) => element.scrollHeight,
  );
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  expect(hoveredHeight).toBeGreaterThan(collapsedHeight + 40);

  await page.getByRole('button', { name: 'Pause' }).hover();
  const transportTransforms = await page.locator('.transport-controls').evaluate((row) => {
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

  await page.locator('.widget-window').dispatchEvent('pointerout', { relatedTarget: null });
  const collapsedAgainHeight = await page.locator('.widget-window__layout').evaluate(
    (element) => element.scrollHeight,
  );
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0);
  expect(collapsedAgainHeight).toBe(collapsedHeight);
});

test('keeps playback controls mounted when hover-only controls are disabled', async ({ page }) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          hidePlaybackControls: false,
          showPlaybackControlsOnHover: false,
          hideProgressBar: false,
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await expect(page.getByText('Night Train Window')).toBeVisible();

  const alwaysVisibleHeight = await page.locator('.widget-window__layout').evaluate(
    (element) => element.scrollHeight,
  );
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  await page.locator('.widget-window').dispatchEvent('pointerout', { relatedTarget: null });
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(page.locator('.widget-window__layout')).toHaveJSProperty(
    'scrollHeight',
    alwaysVisibleHeight,
  );
});

test('collapses the simulated widget when display sections are hidden', async ({ page }) => {
  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await page.locator('.widget-window').hover();

  const fullHeight = await page.locator('.widget-window__layout').evaluate(
    (element) => element.scrollHeight,
  );
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Seek position' })).toBeVisible();

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          hidePlaybackControls: true,
          hideProgressBar: false,
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await page.locator('.widget-window').hover();

  const noControlsHeight = await page.locator('.widget-window__layout').evaluate(
    (element) => element.scrollHeight,
  );
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Seek position' })).toBeVisible();
  expect(noControlsHeight).toBeLessThan(fullHeight - 40);

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          hidePlaybackControls: false,
          hideProgressBar: true,
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await page.locator('.widget-window').hover();

  const noProgressHeight = await page.locator('.widget-window__layout').evaluate(
    (element) => element.scrollHeight,
  );
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Seek position' })).toHaveCount(0);
  expect(noProgressHeight).toBeLessThan(fullHeight - 15);

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ui: {
          hidePlaybackControls: true,
          hideProgressBar: true,
        },
      }),
    );
  }, SETTINGS_STORAGE_KEY);
  await page.reload();
  await page.locator('.widget-window').hover();

  const collapsedHeight = await page.locator('.widget-window__layout').evaluate(
    (element) => element.scrollHeight,
  );
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Seek position' })).toHaveCount(0);
  expect(collapsedHeight).toBeLessThan(noControlsHeight);
  expect(collapsedHeight).toBeLessThan(noProgressHeight);
});
