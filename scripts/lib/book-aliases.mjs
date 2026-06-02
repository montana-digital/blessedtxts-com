import { bookToSlug } from '../bible-books.mjs';

/** Common abbreviations → canonical book name */
export const BOOK_ALIASES = {
  gen: 'Genesis', ex: 'Exodus', exod: 'Exodus', lev: 'Leviticus', num: 'Numbers', deut: 'Deuteronomy',
  josh: 'Joshua', judg: 'Judges', rut: 'Ruth', '1sam': '1 Samuel', '2sam': '2 Samuel',
  '1ki': '1 Kings', '1kgs': '1 Kings', '2ki': '2 Kings', '2kgs': '2 Kings',
  '1chr': '1 Chronicles', '2chr': '2 Chronicles', ezra: 'Ezra', neh: 'Nehemiah', est: 'Esther',
  job: 'Job', ps: 'Psalms', psa: 'Psalms', prov: 'Proverbs', eccl: 'Ecclesiastes', ecc: 'Ecclesiastes',
  song: 'Song of Solomon', isa: 'Isaiah', jer: 'Jeremiah', lam: 'Lamentations', ezek: 'Ezekiel',
  dan: 'Daniel', hos: 'Hosea', joel: 'Joel', amos: 'Amos', obad: 'Obadiah', jon: 'Jonah',
  mic: 'Micah', nah: 'Nahum', hab: 'Habakkuk', zeph: 'Zephaniah', hag: 'Haggai', zech: 'Zechariah',
  mal: 'Malachi', matt: 'Matthew', mat: 'Matthew', mk: 'Mark', mar: 'Mark', lk: 'Luke',
  jn: 'John', joh: 'John', acts: 'Acts', rom: 'Romans', '1cor': '1 Corinthians', '2cor': '2 Corinthians',
  gal: 'Galatians', eph: 'Ephesians', phil: 'Philippians', col: 'Colossians',
  '1thess': '1 Thessalonians', '2thess': '2 Thessalonians', '1tim': '1 Timothy', '2tim': '2 Timothy',
  tit: 'Titus', phlm: 'Philemon', heb: 'Hebrews', jas: 'James', '1pet': '1 Peter', '2pet': '2 Peter',
  '1jn': '1 John', '2jn': '2 John', '3jn': '3 John', jud: 'Jude', rev: 'Revelation',
};

export function resolveBookAlias(name) {
  const key = name.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
  return BOOK_ALIASES[key] || name.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/^\d+/, (m) => m + ' ');
}

export function normalizeReferenceKey(book, chapter, verse) {
  return `${bookToSlug(book).replace(/-/g, '')}:${chapter}:${verse || ''}`.replace(/:$/, '');
}
