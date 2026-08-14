import { test, expect } from '@playwright/test';

test('search Jn 3:16 shows results and navigates', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });

  const input = page.locator('#reader-search-input');
  const results = page.locator('#reader-search-results');

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/search/reference-map.json') && res.ok(),
      { timeout: 20_000 },
    ),
    page.waitForResponse(
      (res) => res.url().includes('/search/verse-id-map-kjv') && res.ok(),
      { timeout: 20_000 },
    ),
    input.fill('Jn 3:16'),
  ]);

  await expect(results.locator('li a')).toHaveCount(1, { timeout: 20_000 });
  await expect(results).toContainText(/John 3:16/i);
  await expect(page.locator('#reader-search-results .reader-search-error')).toHaveCount(0);
});
