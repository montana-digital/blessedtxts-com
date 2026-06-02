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
  return (Object.values(VERSIONS).find((v) => v.routeSlug === slug)?.id) as VersionId | undefined;
}

export const ROUTE_SLUGS = Object.values(VERSIONS).map((v) => v.routeSlug);

export const OT_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
  'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
];

export const NT_BOOKS = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];

const SLUG_MAP: Record<string, string> = {
  Psalms: 'psalm',
  'Song of Solomon': 'song-of-solomon',
  '1 Samuel': '1-samuel', '2 Samuel': '2-samuel',
  '1 Kings': '1-kings', '2 Kings': '2-kings',
  '1 Chronicles': '1-chronicles', '2 Chronicles': '2-chronicles',
  '1 Corinthians': '1-corinthians', '2 Corinthians': '2-corinthians',
  '1 Thessalonians': '1-thessalonians', '2 Thessalonians': '2-thessalonians',
  '1 Timothy': '1-timothy', '2 Timothy': '2-timothy',
  '1 Peter': '1-peter', '2 Peter': '2-peter',
  '1 John': '1-john', '2 John': '2-john', '3 John': '3-john',
};

export function bookToSlug(book: string): string {
  return SLUG_MAP[book] || book.toLowerCase().replace(/\s+/g, '-');
}

const SLUG_TO_BOOK: Record<string, string> = { psalm: 'Psalms' };

export function slugToBook(slug: string): string {
  if (SLUG_TO_BOOK[slug]) return SLUG_TO_BOOK[slug];
  for (const book of [...OT_BOOKS, ...NT_BOOKS]) {
    if (bookToSlug(book) === slug) return book;
  }
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
