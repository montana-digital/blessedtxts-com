import { test, expect } from '@playwright/test';
import { waitForReaderReady } from './reader-helpers';

test('legacy chapter URL redirects to reader verse', async ({ page }) => {
  await page.goto('/king-james-bible/genesis/1/#v1');
  await page.waitForURL(/\/king-james-bible\/read#genesis-1-v1/, { timeout: 15_000 });
  await waitForReaderReady(page);
  await expect(page.locator('#genesis-1-v1')).toBeVisible({ timeout: 20_000 });
});
