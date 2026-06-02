import { bookToSlug } from './bible-config';
import { resolveBookAlias } from './book-aliases';

export interface ParsedReference {
  book: string;
  chapter: number;
  verse?: number;
}

/** Build key used in reference-map.json (e.g. john:3:16, 1samuel:1:1) */
export function refKeyFromParsed(ref: ParsedReference): string {
  const slug = bookToSlug(ref.book).replace(/-/g, '');
  if (ref.verse != null) return `${slug}:${ref.chapter}:${ref.verse}`;
  return `${slug}:${ref.chapter}:`;
}

/**
 * Parse references like John 3:16, Jn 3:16, jn3:16, 1 Cor 13:4, Genesis 1:1
 */
export function parseReferenceQuery(q: string): ParsedReference | null {
  const s = q.trim();
  if (!s) return null;

  let m = s.match(/^(\d?\s*[A-Za-z][A-Za-z.\s]*?)\s+(\d+)\s*(?:[:.]\s*(\d+))?\s*$/);
  if (m) {
    const book = resolveBookAlias(m[1].replace(/\s+/g, ' ').trim());
    return {
      book,
      chapter: parseInt(m[2], 10),
      verse: m[3] ? parseInt(m[3], 10) : undefined,
    };
  }

  m = s.match(/^(\d?)([a-zA-Z.]+)(\d+):(\d+)$/i);
  if (m) {
    const book = resolveBookAlias(`${m[1] ? `${m[1]} ` : ''}${m[2]}`);
    return { book, chapter: parseInt(m[3], 10), verse: parseInt(m[4], 10) };
  }

  m = s.match(/^(\d?)([a-zA-Z.]+)(\d+)$/i);
  if (m) {
    const book = resolveBookAlias(`${m[1] ? `${m[1]} ` : ''}${m[2]}`);
    return { book, chapter: parseInt(m[3], 10) };
  }

  return null;
}
