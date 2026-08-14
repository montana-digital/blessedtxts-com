import { test, expect } from '@playwright/test';
import { waitForReaderReady, navigateReaderHash } from './reader-helpers';

test('verse toolbar appears on select and supports bookmark', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'genesis-1');
  await expect(page.locator('#genesis-1-v1')).toBeVisible({ timeout: 20_000 });

  const verse = page.locator('#genesis-1-v1');
  await verse.click();
  await expect(verse).toHaveClass(/verse-selected/);
  await expect(page).toHaveURL(/\/king-james-bible\/read\/?#genesis-1-v1/);

  const toolbar = page.locator('#reader-verse-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toContainText('Genesis 1:1');

  await toolbar.locator('[data-action="bookmark"]').click();
  await expect(page.locator('#reader-bookmarks-nav')).toContainText('Genesis 1:1');

  await page.reload();
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'genesis-1');
  await expect(page.locator('#reader-bookmarks-nav')).toContainText('Genesis 1:1', { timeout: 10_000 });
  await expect(page.locator('#genesis-1-v1')).toHaveClass(/verse-bookmarked/);
});

test('toolbar hides when verse is deselected', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'genesis-1');
  await expect(page.locator('#genesis-1-v1')).toBeVisible({ timeout: 20_000 });

  await page.locator('#genesis-1-v1').click();
  await expect(page.locator('#reader-verse-toolbar')).toBeVisible();

  await page.locator('#genesis-1-v1').click();
  await expect(page.locator('#reader-verse-toolbar')).toBeHidden();
  await expect(page).toHaveURL(/\/king-james-bible\/read\/?#genesis-1$/);
});

test('verse hash navigation shows toolbar without extra click', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'genesis-1-v1');
  await expect(page.locator('#genesis-1-v1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#reader-verse-toolbar')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#genesis-1-v1')).toHaveClass(/verse-selected/);
  await expect(page.locator('#reader-verse-toolbar')).toContainText('Genesis 1:1');
});

test('chapter download click does not hide toolbar', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'genesis-1');
  await expect(page.locator('#genesis-1-v1')).toBeVisible({ timeout: 20_000 });

  await page.locator('#genesis-1-v1').click();
  await expect(page.locator('#reader-verse-toolbar')).toBeVisible();

  await page.locator('#genesis-1 [data-dl="txt"]').click();
  await expect(page.locator('#reader-verse-toolbar')).toBeVisible();
  await expect(page.locator('#genesis-1-v1')).toHaveClass(/verse-selected/);
});
