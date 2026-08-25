import { test, expect } from '@playwright/test';

test('topics index lists all topic pages', async ({ page }) => {
  await page.goto('/topics/');
  await expect(page.locator('h1')).toContainText(/Bible topics/i);
  await expect(page.locator('a[href="/topics/hope/"]')).toBeVisible();
  await expect(page.locator('a[href="/topics/faith/"]')).toBeVisible();
  await expect(page.locator('a[href="/topics/prayer/"]')).toBeVisible();
  await expect(page.locator('a[href="/topics/anxiety/"]')).toBeVisible();
});

test('topic page shows KJV excerpts with chapter links', async ({ page }) => {
  await page.goto('/topics/hope/');
  await expect(page.locator('h1')).toContainText(/hope/i);
  const firstLink = page.locator('.topic-verses a').first();
  await expect(firstLink).toBeVisible();
  const href = await firstLink.getAttribute('href');
  expect(href).toMatch(/\/king-james-bible\/[^/]+\/\d+\/#v\d+/);
  await expect(page.locator('.topic-verses blockquote p').first()).not.toBeEmpty();
  await expect(page.getByRole('link', { name: 'Open in reader' }).first()).toHaveAttribute(
    'href',
    /\/read\/#.+?-v\d+/,
  );
});
