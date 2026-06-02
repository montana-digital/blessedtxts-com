import type { ReaderManifest } from '../lib/reader-types';

export function setupScrollSpy(
  manifest: ReaderManifest,
  onActiveChange: (bookSlug: string, chapter: number | null) => void,
): () => void {
  let ticking = false;

  const update = () => {
    ticking = false;
    const chapters = document.querySelectorAll<HTMLElement>('.reader-chapter[data-chapter]');
    let activeChapter: HTMLElement | null = null;
    let bestTop = Number.NEGATIVE_INFINITY;
    const line = window.innerHeight * 0.35;

    for (const chapterEl of chapters) {
      const rect = chapterEl.getBoundingClientRect();
      if (rect.top <= line && rect.bottom > 0 && rect.top > bestTop) {
        activeChapter = chapterEl;
        bestTop = rect.top;
      }
    }

    if (activeChapter) {
      const bookSlug = activeChapter.dataset.book!;
      const chapter = parseInt(activeChapter.dataset.chapter || '0', 10);
      onActiveChange(bookSlug, chapter || null);
      return;
    }

    const books = document.querySelectorAll<HTMLElement>('.reader-book[data-book]');
    for (const book of books) {
      const rect = book.getBoundingClientRect();
      if (rect.top <= line && rect.bottom > line) {
        onActiveChange(book.dataset.book!, null);
        return;
      }
    }
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  return () => window.removeEventListener('scroll', onScroll);
}
