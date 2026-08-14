import { test, expect } from '@playwright/test';
import { waitForReaderReady, navigateReaderHash } from './reader-helpers';

test('translation select preserves hash across translation', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'john-3-v16');
  await expect(page.locator('#john-3-v16')).toBeVisible({ timeout: 20_000 });

  const select = page.locator('#reader-translation-select');
  await expect(select).toHaveValue('king-james-bible');

  await select.selectOption('world-english-bible');
  await page.waitForURL(/\/world-english-bible\/read#john-3-v16/, { timeout: 15_000 });
  await waitForReaderReady(page);
  await expect(page).toHaveURL(/\/world-english-bible\/read\/?#john-3-v16$/);
  await expect(page.locator('#john-3-v16')).toBeVisible({ timeout: 15_000 });
});
