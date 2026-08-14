import type { ChapterData, ReaderManifest } from '@/lib/reader-types';
import { chapterAnchor, verseAnchor, parseHash } from '@/lib/reader-anchors';
import { isBookmarked } from '@/lib/bookmarks';
import { showReaderError, clearReaderStatus } from '@/lib/reader-status';
import { buildChapterTxt, buildChapterMd, triggerDownload } from '@/lib/chapter-download';
import { formatChapterHeaderLabel } from '@/lib/reader-passage-nav';
import { escapeHtml } from '@/lib/reader-ssr';
import { fetchJson, withOfflinePrefix } from '@/lib/fetch-json';
import {
  hydrationCacheKey,
  isBookLoaded,
  isChapterHydrated,
  markBookLoaded,
  markChapterHydrated,
  tryMarkBookLoaded,
  unmarkChapterHydrated,
} from '@/lib/reader-hydration';

const enablePdf = import.meta.env.PUBLIC_ENABLE_PDF === '1';

const chapterCache = new Map<string, ChapterData>();

export function getCachedChapter(
  versionId: string,
  bookSlug: string,
  chapter: number,
): ChapterData | undefined {
  return chapterCache.get(hydrationCacheKey(versionId, bookSlug, chapter));
}

function cacheKey(versionId: string, bookSlug: string, chapter: number): string {
  return hydrationCacheKey(versionId, bookSlug, chapter);
}

export async function fetchChapter(
  versionId: string,
  bookSlug: string,
  chapter: number,
): Promise<ChapterData> {
  const key = cacheKey(versionId, bookSlug, chapter);
  if (chapterCache.has(key)) return chapterCache.get(key)!;
  const data = await fetchJson<ChapterData>(`/bibles/${versionId}/${bookSlug}/${chapter}.json`);
  chapterCache.set(key, data);
  return data;
}

function highlightQuery(text: string, query: string | null): string {
  if (!query || query.length < 2) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    return escaped.replace(new RegExp(`(${q})`, 'gi'), '<mark class="search-hit">$1</mark>');
  } catch {
    return escaped;
  }
}

export function renderVerses(
  ch: ChapterData,
  versionId: string,
  bookSlug: string,
  highlight: string | null,
): string {
  const items = ch.verses
    .map((v) => {
      const id = verseAnchor(bookSlug, ch.chapter, v.n);
      const verseId = `${versionId}:${bookSlug}:${ch.chapter}:${v.n}`;
      const ref = `${ch.book} ${ch.chapter}:${v.n}`;
      const bm = isBookmarked(versionId, verseId);
      return `<li id="${id}" class="${bm ? 'verse-bookmarked' : ''}" data-verse="${v.n}" data-ref="${escapeHtml(ref)}" data-verse-id="${verseId}" tabindex="0" role="button" aria-label="${escapeHtml(ref)}">
        <sup>${v.n}</sup>
        <span class="verse-text">${highlightQuery(v.text, highlight)}</span>
      </li>`;
    })
    .join('');
  return `<ol class="verse-list">${items}</ol>`;
}

function chapterHeaderHtml(
  bookSlug: string,
  bookName: string,
  chapter: number,
  versionId: string,
): string {
  const defaultLabel = formatChapterHeaderLabel(bookName, chapter);
  const pdfLink = enablePdf
    ? `<span class="reader-chapter-download-sep" aria-hidden="true">|</span>
    <a class="reader-chapter-dl" href="/downloads/${versionId}/${bookSlug}/${chapter}.pdf" data-dl="pdf" download>Download .pdf</a>`
    : '';
  return `<div class="reader-chapter-header">
  <h3 class="reader-chapter-title">
    <span class="reader-chapter-label" data-default="${escapeHtml(defaultLabel)}">${escapeHtml(defaultLabel)}</span>
  </h3>
  <span class="reader-chapter-downloads" aria-label="Download chapter">
    <button type="button" class="reader-chapter-dl" data-dl="txt" disabled>Download .txt</button>
    <span class="reader-chapter-download-sep" aria-hidden="true">|</span>
    <button type="button" class="reader-chapter-dl" data-dl="md" disabled>Download .md</button>
    ${pdfLink}
  </span>
</div>`;
}

function wireChapterDownloads(section: HTMLElement, ch: ChapterData): void {
  if (section.dataset.downloadsWired === '1') return;
  section.dataset.downloadsWired = '1';

  const txtBtn = section.querySelector<HTMLButtonElement>('[data-dl="txt"]');
  const mdBtn = section.querySelector<HTMLButtonElement>('[data-dl="md"]');

  txtBtn?.removeAttribute('disabled');
  mdBtn?.removeAttribute('disabled');

  txtBtn?.addEventListener('click', () => {
    triggerDownload(`${ch.bookSlug}-${ch.chapter}.txt`, buildChapterTxt(ch));
  });
  mdBtn?.addEventListener('click', () => {
    triggerDownload(`${ch.bookSlug}-${ch.chapter}.md`, buildChapterMd(ch));
  });
}

export function syncChapterLabelsFromHash(manifest: ReaderManifest): void {
  const parsed = parseHash(window.location.hash);

  document.querySelectorAll('.reader-chapter').forEach((section) => {
    const el = section as HTMLElement;
    const labelEl = el.querySelector('.reader-chapter-label');
    if (!labelEl) return;

    const defaultLabel = labelEl.getAttribute('data-default') || '';
    const bookSlug = el.dataset.book;
    const chapter = parseInt(el.dataset.chapter || '0', 10);

    if (
      parsed?.chapter &&
      parsed.bookSlug === bookSlug &&
      parsed.chapter === chapter &&
      parsed.verse
    ) {
      const book = manifest.books.find((b) => b.slug === bookSlug);
      const bookName = book?.name ?? bookSlug ?? '';
      labelEl.textContent = formatChapterHeaderLabel(bookName, chapter, parsed.verse);
    } else {
      labelEl.textContent = defaultLabel;
    }
  });
}

function applyHighlightWithFade(el: HTMLElement): void {
  el.classList.remove('verse-highlight');
  void el.offsetWidth;
  el.classList.add('verse-highlight');

  const onEnd = (e: AnimationEvent) => {
    if (e.animationName !== 'verseHighlightFade') return;
    el.classList.remove('verse-highlight');
    el.removeEventListener('animationend', onEnd);
  };
  el.addEventListener('animationend', onEnd);
}

export function mountBookShells(manifest: ReaderManifest, container: HTMLElement): void {
  const frag = document.createDocumentFragment();
  for (const book of manifest.books) {
    const article = document.createElement('article');
    article.className = 'reader-book';
    article.id = book.slug;
    article.dataset.book = book.slug;
    article.dataset.testament = book.testament;
    article.innerHTML = `<h2 class="reader-book-title">${escapeHtml(book.name)}</h2><div class="reader-chapters" data-chapters-for="${book.slug}"></div>`;
    frag.appendChild(article);
  }
  container.appendChild(frag);
}

export function mountChapterShells(
  bookEl: HTMLElement,
  bookSlug: string,
  bookName: string,
  chapters: number[],
  versionId: string,
): void {
  const wrap = bookEl.querySelector('.reader-chapters');
  if (!wrap || wrap.childElementCount > 0) return;
  const frag = document.createDocumentFragment();
  for (const ch of chapters) {
    const section = document.createElement('section');
    section.className = 'reader-chapter';
    section.id = chapterAnchor(bookSlug, ch);
    section.dataset.book = bookSlug;
    section.dataset.chapter = String(ch);
    section.innerHTML = `${chapterHeaderHtml(bookSlug, bookName, ch, versionId)}<div class="reader-chapter-body" data-body="${bookSlug}-${ch}"><p class="reader-loading">Loading…</p></div>`;
    frag.appendChild(section);
  }
  wrap.appendChild(frag);
}

export async function hydrateChapter(
  versionId: string,
  bookSlug: string,
  chapter: number,
  highlight: string | null,
): Promise<HTMLElement | null> {
  const id = chapterAnchor(bookSlug, chapter);
  const section = document.getElementById(id);
  if (!section) return null;

  const key = cacheKey(versionId, bookSlug, chapter);
  if (isChapterHydrated(versionId, bookSlug, chapter)) {
    if (highlight) applyHighlightToSection(section, highlight);
    const ch = getCachedChapter(versionId, bookSlug, chapter);
    if (ch) wireChapterDownloads(section, ch);
    document.dispatchEvent(
      new CustomEvent('reader-chapter-hydrated', { detail: { bookSlug, chapter } }),
    );
    return section;
  }

  const body = section.querySelector('.reader-chapter-body');
  if (!body) return section;

  try {
    const ch = await fetchChapter(versionId, bookSlug, chapter);
    body.innerHTML = renderVerses(ch, versionId, bookSlug, highlight);
    markChapterHydrated(versionId, bookSlug, chapter);
    wireChapterDownloads(section, ch);
    clearReaderStatus();
    document.dispatchEvent(
      new CustomEvent('reader-chapter-hydrated', { detail: { bookSlug, chapter } }),
    );
  } catch {
    const msg = withOfflinePrefix('Could not load this chapter.');
    body.innerHTML = `<p class="reader-error">${msg}</p>
      <button type="button" class="btn btn--small reader-retry-chapter" data-book="${bookSlug}" data-chapter="${chapter}">Retry</button>`;
    body.querySelector('.reader-retry-chapter')?.addEventListener('click', () => {
      unmarkChapterHydrated(versionId, bookSlug, chapter);
      hydrateChapter(versionId, bookSlug, chapter, highlight);
    });
  }
  return section;
}

function applyHighlightToSection(section: HTMLElement, query: string): void {
  section.querySelectorAll('.verse-text').forEach((el) => {
    const text = el.textContent || '';
    el.innerHTML = highlightQuery(text, query);
  });
}

export function setupBookObserver(
  manifest: ReaderManifest,
  onBookVisible: (bookSlug: string) => void,
): IntersectionObserver {
  const bookMap = new Map(manifest.books.map((b) => [b.slug, b]));
  return new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const slug = (entry.target as HTMLElement).dataset.book;
        if (slug && bookMap.has(slug) && tryMarkBookLoaded(slug)) {
          const book = bookMap.get(slug)!;
          mountChapterShells(
            entry.target as HTMLElement,
            slug,
            book.name,
            book.chapters,
            manifest.versionId,
          );
          onBookVisible(slug);
        }
      }
    },
    { rootMargin: '400px 0px' },
  );
}

export function setupChapterObserver(
  versionId: string,
  getHighlight: () => string | null,
  onChapterVisible?: (bookSlug: string, chapter: number) => void,
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const bookSlug = el.dataset.book;
        const chapter = parseInt(el.dataset.chapter || '0', 10);
        if (!bookSlug || !chapter) continue;
        hydrateChapter(versionId, bookSlug, chapter, getHighlight());
        onChapterVisible?.(bookSlug, chapter);
      }
    },
    { rootMargin: '300px 0px' },
  );
}

export interface GoToAnchorResult {
  ok: boolean;
  verseEl?: HTMLElement;
}

export interface GoToAnchorOptions {
  /** Register mounted chapter sections with the intersection observer. */
  observeChapters?: () => void;
  /** Scroll the passage into view after hydration (default true). */
  scroll?: boolean;
}

export async function goToAnchor(
  versionId: string,
  target: { bookSlug: string; chapter?: number; verse?: number },
  highlight: string | null,
  manifest?: ReaderManifest,
  opts?: GoToAnchorOptions,
): Promise<GoToAnchorResult> {
  const resolvedManifest =
    manifest ?? (window as unknown as { __readerManifest?: ReaderManifest }).__readerManifest;
  const bookData = resolvedManifest?.books.find((b) => b.slug === target.bookSlug);

  if (!bookData) {
    showReaderError(`Passage not found: unknown book "${target.bookSlug}".`);
    return { ok: false };
  }

  const book = document.getElementById(target.bookSlug);
  if (!book) {
    showReaderError('Reader is still loading. Try again in a moment.');
    return { ok: false };
  }

  if (!isBookLoaded(target.bookSlug)) {
    markBookLoaded(target.bookSlug);
    mountChapterShells(book, target.bookSlug, bookData.name, bookData.chapters, versionId);
    opts?.observeChapters?.();
  }

  if (target.chapter) {
    if (!bookData.chapters.includes(target.chapter)) {
      showReaderError(`Chapter ${target.chapter} not found in ${bookData.name}.`);
      return { ok: false };
    }
    const section = await hydrateChapter(versionId, target.bookSlug, target.chapter, highlight);
    if (!section) {
      showReaderError('Could not scroll to that passage. Try the Retry button on the chapter.');
      return { ok: false };
    }

    if (resolvedManifest) syncChapterLabelsFromHash(resolvedManifest);

    clearReaderStatus();

    if (target.verse) {
      const verseEl = document.getElementById(
        verseAnchor(target.bookSlug, target.chapter, target.verse),
      );
      if (!verseEl) {
        showReaderError('Could not scroll to that passage. Try the Retry button on the chapter.');
        return { ok: false };
      }
      applyHighlightWithFade(verseEl);
      return { ok: true, verseEl };
    }

    const headerEl = section.querySelector('.reader-chapter-header');
    if (headerEl instanceof HTMLElement) {
      applyHighlightWithFade(headerEl);
    }
    if (opts?.scroll !== false) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return { ok: true };
  }

  clearReaderStatus();
  if (opts?.scroll !== false) {
    book.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return { ok: true };
}
