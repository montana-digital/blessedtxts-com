import canon from '../data/canon.json' with { type: 'json' };

/** Canonical Protestant OT + NT book order */
export const OT_BOOKS = canon.otBooks;
export const NT_BOOKS = canon.ntBooks;
export const ALL_BOOKS = [...OT_BOOKS, ...NT_BOOKS];

const SLUG_MAP = canon.slugMap;
const SLUG_TO_BOOK = canon.slugToBook;

export function bookToSlug(book) {
  if (SLUG_MAP[book]) return SLUG_MAP[book];
  return book.toLowerCase().replace(/\s+/g, '-');
}

export function slugToBook(slug) {
  if (SLUG_TO_BOOK[slug]) return SLUG_TO_BOOK[slug];
  for (const book of ALL_BOOKS) {
    if (bookToSlug(book) === slug) return book;
  }
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const OT_BOOK_ALIASES = { Psalm: true, Psalms: true };

export function getTestament(book) {
  if (OT_BOOKS.includes(book) || OT_BOOK_ALIASES[book]) return 'ot';
  return 'nt';
}

export const VERSIONS = {
  kjv: {
    id: 'kjv',
    routeSlug: 'king-james-bible',
    label: 'King James Bible',
    shortLabel: 'KJV',
    rawFile: 'kjv.txt',
  },
  web: {
    id: 'web',
    routeSlug: 'world-english-bible',
    label: 'World English Bible',
    shortLabel: 'WEB',
    rawFile: 'web.txt',
  },
  webster: {
    id: 'webster',
    routeSlug: 'websters-bible',
    label: 'Webster Bible',
    shortLabel: 'WBT',
    rawFile: 'worldbibletext.txt',
  },
};
