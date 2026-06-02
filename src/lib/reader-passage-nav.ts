import type { ReaderManifest } from './reader-types';

export interface PassagePosition {
  bookSlug: string;
  chapter: number;
}

export interface AdjacentChapters {
  prev?: PassagePosition;
  next?: PassagePosition;
}

export function getAdjacentChapter(
  manifest: ReaderManifest,
  current: PassagePosition,
): AdjacentChapters {
  const books = manifest.books;
  const bookIdx = books.findIndex((b) => b.slug === current.bookSlug);
  if (bookIdx < 0) return {};

  const book = books[bookIdx];
  const chIdx = book.chapters.indexOf(current.chapter);
  if (chIdx < 0) return {};

  const result: AdjacentChapters = {};

  if (chIdx > 0) {
    result.prev = { bookSlug: book.slug, chapter: book.chapters[chIdx - 1] };
  } else if (bookIdx > 0) {
    const prevBook = books[bookIdx - 1];
    const lastCh = prevBook.chapters[prevBook.chapters.length - 1];
    result.prev = { bookSlug: prevBook.slug, chapter: lastCh };
  }

  if (chIdx < book.chapters.length - 1) {
    result.next = { bookSlug: book.slug, chapter: book.chapters[chIdx + 1] };
  } else if (bookIdx < books.length - 1) {
    const nextBook = books[bookIdx + 1];
    result.next = { bookSlug: nextBook.slug, chapter: nextBook.chapters[0] };
  }

  return result;
}

export function formatChapterHeaderLabel(
  bookName: string,
  chapter: number,
  verse?: number,
): string {
  return verse != null ? `${bookName} ${chapter}:${verse}` : `${bookName} ${chapter}`;
}
