import { test, expect } from '@playwright/test';
import { waitForReaderReady } from './reader-helpers';

test('chapter page shows verse HTML and opens the reader', async ({ page }) => {
  await page.goto('/king-james-bible/genesis/1/#v1');
  await expect(page.locator('h1')).toContainText(/Genesis 1/i);
  await expect(page.locator('#v1')).toBeVisible();
  await expect(page.locator('#v1 .verse-text')).not.toBeEmpty();
  await page.getByRole('link', { name: /open in full reader/i }).click();
  await page.waitForURL(/\/king-james-bible\/read/, { timeout: 15_000 });
  await waitForReaderReady(page);
});
