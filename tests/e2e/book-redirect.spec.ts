import { test, expect } from '@playwright/test';
import { waitForReaderReady } from './reader-helpers';

test('book page lists chapters and links to the reader', async ({ page }) => {
  await page.goto('/king-james-bible/genesis/');
  await expect(page.locator('h1')).toContainText(/Genesis/i);
  await expect(page.locator('a[href="/king-james-bible/genesis/1/"]')).toBeVisible();
  const readerCta = page.getByRole('link', { name: /open genesis in full reader/i });
  await expect(readerCta).toBeVisible();
  await readerCta.click();
  await page.waitForURL(/\/king-james-bible\/read/, { timeout: 15_000 });
  await waitForReaderReady(page);
});
