import { chapterAnchor, verseAnchor } from './reader-anchors';
import { isBookLoaded, isChapterHydrated } from './reader-hydration';

export type PassageTarget = { bookSlug: string; chapter?: number; verse?: number };

function chapterSection(bookSlug: string, chapter: number): HTMLElement | null {
  return document.getElementById(chapterAnchor(bookSlug, chapter));
}

function chapterBodyReady(section: HTMLElement): boolean {
  const body = section.querySelector('.reader-chapter-body');
  if (!body) return false;
  if (body.querySelector('.reader-loading, .reader-error')) return false;
  if (body.querySelector('.verse-list li')) return true;
  return (body.textContent?.trim().length ?? 0) > 0;
}

function verseElementReady(bookSlug: string, chapter: number, verse: number): HTMLElement | null {
  const el = document.getElementById(verseAnchor(bookSlug, chapter, verse));
  if (!el) return null;
  const text = el.querySelector('.verse-text');
  if (!text?.textContent?.trim()) return null;
  return el;
}

export function isPassageReady(target: PassageTarget, versionId: string): boolean {
  const book = document.getElementById(target.bookSlug);
  if (!book) return false;

  if (!target.chapter) {
    if (!isBookLoaded(target.bookSlug)) return false;
    const wrap = book.querySelector('.reader-chapters');
    return Boolean(wrap && wrap.childElementCount > 0);
  }

  if (!isChapterHydrated(versionId, target.bookSlug, target.chapter)) {
    return false;
  }

  const section = chapterSection(target.bookSlug, target.chapter);
  if (!section || !chapterBodyReady(section)) return false;

  if (target.verse) {
    return verseElementReady(target.bookSlug, target.chapter, target.verse) !== null;
  }

  return true;
}

export interface WaitForPassageReadyOptions {
  verseEl?: HTMLElement | null;
  timeoutMs?: number;
  intervalMs?: number;
}

export async function waitForPassageReady(
  target: PassageTarget,
  versionId: string,
  opts?: WaitForPassageReadyOptions,
): Promise<HTMLElement | null> {
  const timeoutMs = opts?.timeoutMs ?? 20_000;
  const intervalMs = opts?.intervalMs ?? 80;
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const tick = () => {
      if (target.verse && target.chapter) {
        const el =
          opts?.verseEl && document.contains(opts.verseEl)
            ? opts.verseEl
            : verseElementReady(target.bookSlug, target.chapter, target.verse);
        if (el && isPassageReady(target, versionId)) {
          resolve(el);
          return;
        }
      } else if (isPassageReady(target, versionId)) {
        if (target.verse && target.chapter) {
          resolve(verseElementReady(target.bookSlug, target.chapter, target.verse));
        } else {
          resolve(null);
        }
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        reject(new Error('Passage load timed out'));
        return;
      }
      window.setTimeout(tick, intervalMs);
    };
    tick();
  });
}
