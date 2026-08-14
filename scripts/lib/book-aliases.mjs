import canon from '../../data/canon.json' with { type: 'json' };
import { bookToSlug } from '../bible-books.mjs';

/** Common abbreviations → canonical book name */
export const BOOK_ALIASES = canon.aliases;

export function resolveBookAlias(name) {
  const key = name.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
  if (BOOK_ALIASES[key]) return BOOK_ALIASES[key];
  const titled = name.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return titled.replace(/^(\d+)\s*/, (_, n) => `${n} `).replace(/\s+/g, ' ').trim();
}

export function normalizeReferenceKey(book, chapter, verse) {
  return `${bookToSlug(book).replace(/-/g, '')}:${chapter}:${verse || ''}`.replace(/:$/, '');
}
