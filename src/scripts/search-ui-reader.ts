import { debounce } from '../lib/debounce';
import { searchVerses, hitToAnchor, fillSearchHitLink, type VerseHit } from './search-core';
import { initSearchAutocomplete } from './search-autocomplete';
import { showReaderError, clearReaderStatus } from '../lib/reader-status';

export interface ReaderSearchOptions {
  translationId: string;
  translationLabel: string;
  routeSlug: string;
  onNavigate: (anchor: string, highlight: string | null) => void;
}

export interface DisplayHitsOptions {
  translationLabel: string;
  routeSlug: string;
  onNavigate: (anchor: string, highlight: string | null) => void;
  highlight?: string | null;
  resultsTitle?: string;
}

let activeHits: VerseHit[] = [];
let activeIndex = -1;
let searchOpts: ReaderSearchOptions | null = null;
let searchGeneration = 0;

function getElements() {
  return {
    input: document.getElementById('reader-search-input') as HTMLInputElement | null,
    resultsEl: document.getElementById('reader-search-results'),
    prevBtn: document.getElementById('reader-search-prev'),
    nextBtn: document.getElementById('reader-search-next'),
    counterEl: document.getElementById('reader-search-counter'),
  };
}

function goToHit(index: number): void {
  if (!searchOpts || !activeHits.length) return;
  const { input, resultsEl, counterEl } = getElements();

  activeIndex = ((index % activeHits.length) + activeHits.length) % activeHits.length;
  const hit = activeHits[activeIndex];
  const anchor = hitToAnchor(hit);
  if (!anchor) return;

  const hl = input?.value.trim() || null;
  searchOpts.onNavigate(anchor, hl);

  if (counterEl) {
    counterEl.textContent = `${activeIndex + 1} / ${activeHits.length}`;
    counterEl.hidden = activeHits.length <= 1;
  }
  const links = resultsEl?.querySelectorAll('li:not(.reader-results-heading) a');
  links?.forEach((a, i) => {
    a.classList.toggle('is-active', i === activeIndex);
  });
}

export function displayReaderHits(
  hits: VerseHit[],
  opts: DisplayHitsOptions,
  autoNavigate = false,
): void {
  const { resultsEl, counterEl, prevBtn, nextBtn } = getElements();
  if (!resultsEl) return;

  activeHits = hits;
  activeIndex = hits.length ? 0 : -1;
  resultsEl.innerHTML = '';
  resultsEl.hidden = false;

  if (!hits.length) {
    const li = document.createElement('li');
    li.textContent = 'No verses found. Try another word or reference.';
    resultsEl.replaceChildren(li);
    if (counterEl) counterEl.hidden = true;
    return;
  }

  if (opts.resultsTitle) {
    const title = document.createElement('li');
    title.className = 'reader-results-heading';
    title.textContent = opts.resultsTitle;
    resultsEl.appendChild(title);
  }

  hits.forEach((hit, i) => {
    const anchor = hitToAnchor(hit);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `/${opts.routeSlug}/read/#${anchor}`;
    fillSearchHitLink(a, hit, opts.translationLabel);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      activeIndex = i;
      opts.onNavigate(anchor, opts.highlight ?? null);
      if (searchOpts) goToHit(i);
    });
    li.appendChild(a);
    resultsEl.appendChild(li);
  });

  if (counterEl) {
    counterEl.textContent = `1 / ${hits.length}`;
    counterEl.hidden = hits.length <= 1;
  }

  prevBtn?.removeAttribute('disabled');
  nextBtn?.removeAttribute('disabled');

  if (autoNavigate && hits.length) {
    goToHit(0);
  } else if (hits.length) {
    resultsEl.querySelector('li:not(.reader-results-heading) a')?.classList.add('is-active');
  }
}

export function initReaderSearch(opts: ReaderSearchOptions): void {
  searchOpts = opts;
  const { input, resultsEl, prevBtn, nextBtn, counterEl } = getElements();
  if (!input || !resultsEl) return;

  prevBtn?.addEventListener('click', () => goToHit(activeIndex - 1));
  nextBtn?.addEventListener('click', () => goToHit(activeIndex + 1));

  const runSearch = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      searchGeneration++;
      resultsEl.hidden = true;
      activeHits = [];
      activeIndex = -1;
      if (counterEl) counterEl.hidden = true;
      document.querySelectorAll('.reader-topic-btn').forEach((b) => b.classList.remove('is-active'));
      return;
    }

    document.querySelectorAll('.reader-topic-btn').forEach((b) => b.classList.remove('is-active'));

    const gen = ++searchGeneration;
    const result = await searchVerses(opts.translationId, q, 50);
    if (gen !== searchGeneration) return;

    if (!result.ok) {
      showReaderError(result.error || 'Search unavailable.');
      const li = document.createElement('li');
      li.className = 'reader-search-error';
      li.textContent = result.error || 'Search unavailable.';
      resultsEl.replaceChildren(li);
      resultsEl.hidden = false;
      activeHits = [];
      return;
    }

    clearReaderStatus();
    displayReaderHits(result.hits, {
      translationLabel: opts.translationLabel,
      routeSlug: opts.routeSlug,
      onNavigate: opts.onNavigate,
      highlight: q,
    });
  }, 300);

  input.addEventListener('input', runSearch);

  const suggestEl = document.getElementById('reader-search-suggest');
  if (suggestEl) {
    initSearchAutocomplete({
      translationId: opts.translationId,
      input,
      listEl: suggestEl,
      onSelect: (token) => {
        input.value = token;
        runSearch();
      },
    });
  }

  const params = new URLSearchParams(window.location.search);
  const qParam = params.get('q');
  if (qParam && qParam.length >= 2) {
    input.value = qParam;
    input.dispatchEvent(new Event('input'));
  }
}

export function getActiveSearchQuery(): string | null {
  const input = document.getElementById('reader-search-input') as HTMLInputElement | null;
  const q = input?.value.trim();
  return q && q.length >= 2 ? q : null;
}
