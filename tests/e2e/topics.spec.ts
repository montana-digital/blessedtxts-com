import { test, expect } from '@playwright/test';

test('topics index lists all topic pages', async ({ page }) => {
  await page.goto('/topics/');
  await expect(page.locator('h1')).toContainText(/Bible topics/i);
  await expect(page.locator('a[href="/topics/hope/"]')).toBeVisible();
  await expect(page.locator('a[href="/topics/faith/"]')).toBeVisible();
});

test('topic page shows KJV excerpts with reader deep links', async ({ page }) => {
  await page.goto('/topics/hope/');
  await expect(page.locator('h1')).toContainText(/hope/i);
  const firstLink = page.locator('.topic-verses a').first();
  await expect(firstLink).toBeVisible();
  const href = await firstLink.getAttribute('href');
  expect(href).toMatch(/\/read\/#.+?-v\d+/);
  await expect(page.locator('.topic-verses blockquote p').first()).not.toBeEmpty();
});
