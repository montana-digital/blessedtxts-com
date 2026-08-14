import { test, expect } from '@playwright/test';

test('search Genesis 1 resolves to Genesis 1:1 without MiniSearch index', async ({ page }) => {
  const indexRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('index-kjv.min.json')) indexRequests.push(req.url());
  });

  await page.goto('/king-james-bible/read/');
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });

  const input = page.locator('#reader-search-input');
  const results = page.locator('#reader-search-results');

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/search/verse-id-map-kjv') && res.ok(),
      { timeout: 20_000 },
    ),
    input.fill('Genesis 1'),
  ]);

  await expect(results.locator('li a')).toHaveCount(1, { timeout: 20_000 });
  await expect(results).toContainText(/Genesis 1:1/i);
  expect(indexRequests.length).toBe(0);
});
