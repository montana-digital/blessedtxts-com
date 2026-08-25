import { test, expect } from '@playwright/test';
import { waitForReaderReady } from './reader-helpers';

test('John 3 chapter includes verse 16 and prev/next', async ({ page }) => {
  await page.goto('/king-james-bible/john/3/');
  await expect(page.locator('h1')).toContainText(/John 3/i);
  await expect(page.locator('#v16')).toContainText(/For God so loved the world/i);
  await expect(page.getByRole('link', { name: '← Previous' })).toHaveAttribute(
    'href',
    '/king-james-bible/john/2/',
  );
  await expect(page.getByRole('link', { name: 'Next →' })).toHaveAttribute(
    'href',
    '/king-james-bible/john/4/',
  );
});

test('John 3 links the same chapter in WEB and Webster', async ({ page }) => {
  await page.goto('/king-james-bible/john/3/');
  const nav = page.getByRole('navigation', { name: 'Same chapter in other translations' });
  await expect(nav.getByRole('link', { name: 'World English Bible' })).toHaveAttribute(
    'href',
    '/world-english-bible/john/3/',
  );
  await expect(nav.getByRole('link', { name: 'Webster Bible' })).toHaveAttribute(
    'href',
    '/websters-bible/john/3/',
  );
  await expect(nav.locator('[aria-current="page"]')).toHaveText('King James Bible');
});

test('unknown chapter shows 404 recovery links', async ({ page }) => {
  const response = await page.goto('/king-james-bible/genesis/999/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText(/Page not found/i);
  await expect(page.getByText(/If you were looking for a book or chapter/i)).toBeVisible();
  await expect(page.locator('#main-content').getByRole('link', { name: 'Indexed Bible' }).first()).toBeVisible();
  await expect(page.locator('#bible-404-reader')).toHaveAttribute(
    'href',
    '/king-james-bible/read/',
  );
});

test('unknown book shows 404', async ({ page }) => {
  const response = await page.goto('/king-james-bible/not-a-book/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText(/Page not found/i);
  await expect(page.getByText(/If you were looking for a book or chapter/i)).toBeVisible();
});

test('404 on a WEB path links the WEB reader', async ({ page }) => {
  const response = await page.goto('/world-english-bible/genesis/999/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('#bible-404-reader')).toHaveAttribute(
    'href',
    '/world-english-bible/read/',
  );
});

test('chapter reader CTA reaches a ready reader', async ({ page }) => {
  await page.goto('/king-james-bible/john/3/');
  await page.getByRole('link', { name: /open in full reader/i }).click();
  await waitForReaderReady(page);
});
