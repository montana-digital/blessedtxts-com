import type { ReaderManifest } from '../lib/reader-types';
import { parseHash } from '../lib/reader-anchors';
import { isPassageReady, waitForPassageReady } from '../lib/reader-passage-ready';
import { loadBookmarks } from '../lib/bookmarks';
import { showReaderError, showReaderInfo, clearReaderStatus } from '../lib/reader-status';
import {
  mountBookShells,
  setupBookObserver,
  setupChapterObserver,
  goToAnchor,
  syncChapterLabelsFromHash,
} from './reader-loader';
import { initVerseToolbar } from './reader-verse-toolbar';
import { scrollPassageIntoViewUntilStable } from './reader-scroll';
import {
  showReaderLoadingModal,
  hideReaderLoadingModal,
  isReaderLoadingModalOpen,
} from './reader-loading-modal';
import { initReaderDrawer } from './reader-drawer';
import { setupScrollSpy } from './reader-scroll-spy';
import { initReaderSearch, getActiveSearchQuery } from './search-ui-reader';
import { initTopicsBrowse } from './reader-topics';
import { initTranslationPicker } from './reader-translation';
import { VERSIONS } from '../lib/bible-config';

async function ensureManifest(manifest: ReaderManifest): Promise<ReaderManifest> {
  if (manifest.books?.length) return manifest;
  try {
    const res = await fetch(`/bibles/manifest-${manifest.versionId}.json`);
    if (res.ok) return (await res.json()) as ReaderManifest;
    showReaderError('Bible manifest could not be loaded. Run npm run prebuild, then refresh.');
  } catch {
    showReaderError('Bible manifest could not be loaded. Check your connection and refresh.');
  }
  return manifest;
}

function renderEmptyManifestRetry(manifest: ReaderManifest): void {
  const content = document.getElementById('reader-content');
  if (!content) return;
  content.innerHTML = `
    <p class="reader-error">No Bible data found for this translation.</p>
    <p>From the project folder run: <code>npm run prebuild</code> then refresh.</p>
    <button type="button" class="btn" id="reader-retry-manifest">Retry</button>
  `;
  document.getElementById('reader-retry-manifest')?.addEventListener('click', async () => {
    const res = await fetch(`/bibles/manifest-${manifest.versionId}.json`);
    if (res.ok) {
      const m = (await res.json()) as ReaderManifest;
      if (m.books?.length) location.reload();
      else showReaderError('Manifest is still empty after retry.');
    } else {
      showReaderError('Manifest still unavailable.');
    }
  });
}

export async function initReader(manifest: ReaderManifest, translationLabel: string): Promise<void> {
  manifest = await ensureManifest(manifest);

  if (!manifest.books?.length) {
    renderEmptyManifestRetry(manifest);
    return;
  }

  (window as unknown as { __readerManifest?: ReaderManifest }).__readerManifest = manifest;
  clearReaderStatus();

  const content = document.getElementById('reader-content');
  const bookmarksNav = document.getElementById('reader-bookmarks-nav');
  if (!content) {
    showReaderError('Reader layout failed to initialize.');
    return;
  }

  let cancelStableScroll: (() => void) | null = null;
  let navigateGeneration = 0;

  mountBookShells(manifest, content);
  window.scrollTo(0, 0);

  const { onVisibleChapterChange, selectFromHash } = initVerseToolbar({
    versionId: manifest.versionId,
    translationLabel,
  });

  const chapterObserver = setupChapterObserver(
    manifest.versionId,
    getActiveSearchQuery,
    (bookSlug, chapter) => {
      onVisibleChapterChange(bookSlug, chapter);
    },
  );

  const observeChapters = () => {
    document.querySelectorAll('.reader-chapter').forEach((el) => {
      if (!(el as HTMLElement).dataset.observed) {
        (el as HTMLElement).dataset.observed = '1';
        chapterObserver.observe(el);
      }
    });
  };

  const bookObserver = setupBookObserver(manifest, () => {
    observeChapters();
  });
  document.querySelectorAll('.reader-book').forEach((el) => bookObserver.observe(el));

  const navigate = async (
    hash: string,
    highlight?: string | null,
    navOpts?: { scroll?: boolean },
  ) => {
    const shouldScroll = navOpts?.scroll !== false;
    const gen = ++navigateGeneration;
    if (isReaderLoadingModalOpen()) {
      hideReaderLoadingModal();
    }
    const clean = hash.replace(/^#/, '');
    const target = parseHash(`#${clean}`);
    if (!target) {
      hideReaderLoadingModal();
      showReaderError('Invalid passage link.');
      return;
    }

    const anchor =
      target.verse && target.chapter
        ? `${target.bookSlug}-${target.chapter}-v${target.verse}`
        : target.chapter
          ? `${target.bookSlug}-${target.chapter}`
          : target.bookSlug;
    const path = `${window.location.pathname}#${anchor}`;

    const showedModal = !isPassageReady(target, manifest.versionId);
    const modalStartedAt = showedModal ? Date.now() : 0;
    if (showedModal) showReaderLoadingModal();

    try {
      if (history.replaceState) {
        history.replaceState(null, '', path);
      } else {
        window.location.hash = anchor;
      }

      const hl = highlight ?? getActiveSearchQuery();
      const result = await goToAnchor(manifest.versionId, target, hl, manifest, {
        observeChapters,
        scroll: shouldScroll,
      });
      if (!result.ok || gen !== navigateGeneration) return;

      try {
        await waitForPassageReady(target, manifest.versionId, { verseEl: result.verseEl });
      } catch {
        if (gen === navigateGeneration) {
          showReaderError('Could not load this passage. Try again.');
        }
        return;
      }

      if (gen !== navigateGeneration) return;

      syncChapterLabelsFromHash(manifest);

      selectFromHash();
      cancelStableScroll?.();
      if (shouldScroll && result.verseEl) {
        cancelStableScroll = scrollPassageIntoViewUntilStable(result.verseEl, {
          reserveToolbar: true,
          smooth: false,
        });
      }
    } finally {
      if (gen === navigateGeneration && (showedModal || isReaderLoadingModalOpen())) {
        if (showedModal) {
          const minVisibleMs = 400;
          const elapsed = Date.now() - modalStartedAt;
          if (elapsed < minVisibleMs) {
            await new Promise((r) => setTimeout(r, minVisibleMs - elapsed));
          }
        }
        hideReaderLoadingModal();
      }
    }
  };

  const renderBookmarksList = () => {
    if (!bookmarksNav) return;
    const items = loadBookmarks(manifest.versionId);
    if (!items.length) {
      bookmarksNav.innerHTML =
        '<p class="reader-sidebar-empty">No bookmarks yet. Select a verse to bookmark or share.</p>';
      return;
    }
    bookmarksNav.innerHTML = items
      .map(
        (b) =>
          `<a href="/${manifest.routeSlug}/read/#${b.anchor}" class="reader-bookmark-link" data-bookmark-jump="${b.anchor}">${b.ref}</a>`,
      )
      .join('');
    bookmarksNav.querySelectorAll('[data-bookmark-jump]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        navigate((a as HTMLElement).dataset.bookmarkJump!);
      });
    });
  };

  initReaderDrawer();

  setupScrollSpy(manifest, onVisibleChapterChange);

  initReaderSearch({
    translationId: manifest.versionId,
    translationLabel,
    routeSlug: manifest.routeSlug,
    onNavigate: (anchor, highlight) => navigate(anchor, highlight),
  });

  try {
    await initTopicsBrowse(
      manifest.versionId,
      translationLabel,
      manifest.routeSlug,
      (anchor, highlight) => navigate(anchor, highlight),
    );
  } catch (err) {
    showReaderError(err instanceof Error ? err.message : 'Topics could not be loaded.');
  }

  initTranslationPicker(
    manifest.versionId,
    Object.values(VERSIONS).map((v) => ({
      id: v.id,
      routeSlug: v.routeSlug,
      shortLabel: v.shortLabel,
    })),
  );

  renderBookmarksList();
  document.addEventListener('bookmarks-changed', renderBookmarksList);

  const handleHash = () => {
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw) return;
    void navigate(raw);
  };

  window.addEventListener('hashchange', handleHash);

  if (window.location.hash) {
    const raw = window.location.hash.replace(/^#/, '');
    void navigate(raw);
  } else {
    window.scrollTo(0, 0);
    showReaderInfo('Scroll to read, or use search and topics above.');
    setTimeout(clearReaderStatus, 4000);
  }
}
