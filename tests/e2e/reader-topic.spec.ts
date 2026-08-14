import { test, expect } from '@playwright/test';
import { expectVerseCenteredInReadingBand } from './reader-helpers';

test('Hope topic shows search results without navigating', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });
  await page.locator('.reader-topic-btn[data-topic="hope"]').click();
  await expect(page.locator('#reader-search-results li a')).not.toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('#reader-search-results')).toContainText(/Hope/i);
});

test('Hope topic does not auto-navigate; user click loads verse', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });

  await page.evaluate(() => window.scrollTo(0, 2000));

  const modal = page.locator('#reader-loading-modal');
  await page.locator('.reader-topic-btn[data-topic="hope"]').click();

  await expect(page.locator('#reader-search-results')).toContainText(/Hope/i, { timeout: 10_000 });
  const firstLink = page.locator('#reader-search-results li:not(.reader-results-heading) a').first();
  await expect(firstLink).toBeVisible({ timeout: 10_000 });

  const href = await firstLink.getAttribute('href');
  expect(href).toMatch(/#.+?-v\d+/);
  const hash = href!.split('#')[1] ?? '';

  await expect(modal).toBeHidden({ timeout: 2_000 });

  const verseInViewBeforeClick = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }, hash);
  expect(verseInViewBeforeClick).toBe(false);

  await firstLink.click({ force: true });
  await expect(page.locator(`#${hash}`)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#reader-verse-toolbar')).toBeVisible({ timeout: 10_000 });
});

test('search result shows loading modal then centers verse', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });

  const input = page.locator('#reader-search-input');
  await input.fill('faith');
  const resultLinks = page.locator('#reader-search-results li:not(.reader-results-heading) a');
  await expect(resultLinks.first()).toBeVisible({ timeout: 10_000 });
  await page.evaluate(() => {
    document.querySelectorAll('.reader-search-suggest-item').forEach((el) => el.remove());
  });

  const modal = page.locator('#reader-loading-modal');
  const [modalShown] = await Promise.all([
    page.waitForSelector('#reader-loading-modal:not([hidden])', { timeout: 8_000 }),
    resultLinks.first().click({ force: true }),
  ]);
  expect(modalShown).toBeTruthy();

  const href = await resultLinks.first().getAttribute('href');
  expect(href).toMatch(/#.+?-v\d+/);

  await expect(modal).toBeHidden({ timeout: 20_000 });

  const hash = href!.split('#')[1] ?? '';
  await expect(page.locator(`#${hash}`)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#reader-verse-toolbar')).toBeVisible({ timeout: 10_000 });
  await expectVerseCenteredInReadingBand(page, hash);
});

test('rapid search prev/next does not leave loading modal open', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });

  const input = page.locator('#reader-search-input');
  await input.fill('faith');
  const resultLinks = page.locator('#reader-search-results li:not(.reader-results-heading) a');
  await expect(resultLinks.first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#reader-search-next')).toBeEnabled({ timeout: 5_000 });

  await page.evaluate(() => {
    document.querySelectorAll('.reader-search-suggest-item').forEach((el) => el.remove());
  });

  await resultLinks.first().click({ force: true });

  await page.evaluate(() => {
    const prev = document.getElementById('reader-search-prev');
    const next = document.getElementById('reader-search-next');
    for (let i = 0; i < 3; i++) {
      next?.click();
      prev?.click();
    }
  });

  await expect(page.locator('#reader-loading-modal')).toBeHidden({ timeout: 20_000 });
  await expect(page.locator('html')).not.toHaveClass(/reader-loading-open/);
});
