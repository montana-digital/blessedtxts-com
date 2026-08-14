import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile drawer hides sidebar until opened', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });

  const drawer = page.locator('#reader-sidebar-drawer');
  await expect(drawer).not.toHaveClass(/is-open/);

  await page.locator('#reader-nav-open').click();
  await expect(drawer).toHaveClass(/is-open/);
  await expect(page.locator('#reader-topics-nav')).toBeVisible();
});
