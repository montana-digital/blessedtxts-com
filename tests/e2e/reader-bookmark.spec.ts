import { test, expect } from '@playwright/test';
import { waitForReaderReady, navigateReaderHash } from './reader-helpers';

test('bookmark persists after reload', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'genesis-1');
  await expect(page.locator('#genesis-1-v1')).toBeVisible({ timeout: 20_000 });

  await page.locator('#genesis-1-v1').click();
  await expect(page.locator('#reader-verse-toolbar')).toBeVisible({ timeout: 5_000 });
  await page.locator('#reader-verse-toolbar [data-action="bookmark"]').click();
  await expect(page.locator('#genesis-1-v1')).toHaveClass(/verse-bookmarked/);

  await expect(page.locator('#reader-bookmarks-nav')).toContainText('Genesis 1:1');

  await page.reload();
  await waitForReaderReady(page);
  await expect(page.locator('#reader-bookmarks-nav')).toContainText('Genesis 1:1', { timeout: 10_000 });
});
