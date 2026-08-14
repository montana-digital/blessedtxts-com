import { test, expect } from '@playwright/test';

test.describe('about and contact pages', () => {
  test('about page shows project info and contact link', async ({ page }) => {
    await page.goto('/about/');

    await expect(page.locator('h1')).toHaveText('About Blessed Texts');
    await expect(page.getByRole('link', { name: 'reach out' })).toHaveAttribute('href', '/contact/');
    await expect(
      page.locator('.about-translations').getByRole('link', { name: 'King James Bible' }),
    ).toHaveAttribute('href', '/translations/king-james-bible/');
    await expect(
      page.locator('.about-translations').getByRole('link', { name: 'read online' }).first(),
    ).toHaveAttribute('href', '/king-james-bible/read/');

    const githubLink = page.getByRole('link', { name: 'View Blessed Texts on GitHub' });
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/montana-digital/blessedtxts-com',
    );
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    await expect(page.locator('.about-translations')).toHaveCount(1);
    await expect(page.locator('.about-translations a')).toHaveCount(6);
  });

  test('contact form shows placeholder message on submit', async ({ page }) => {
    await page.goto('/contact/');

    await page.locator('#contact-name').fill('Test User');
    await page.locator('#contact-email').fill('test@example.com');
    await page.locator('#contact-message').fill('Hello from Playwright.');
    await page.getByRole('button', { name: 'Send' }).click();

    const status = page.locator('#contact-status');
    await expect(status).toBeVisible();
    await expect(status).toContainText('Sending is not available yet');
  });

  test('legacy bible-versions URL redirects to about', async ({ page }) => {
    await page.goto('/bible-versions/');
    await expect(page).toHaveURL(/\/about\/$/);
  });

  test('legacy version index URL redirects to indexed bible section', async ({ page }) => {
    await page.goto('/king-james-bible/');
    await expect(page).toHaveURL(/\/indexed-bible\/#king-james-bible$/);
  });

  test('footer shows date and Montana Digital link', async ({ page }) => {
    await page.goto('/about/');

    const date = page.locator('#footer-date');
    await expect(date).not.toHaveText('');
    await expect(date).toHaveAttribute('datetime', /\d{4}-\d{2}-\d{2}/);

    const montanaLink = page.getByRole('link', { name: 'Montana Digital' });
    await expect(montanaLink).toHaveAttribute('href', 'https://montanadigital.dev');
  });
});
