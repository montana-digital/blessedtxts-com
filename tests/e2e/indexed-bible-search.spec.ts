import { test, expect } from '@playwright/test';

test('indexed bible KJV search returns John 3:16 and links to reader', async ({ page }) => {
  await page.goto('/indexed-bible/#king-james-bible');

  const input = page.locator('#search-kjv');
  const results = page.locator('#results-kjv');

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/search/reference-map.json') && res.ok(),
      { timeout: 20_000 },
    ),
    input.fill('John 3:16'),
  ]);

  await expect(results.locator('li a')).toHaveCount(1, { timeout: 20_000 });
  await expect(results).toContainText(/John 3:16/i);
  await expect(results.locator('a').first()).toHaveAttribute('href', /\/king-james-bible\/read\/?#/);
});
