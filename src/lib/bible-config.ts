import canon from '../../data/canon.json';

export const VERSIONS = {
  kjv: {
    id: 'kjv',
    routeSlug: 'king-james-bible',
    label: 'King James Bible',
    shortLabel: 'KJV',
    facts: 'Authorized in 1611, this classic translation shaped English literature and worship for centuries.',
    seoDescription:
      'Read the King James Bible (KJV) online. Search Scripture, browse every book, and download free TXT, MD, or PDF files on Blessed Texts.',
  },
  web: {
    id: 'web',
    routeSlug: 'world-english-bible',
    label: 'World English Bible',
    shortLabel: 'WEB',
    facts: 'A modern, public-domain English Bible built for clear reading online and worldwide use.',
    seoDescription:
      'Read the World English Bible online. Modern public-domain Scripture with search, bookmarks, and free TXT, MD, or PDF downloads on Blessed Texts.',
  },
  webster: {
    id: 'webster',
    routeSlug: 'websters-bible',
    label: 'Webster Bible',
    shortLabel: 'WBT',
    facts: 'Noah Webster’s 1833 revision offers plainer American English while keeping close ties to the King James tradition.',
    seoDescription:
      'Read the Webster Bible (WBT) online. Noah Webster’s 1833 revision with search, bookmarks, and free TXT, MD, or PDF downloads on Blessed Texts.',
  },
} as const;

export type VersionId = keyof typeof VERSIONS;

export function routeSlugToId(slug: string): VersionId | undefined {
  return Object.values(VERSIONS).find((v) => v.routeSlug === slug)?.id as VersionId | undefined;
}

export const ROUTE_SLUGS = Object.values(VERSIONS).map((v) => v.routeSlug);

export const OT_BOOKS: readonly string[] = canon.otBooks;
export const NT_BOOKS: readonly string[] = canon.ntBooks;

const SLUG_MAP: Record<string, string> = canon.slugMap;
const SLUG_TO_BOOK: Record<string, string> = canon.slugToBook;

export function bookToSlug(book: string): string {
  return SLUG_MAP[book] || book.toLowerCase().replace(/\s+/g, '-');
}

export function slugToBook(slug: string): string {
  if (SLUG_TO_BOOK[slug]) return SLUG_TO_BOOK[slug];
  for (const book of [...OT_BOOKS, ...NT_BOOKS]) {
    if (bookToSlug(book) === slug) return book;
  }
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
