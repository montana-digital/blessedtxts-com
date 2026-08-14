import { test, expect } from '@playwright/test';

test('back-to-top appears after scroll and returns to page top', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });

  const btn = page.locator('#reader-back-to-top');
  await expect(btn).toBeHidden();

  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(btn).toBeVisible();

  await btn.click();
  await page.waitForFunction(() => window.scrollY < 50);
  await expect(btn).toBeHidden();
});
