import { test, expect } from '@playwright/test';

test.describe('site chrome', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mobile menu opens and closes', async ({ page }) => {
    await page.goto('/');

    const menu = page.locator('#mobile-menu');
    const button = page.locator('.mobile-menu-button');

    await expect(menu).toHaveAttribute('data-state', 'closed');
    await expect(button).toHaveAttribute('aria-label', 'Open main menu');

    await button.click();
    await expect(menu).toHaveAttribute('data-state', 'open');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(button).toHaveAttribute('aria-label', 'Close main menu');

    await button.click();
    await expect(menu).toHaveAttribute('data-state', 'closed');
    await expect(button).toHaveAttribute('aria-label', 'Open main menu');
  });

  test('theme toggle persists after reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await page.locator('#themeToggle').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);

    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });

  test('reader uses light panel surface in light mode', async ({ page }) => {
    await page.goto('/websters-bible/read/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    const readerBg = await page.locator('.reader-main').evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });
    expect(readerBg).not.toBe('rgba(10, 25, 47, 0.92)');
    expect(readerBg).toMatch(/rgb\(255,\s*255,\s*255\)|rgb\(255, 255, 255\)/);
  });
});
