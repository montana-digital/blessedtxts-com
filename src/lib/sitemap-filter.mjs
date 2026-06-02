/** Shared sitemap exclusion rules — used by astro.config.mjs and src/lib/seo.ts */
const VERSION_SLUGS = 'king-james-bible|world-english-bible|websters-bible';

export const SITEMAP_DENY = [/\/bible-versions\/?$/];

export function shouldIncludeInSitemap(pageUrl) {
  let pathname;
  try {
    pathname = new URL(pageUrl).pathname;
  } catch {
    pathname = pageUrl;
  }

  if (SITEMAP_DENY.some((re) => re.test(pathname))) return false;

  const versionPrefix = new RegExp(`^\\/(${VERSION_SLUGS})(\\/|$)`);
  if (!versionPrefix.test(pathname)) return true;

  // Reader pages must stay indexable (do not match the book-segment deny rules).
  if (new RegExp(`^\\/(${VERSION_SLUGS})\\/read\\/?$`).test(pathname)) return true;

  if (new RegExp(`^\\/(${VERSION_SLUGS})\\/?$`).test(pathname)) return false;
  if (new RegExp(`^\\/(${VERSION_SLUGS})\\/[^/]+\\/\\d+\\/?$`).test(pathname)) return false;
  if (new RegExp(`^\\/(${VERSION_SLUGS})\\/[^/]+\\/?$`).test(pathname)) return false;

  return true;
}
