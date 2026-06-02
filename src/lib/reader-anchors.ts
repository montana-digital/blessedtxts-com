export function chapterAnchor(bookSlug: string, chapter: number): string {
  return `${bookSlug}-${chapter}`;
}

export function verseAnchor(bookSlug: string, chapter: number, verse: number): string {
  return `${bookSlug}-${chapter}-v${verse}`;
}

export function parseHash(hash: string): { bookSlug: string; chapter?: number; verse?: number } | null {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw) return null;

  let rest = raw;
  let verse: number | undefined;
  const vm = rest.match(/-v(\d+)$/);
  if (vm) {
    verse = parseInt(vm[1], 10);
    rest = rest.slice(0, -vm[0].length);
  }

  const cm = rest.match(/-(\d+)$/);
  if (cm) {
    const chapter = parseInt(cm[1], 10);
    const bookSlug = rest.slice(0, -cm[0].length);
    if (bookSlug) return { bookSlug, chapter, verse };
  }

  return { bookSlug: rest };
}
