import { test, expect } from '@playwright/test';
import { waitForReaderReady } from './reader-helpers';

test('legacy book URL redirects to reader', async ({ page }) => {
  await page.goto('/king-james-bible/genesis/');
  await page.waitForURL(/\/king-james-bible\/read/, { timeout: 15_000 });
  await waitForReaderReady(page);
  await expect(page).toHaveURL(/\/king-james-bible\/read\/?#genesis-1$/);
});
