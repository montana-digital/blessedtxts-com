import { parseReferenceQuery } from '../lib/reference-parse';
import { verseAnchor } from '../lib/reader-anchors';
import { bookToSlug } from '../lib/bible-config';
import { withOfflinePrefix } from '../lib/fetch-json';

type PoolKey = 'all' | 'kjvOt' | 'web' | 'webster';

const LABELS: Record<PoolKey, string> = {
  all: 'Random',
  kjvOt: 'King James Bible (OT)',
  web: 'World English Bible',
  webster: 'Webster Bible',
};

const READER_BY_POOL: Record<PoolKey, string> = {
  all: '/king-james-bible/read',
  kjvOt: '/king-james-bible/read',
  web: '/world-english-bible/read',
  webster: '/websters-bible/read',
};

function refToReaderHash(ref: string): string | null {
  const parsed = parseReferenceQuery(ref);
  if (!parsed?.verse) return null;
  return verseAnchor(bookToSlug(parsed.book), parsed.chapter, parsed.verse);
}

function parseVerse(line: string): { ref: string; text: string } {
  const tab = line.indexOf('\t');
  if (tab === -1) return { ref: '', text: line };
  return { ref: line.slice(0, tab), text: line.slice(tab + 1) };
}

export function initBlessingGenerator() {
  const root = document.getElementById('blessing-generator');
  if (!root) return;

  const poolUrls = JSON.parse(root.dataset.poolUrls || '{}') as Record<PoolKey, string>;
  const poolCache = new Map<PoolKey, string[]>();
  const poolLoading = new Map<PoolKey, Promise<string[]>>();

  const panel = document.getElementById('verse-panel');
  const textEl = document.getElementById('verse-text');
  const citeEl = document.getElementById('verse-cite');
  let currentLine = '';
  let currentLabel = '';
  let currentPool: PoolKey = 'all';
  let audio: HTMLAudioElement | null = null;
  const readLink = document.getElementById('btn-read-context') as HTMLAnchorElement | null;

  try {
    audio = new Audio('/bell.wav');
    audio.volume = 0.7;
  } catch {
    /* silent */
  }

  async function loadPool(poolKey: PoolKey): Promise<string[]> {
    const cached = poolCache.get(poolKey);
    if (cached) return cached;

    const pending = poolLoading.get(poolKey);
    if (pending) return pending;

    const url = poolUrls[poolKey];
    if (!url) return [];

    const promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load verse pool (${poolKey}).`);
        return res.json() as Promise<string[]>;
      })
      .then((pool) => {
        poolCache.set(poolKey, pool);
        poolLoading.delete(poolKey);
        return pool;
      })
      .catch((err) => {
        poolLoading.delete(poolKey);
        throw err;
      });

    poolLoading.set(poolKey, promise);
    return promise;
  }

  function prefetchDefaultPool() {
    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback.bind(window)
        : (cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline), 1500);
    schedule(() => {
      loadPool('all').catch(() => {});
    });
  }

  function playBell() {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function animate() {
    document.querySelector('.logo')?.classList.add('tilt');
    setTimeout(() => document.querySelector('.logo')?.classList.remove('tilt'), 800);
  }

  function showVerse(line: string, label: string, poolKey: PoolKey) {
    const { ref, text } = parseVerse(line);
    currentLine = `"${line}"`;
    currentLabel = label;
    currentPool = poolKey;
    if (textEl) textEl.textContent = text;
    if (citeEl) citeEl.textContent = `${ref} · ${label}`;
    panel?.removeAttribute('hidden');
    panel?.classList.add('is-visible');
    const hash = refToReaderHash(ref);
    if (readLink && hash) {
      readLink.href = `${READER_BY_POOL[poolKey]}#${hash}`;
      readLink.hidden = false;
    } else if (readLink) {
      readLink.hidden = true;
    }
  }

  function hideVerse() {
    panel?.setAttribute('hidden', '');
    panel?.classList.remove('is-visible');
    currentLine = '';
    if (readLink) readLink.hidden = true;
  }

  function showLoadError() {
    const message = withOfflinePrefix('Could not load verses. Please try again.');
    if (textEl) textEl.textContent = message;
    if (citeEl) citeEl.textContent = '';
    panel?.removeAttribute('hidden');
    panel?.classList.add('is-visible');
    if (readLink) readLink.hidden = true;
  }

  async function pick(poolKey: PoolKey, label?: string) {
    if (textEl) textEl.textContent = 'Loading verse…';
    panel?.removeAttribute('hidden');
    panel?.classList.add('is-visible');

    try {
      const pool = await loadPool(poolKey);
      if (!pool.length) {
        showLoadError();
        return;
      }
      const line = pool[Math.floor(Math.random() * pool.length)];
      const displayLabel = label || LABELS[poolKey];
      showVerse(line, displayLabel, poolKey);
      animate();
      playBell();
    } catch {
      showLoadError();
    }
  }

  root.querySelectorAll('[data-pool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pool = btn.getAttribute('data-pool') as PoolKey;
      const label = btn.getAttribute('data-label') || undefined;
      void pick(pool, label);
    });
  });

  document.getElementById('btn-clear')?.addEventListener('click', hideVerse);
  document.getElementById('btn-bell')?.addEventListener('click', playBell);
  document.getElementById('btn-download')?.addEventListener('click', () => {
    if (!currentLine) return;
    const blob = new Blob([currentLine], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'free_blessing.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  prefetchDefaultPool();
}
