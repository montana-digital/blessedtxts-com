import { VERSIONS } from './lib/bible-config';

export const SITE_NAME = 'Blessed Texts';
export const SITE_TITLE_SUFFIX = ` | ${SITE_NAME}`;
export const MONTANA_DIGITAL_URL = 'https://montanadigital.dev';
export const GITHUB_REPO_URL = 'https://github.com/montana-digital/blessedtxts-com';
export const AHREFS_ANALYTICS_KEY = 'sgrlIPQVYVsGp2+/WsuxAw';
export const HOME_SUBTITLE =
  'Blessed Texts — free random Bible verses from the King James, World English, and Webster translations.';

export const headerNav = [
  { name: 'Home', url: '/' },
  { name: 'About', url: '/about/' },
  { name: 'KJV', url: `/${VERSIONS.kjv.routeSlug}/read/` },
  { name: 'World Bible', url: `/${VERSIONS.web.routeSlug}/read/` },
  { name: "Webster's", url: `/${VERSIONS.webster.routeSlug}/read/` },
  { name: 'Indexed Bible', url: '/indexed-bible/' },
  { name: 'Contact', url: '/contact/' },
] as const;

export const footerNav = [
  { name: 'Home', url: '/' },
  { name: 'About', url: '/about/' },
  { name: 'Contact', url: '/contact/' },
  { name: 'Browse the Indexed Bible', url: '/indexed-bible/' },
  { name: 'Bible verses by topic', url: '/topics/' },
  { name: 'Download Bible files', url: '/downloads/' },
  { name: 'Read King James Bible', url: `/${VERSIONS.kjv.routeSlug}/read/` },
  { name: 'Read World English Bible', url: `/${VERSIONS.web.routeSlug}/read/` },
  { name: 'Read Webster Bible', url: `/${VERSIONS.webster.routeSlug}/read/` },
] as const;

export function pageTitle(segment: string): string {
  return `${segment}${SITE_TITLE_SUFFIX}`;
}
