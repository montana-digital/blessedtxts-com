import { test, expect } from '@playwright/test';

test('keyword search does not fetch MiniSearch index or verse-id-map', async ({ page }) => {
  const indexRequests: string[] = [];
  const mapRequests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('index-kjv.min.json')) indexRequests.push(url);
    if (url.includes('verse-id-map-kjv')) mapRequests.push(url);
  });

  await page.goto('/king-james-bible/read/');
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });

  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/search/keywords-kjv/') && res.ok()),
    page.locator('#reader-search-input').fill('beginning'),
  ]);

  await expect(page.locator('#reader-search-results li a')).not.toHaveCount(0, { timeout: 20_000 });
  expect(indexRequests.length).toBe(0);
  expect(mapRequests.length).toBe(0);
});
