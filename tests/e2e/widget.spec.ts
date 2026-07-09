import { expect, test } from '@playwright/test';

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
});
