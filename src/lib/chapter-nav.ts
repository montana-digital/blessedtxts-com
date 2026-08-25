import type { ReaderManifest, ReaderManifestBook } from '@/lib/reader-types';

export function findManifestBook(
  manifest: ReaderManifest,
  bookSlug: string,
): ReaderManifestBook | undefined {
  return manifest.books.find((b) => b.slug === bookSlug);
}

export function previousChapter(
  manifest: ReaderManifest,
  bookSlug: string,
  chapter: number,
): { bookSlug: string; chapter: number } | null {
  const book = findManifestBook(manifest, bookSlug);
  if (!book) return null;
  const idx = book.chapters.indexOf(chapter);
  if (idx > 0) return { bookSlug, chapter: book.chapters[idx - 1] };
  return null;
}

export function nextChapter(
  manifest: ReaderManifest,
  bookSlug: string,
  chapter: number,
): { bookSlug: string; chapter: number } | null {
  const book = findManifestBook(manifest, bookSlug);
  if (!book) return null;
  const idx = book.chapters.indexOf(chapter);
  if (idx >= 0 && idx < book.chapters.length - 1) {
    return { bookSlug, chapter: book.chapters[idx + 1] };
  }
  return null;
}
