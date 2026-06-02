const loadedBooks = new Set<string>();
const hydratedChapters = new Set<string>();

export function hydrationCacheKey(
  versionId: string,
  bookSlug: string,
  chapter: number,
): string {
  return `${versionId}:${bookSlug}:${chapter}`;
}

export function isChapterHydrated(
  versionId: string,
  bookSlug: string,
  chapter: number,
): boolean {
  return hydratedChapters.has(hydrationCacheKey(versionId, bookSlug, chapter));
}

export function isBookLoaded(bookSlug: string): boolean {
  return loadedBooks.has(bookSlug);
}

/** Returns true when the book was newly marked loaded. */
export function tryMarkBookLoaded(bookSlug: string): boolean {
  if (loadedBooks.has(bookSlug)) return false;
  loadedBooks.add(bookSlug);
  return true;
}

export function markBookLoaded(bookSlug: string): void {
  loadedBooks.add(bookSlug);
}

export function markChapterHydrated(
  versionId: string,
  bookSlug: string,
  chapter: number,
): void {
  hydratedChapters.add(hydrationCacheKey(versionId, bookSlug, chapter));
}

export function unmarkChapterHydrated(
  versionId: string,
  bookSlug: string,
  chapter: number,
): void {
  hydratedChapters.delete(hydrationCacheKey(versionId, bookSlug, chapter));
}
