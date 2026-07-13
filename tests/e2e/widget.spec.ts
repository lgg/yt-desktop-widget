import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const appVersion = (
  JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  ) as { version: string }
).version;

const SETTINGS_STORAGE_KEY = 'ytm-desktop-widget.settings';

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
  await expect(
    page.getByText('Show playback controls only on hover'),
  ).toBeVisible();
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
  const transportControls = page.locator('.transport-controls');
  await expect(transportControls).toHaveClass(/transport-controls--hidden/);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeHidden();

  await page.locator('.widget-window').hover();
  const hoveredHeight = await page
    .locator('.widget-window__layout')
    .evaluate((element) => element.scrollHeight);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  expect(hoveredHeight).toBe(collapsedHeight);

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
});

test('persists hover and connection badge preferences without layout shifts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 720, height: 760 });
  await page.goto('/?view=settings&source=simulator');

  const hoverOnlyToggle = page.getByLabel(
    'Show playback controls only on hover',
  );
  const badgeToggle = page.getByLabel('Hide connection status until hover');
  await expect(hoverOnlyToggle).toBeChecked();
  await hoverOnlyToggle.uncheck();
  await expect(hoverOnlyToggle).not.toBeChecked();
  await badgeToggle.check();
  await expect(badgeToggle).toBeChecked();

  await page.reload();
  await expect(hoverOnlyToggle).not.toBeChecked();
  await expect(badgeToggle).toBeChecked();

  await page.setViewportSize({ width: 336, height: 520 });
  await page.goto('/?source=simulator');
  await page.mouse.move(2_000, 2_000);
  const badge = page.locator('.widget-window__connection-badge');
  const layout = page.locator('.widget-window__layout');
  const idleHeight = await layout.evaluate((element) => element.scrollHeight);
  await expect(badge).toHaveClass(/widget-window__connection-badge--hidden/);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  await page.locator('.widget-window').hover();
  await expect(badge).not.toHaveClass(
    /widget-window__connection-badge--hidden/,
  );
  await expect(layout).toHaveJSProperty('scrollHeight', idleHeight);
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
          hidePlaybackControls: false,
          showPlaybackControlsOnHover: false,
          hideProgressBar: false,
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
          hidePlaybackControls: true,
          hideProgressBar: false,
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
          hidePlaybackControls: false,
          hideProgressBar: true,
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
          hidePlaybackControls: true,
          hideProgressBar: true,
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
              hidePlaybackControls: true,
              hideProgressBar: progressHidden,
              hideTrackDetails: true,
              hideConnectionBadge: false,
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
      .toBe('matrix(1, 0, 0, 1, 0, 0)');
  };

  await setCompactSettings(true);

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

  await setCompactSettings(false);

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
        backgroundImage: style.backgroundImage,
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
          hideTrackDetails: true,
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

  await playArtwork.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Pause Night Train Window' }),
  ).toBeVisible();

  await page.mouse.move(2_000, 2_000);
  await expect(indicator).not.toHaveClass(
    /cover-card__playback-indicator--visible/,
  );
});
