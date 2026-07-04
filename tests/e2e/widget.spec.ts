import { expect, test } from '@playwright/test';

test('renders the simulated widget and settings views', async ({ page }) => {
  await page.goto('/?source=simulator');

  await expect(page.getByText('Night Train Window')).toBeVisible();
  await expect(page.getByText('Live')).toBeVisible();

  await page.goto('/?view=settings&source=simulator');
  await expect(page.getByText('Widget Settings')).toBeVisible();
  await expect(page.getByText('API / Connection')).toBeVisible();
  await expect(page.getByText('UI / Display')).toBeVisible();
});