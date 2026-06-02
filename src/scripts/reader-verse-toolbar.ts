import { chapterAnchor, parseHash } from '../lib/reader-anchors';
import { isBookmarked, toggleBookmark } from '../lib/bookmarks';
import { buildVerseShareText, downloadVerseImage } from '../lib/verse-image';
import { showReaderError, showReaderInfo, clearReaderStatus } from '../lib/reader-status';
import { scrollPassageIntoViewUntilStable } from './reader-scroll';

export interface SelectedVerse {
  el: HTMLLIElement;
  verseId: string;
  anchor: string;
  ref: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface VerseToolbarOptions {
  versionId: string;
  translationLabel: string;
}

function parseVerseLi(li: HTMLLIElement): SelectedVerse | null {
  const section = li.closest<HTMLElement>('.reader-chapter');
  const bookSlug = section?.dataset.book;
  const chapter = parseInt(section?.dataset.chapter || '0', 10);
  const verse = parseInt(li.dataset.verse || '0', 10);
  const verseId = li.dataset.verseId;
  const ref = li.dataset.ref;
  const anchor = li.id;
  const textEl = li.querySelector('.verse-text');
  if (!bookSlug || !chapter || !verse || !verseId || !ref || !anchor || !textEl) return null;

  return {
    el: li,
    verseId,
    anchor,
    ref,
    bookSlug,
    chapter,
    verse,
    text: textEl.textContent?.trim() || '',
  };
}

function setHash(anchor: string): void {
  const path = `${window.location.pathname}#${anchor}`;
  if (history.replaceState) {
    history.replaceState(null, '', path);
  } else {
    window.location.hash = anchor;
  }
}

function hashMatchesSelectedVerse(selected: SelectedVerse): boolean {
  const parsed = parseHash(window.location.hash);
  return (
    parsed?.verse === selected.verse &&
    parsed?.chapter === selected.chapter &&
    parsed.bookSlug === selected.bookSlug
  );
}

export function syncBookmarkedClass(root: ParentNode, versionId: string): void {
  root.querySelectorAll<HTMLLIElement>('.verse-list li[data-verse-id]').forEach((li) => {
    const id = li.dataset.verseId;
    if (id) li.classList.toggle('verse-bookmarked', isBookmarked(versionId, id));
  });
}

export function initVerseToolbar(opts: VerseToolbarOptions): {
  getSelection: () => SelectedVerse | null;
  clearSelection: () => void;
  selectFromHash: () => void;
  onVisibleChapterChange: (bookSlug: string, chapter: number | null) => void;
} {
  const toolbar = document.getElementById('reader-verse-toolbar');
  const refEl = document.getElementById('reader-verse-toolbar-ref');
  const bookmarkBtn = toolbar?.querySelector<HTMLButtonElement>('[data-action="bookmark"]');
  const copyBtn = toolbar?.querySelector<HTMLButtonElement>('[data-action="copy"]');
  const imageBtn = toolbar?.querySelector<HTMLButtonElement>('[data-action="image"]');
  const content = document.getElementById('reader-content');
  const imageBtnDefaultLabel = imageBtn?.textContent ?? 'Save as image';

  let selected: SelectedVerse | null = null;

  const updateBookmarkButton = () => {
    if (!bookmarkBtn || !selected) return;
    const on = isBookmarked(opts.versionId, selected.verseId);
    bookmarkBtn.textContent = on ? 'Remove bookmark' : 'Add to Bookmarks';
    bookmarkBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  };

  const showToolbar = (show: boolean) => {
    if (!toolbar) return;
    toolbar.hidden = !show;
    document.body.classList.toggle('reader-verse-toolbar-visible', show);
  };

  const clearSelection = (updateUrlToChapter = false) => {
    const prev = selected;
    if (prev) {
      prev.el.classList.remove('verse-selected');
      prev.el.setAttribute('aria-selected', 'false');
    }
    selected = null;
    showToolbar(false);
    if (refEl) refEl.textContent = '';

    if (updateUrlToChapter && prev) {
      setHash(chapterAnchor(prev.bookSlug, prev.chapter));
    }
  };

  const applySelection = (verse: SelectedVerse, updateUrl: boolean) => {
    if (selected && selected.el !== verse.el) {
      selected.el.classList.remove('verse-selected');
      selected.el.setAttribute('aria-selected', 'false');
    }
    selected = verse;
    verse.el.classList.add('verse-selected');
    verse.el.setAttribute('aria-selected', 'true');
    if (refEl) refEl.textContent = verse.ref;
    showToolbar(true);
    updateBookmarkButton();

    if (updateUrl) {
      setHash(verse.anchor);
      scrollPassageIntoViewUntilStable(verse.el, { reserveToolbar: true, smooth: false });
    }
  };

  const selectVerse = (li: HTMLLIElement, updateUrl = true) => {
    const verse = parseVerseLi(li);
    if (!verse) return;

    if (selected?.el === li) {
      clearSelection(true);
      return;
    }

    applySelection(verse, updateUrl);
  };

  const selectFromHash = () => {
    const parsed = parseHash(window.location.hash);
    if (!parsed?.verse || !parsed.chapter) {
      clearSelection();
      return;
    }
    const id = `${parsed.bookSlug}-${parsed.chapter}-v${parsed.verse}`;
    const li = document.getElementById(id) as HTMLLIElement | null;
    if (!li?.matches('.verse-list li')) return;
    const verse = parseVerseLi(li);
    if (verse) applySelection(verse, false);
  };

  const onVisibleChapterChange = (bookSlug: string, chapter: number | null) => {
    if (!selected || chapter == null) return;
    if (selected.bookSlug === bookSlug && selected.chapter === chapter) return;
    if (hashMatchesSelectedVerse(selected)) return;
    clearSelection(false);
  };

  if (content) {
    content.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLLIElement>('.verse-list li');
      if (li && content.contains(li)) {
        selectVerse(li);
      }
    });

    content.addEventListener('keydown', (e) => {
      const li = (e.target as HTMLElement).closest<HTMLLIElement>('.verse-list li');
      if (!li || !content.contains(li)) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectVerse(li);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!selected) return;
    const t = e.target as HTMLElement;
    if (toolbar?.contains(t)) return;
    if (content?.contains(t)) return;
    clearSelection(true);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selected) {
      clearSelection(true);
    }
  });

  document.addEventListener('reader-chapter-hydrated', () => {
    selectFromHash();
  });

  bookmarkBtn?.addEventListener('click', () => {
    if (!selected) return;
    const on = toggleBookmark(opts.versionId, {
      id: selected.verseId,
      ref: selected.ref,
      anchor: selected.anchor,
    });
    selected.el.classList.toggle('verse-bookmarked', on);
    updateBookmarkButton();
    document.dispatchEvent(new CustomEvent('bookmarks-changed'));
    showReaderInfo(on ? 'Bookmark added' : 'Bookmark removed');
    setTimeout(clearReaderStatus, 2000);
  });

  copyBtn?.addEventListener('click', async () => {
    if (!selected) return;
    const text = buildVerseShareText(selected.ref, selected.text, opts.translationLabel);
    try {
      await navigator.clipboard.writeText(text);
      showReaderInfo('Copied to clipboard');
      setTimeout(clearReaderStatus, 2000);
    } catch {
      showReaderError('Could not copy — check browser permissions');
    }
  });

  imageBtn?.addEventListener('click', async () => {
    if (!selected || imageBtn?.disabled) return;
    imageBtn.disabled = true;
    imageBtn.textContent = 'Creating…';
    try {
      await downloadVerseImage({
        ref: selected.ref,
        text: selected.text,
        translationLabel: opts.translationLabel,
        bookSlug: selected.bookSlug,
        chapter: selected.chapter,
        verse: selected.verse,
      });
      showReaderInfo('Image downloaded');
      setTimeout(clearReaderStatus, 2000);
    } catch {
      showReaderError('Could not create image');
    } finally {
      imageBtn.disabled = false;
      imageBtn.textContent = imageBtnDefaultLabel;
    }
  });

  document.addEventListener('bookmarks-changed', () => {
    if (content) syncBookmarkedClass(content, opts.versionId);
    updateBookmarkButton();
  });

  return {
    getSelection: () => selected,
    clearSelection: () => clearSelection(false),
    selectFromHash,
    onVisibleChapterChange,
  };
}
