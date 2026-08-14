import { test, expect } from '@playwright/test';
import {
  waitForReaderReady,
  navigateReaderHash,
  expectReaderAtTop,
  expectVerseCenteredInReadingBand,
} from './reader-helpers';

test('reader page loads book shells', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await expect(page.locator('#genesis')).toBeAttached();
  await expectReaderAtTop(page);
});

test('plain load ignores saved last position and stays at top', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fbv:last-position:king-james-bible', 'genesis-1');
  });
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await expect(page).toHaveURL(/\/king-james-bible\/read\/?$/);
  await expectReaderAtTop(page);
});

test('hash in URL on load navigates to the passage', async ({ page }) => {
  await page.goto('/king-james-bible/read/#john-3-v16');
  await waitForReaderReady(page);
  await expect(page).toHaveURL(/\/king-james-bible\/read\/?#john-3-v16/);
  const verse = page.locator('#john-3-v16');
  await expect(verse).toBeVisible({ timeout: 20_000 });
  await expect(verse.locator('.verse-text')).toContainText(/God|loved|world/i);
});

test('hash navigation loads John 3:16 after hashchange', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'john-3-v16');
  await expect(page.locator('#john-3-v16')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#john-3-v16 .verse-text')).toContainText(/God|loved|world/i);
});

test('chapter headers show book name and inline downloads', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'genesis-1');

  await expect(page.locator('#genesis-1 .reader-chapter-label')).toHaveText('Genesis 1', {
    timeout: 20_000,
  });
  await expect(page.locator('#genesis-1 .reader-chapter-downloads')).toContainText('Download .txt');
  await expect(page.locator('#genesis-1 .reader-chapter-downloads')).toContainText('Download .md');
  await expect(page.locator('#genesis-1 .reader-chapter-downloads a[data-dl="pdf"]')).toHaveCount(0);
  await expect(page.locator('#reader-chapter-download')).toHaveCount(0);
});

test('verse hash updates chapter header label', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'genesis-1-v1');

  await expect(page.locator('#genesis-1 .reader-chapter-label')).toHaveText('Genesis 1:1', {
    timeout: 20_000,
  });
});

test('verse navigation applies temporary highlight', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'john-3-v16');
  await expect(page.locator('#reader-loading-modal')).toBeHidden({ timeout: 20_000 });

  const verse = page.locator('#john-3-v16');
  await expect(verse).toBeVisible({ timeout: 20_000 });
  await expect(verse).toHaveClass(/verse-highlight/);

  await page.waitForTimeout(2800);
  await expect(verse).not.toHaveClass(/verse-highlight/);
});

test('verse hash shows loading modal then dismisses', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);

  const modalPromise = expect(page.locator('#reader-loading-modal')).toBeVisible({ timeout: 5_000 });
  await navigateReaderHash(page, 'john-3-v16');
  await modalPromise;
  await expect(page.locator('#reader-loading-modal')).toContainText(/Loading Bible verses/i);

  await expect(page.locator('#john-3-v16')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#reader-loading-modal')).toBeHidden({ timeout: 20_000 });
});

test('verse hash centers in reading band between header and toolbar', async ({ page }) => {
  await page.goto('/king-james-bible/read/');
  await waitForReaderReady(page);
  await navigateReaderHash(page, 'john-3-v16');
  await expect(page.locator('#john-3-v16')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#reader-verse-toolbar')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#reader-loading-modal')).toBeHidden();

  await expectVerseCenteredInReadingBand(page, 'john-3-v16');
});
