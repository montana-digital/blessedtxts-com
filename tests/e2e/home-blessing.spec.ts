import { test, expect } from '@playwright/test';

test.describe('home blessing generator', () => {
  test('generates a random verse from the default pool', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-intro')).toBeVisible();
    await expect(page.locator('.home-intro a[href="/indexed-bible/"]')).toBeVisible();
    await page.locator('#btn-all').click();

    const panel = page.locator('#verse-panel');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await expect(panel).toBeVisible();
    await expect(page.locator('#verse-text')).not.toBeEmpty();
    await expect(page.locator('#verse-cite')).not.toBeEmpty();
  });

  test('translation pool buttons show a verse with read-in-bible link', async ({ page }) => {
    await page.goto('/');

    await page.locator('#btn-kjv-ot').click();
    await expect(page.locator('#verse-panel')).toBeVisible();
    await expect(page.locator('#verse-cite')).toContainText(/King James/i);

    const readLink = page.locator('#btn-read-context');
    await expect(readLink).toBeVisible();
    await expect(readLink).toHaveAttribute('href', /\/read#/);
  });

  test('world and webster pools generate verses', async ({ page }) => {
    await page.goto('/');

    await page.locator('#btn-web').click();
    await expect(page.locator('#verse-text')).not.toBeEmpty();

    await page.locator('#btn-clear').click();
    await expect(page.locator('#verse-panel')).toBeHidden();

    await page.locator('#btn-webster').click();
    await expect(page.locator('#verse-text')).not.toBeEmpty();
  });

  test('download button creates a txt file', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-all').click();
    await expect(page.locator('#verse-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#verse-text')).not.toBeEmpty();
    await expect(page.locator('#verse-cite')).not.toBeEmpty();
    await expect(page.locator('#btn-download')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-download').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('free_blessing.txt');
  });
});
