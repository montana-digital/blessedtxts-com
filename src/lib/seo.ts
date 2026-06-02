import { SITE_NAME } from '../site.config';

export const SITE_URL = 'https://blessedtxts.com';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const OG_IMAGE_ALT = 'Blessed Texts — free online Bible reader and verse generator';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const THEME_COLOR = '#1a365d';

export { shouldIncludeInSitemap } from './sitemap-filter.mjs';

export function absoluteUrl(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const normalized = path.endsWith('/') || path === '/' ? path : `${path}/`;
  return new URL(normalized, SITE_URL).href;
}

export function webSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Free online Bible reader with King James, World English, and Webster translations. Search verses, browse by topic, and download Scripture.',
    inLanguage: 'en',
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.webp`,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url?: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url.startsWith('http') ? item.url : absoluteUrl(item.url) } : {}),
    })),
  };
}

export function bookJsonLd(opts: {
  name: string;
  description: string;
  url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: 'en',
    license: 'https://creativecommons.org/publicdomain/mark/1.0/',
    isAccessibleForFree: true,
  };
}
