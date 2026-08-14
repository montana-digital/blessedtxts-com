import { expect, type Page } from '@playwright/test';

export async function waitForReaderReady(page: Page): Promise<void> {
  await expect(page.locator('#reader-content .reader-book')).toHaveCount(66, { timeout: 20_000 });
}

/** Simulate in-page hash navigation after load (sidebar / shared-link follow-up). */
export async function navigateReaderHash(page: Page, anchor: string): Promise<void> {
  await page.evaluate((hash) => {
    const path = `${window.location.pathname}#${hash}`;
    if (history.replaceState) {
      history.replaceState(null, '', path);
    } else {
      window.location.hash = hash;
    }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, anchor);
}

export async function expectReaderAtTop(page: Page): Promise<void> {
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5_000 })
    .toBeLessThan(80);
}

/** Mirrors src/scripts/reader-scroll.ts centering math (reserveToolbar: true). */
export async function expectVerseCenteredInReadingBand(
  page: Page,
  verseId: string,
  tolerancePx = 24,
): Promise<void> {
  await expect
    .poll(
      async () =>
        page.evaluate(
          ({ id, tolerance }) => {
            const HEADER_FALLBACK_PX = 64;
            const TOOLBAR_FALLBACK_MOBILE_PX = 120;
            const TOOLBAR_FALLBACK_DESKTOP_PX = 72;

            const el = document.getElementById(id);
            const header = document.querySelector<HTMLElement>('.site-header');
            if (!el || !header) return false;

            const headerH = header.getBoundingClientRect().height || HEADER_FALLBACK_PX;
            const toolbar = document.getElementById('reader-verse-toolbar');
            const measured = toolbar?.getBoundingClientRect().height;
            const toolbarH =
              measured && measured > 0
                ? measured
                : window.matchMedia('(max-width: 900px)').matches
                  ? TOOLBAR_FALLBACK_MOBILE_PX
                  : TOOLBAR_FALLBACK_DESKTOP_PX;

            const bandTop = headerH;
            const bandBottom = window.innerHeight - toolbarH;
            const desiredCenter = bandTop + (bandBottom - bandTop) / 2;
            const elCenter = el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2;
            return Math.abs(elCenter - desiredCenter) <= tolerance;
          },
          { id: verseId, tolerance: tolerancePx },
        ),
      { timeout: 15_000 },
    )
    .toBe(true);
}
