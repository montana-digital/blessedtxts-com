/** Canonical Protestant OT + NT book order */
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

export const ALL_BOOKS = [...OT_BOOKS, ...NT_BOOKS];

const SLUG_MAP = {
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

export function bookToSlug(book) {
  if (SLUG_MAP[book]) return SLUG_MAP[book];
  return book.toLowerCase().replace(/\s+/g, '-');
}

const SLUG_TO_BOOK = { psalm: 'Psalms' };

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
