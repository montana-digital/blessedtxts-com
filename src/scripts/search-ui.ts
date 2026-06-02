import { debounce } from '../lib/debounce';
import { searchVerses, hitToAnchor, fillSearchHitLink } from './search-core';
import { initSearchAutocomplete } from './search-autocomplete';

export async function initSearch(
  translationId: string,
  translationLabel: string,
  readerRoute?: string,
) {
  const input = document.getElementById(`search-${translationId}`) as HTMLInputElement | null;
  const resultsEl = document.getElementById(`results-${translationId}`);
  const suggestEl = document.getElementById(`suggest-${translationId}`);
  if (!input || !resultsEl) return;

  let searchGeneration = 0;

  const runSearch = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) {
      searchGeneration++;
      resultsEl.hidden = true;
      return;
    }

    const gen = ++searchGeneration;
    const result = await searchVerses(translationId, q, 12);
    if (gen !== searchGeneration) return;
    resultsEl.innerHTML = '';
    resultsEl.hidden = false;

    if (!result.ok) {
      const li = document.createElement('li');
      li.textContent = result.error || 'Search unavailable.';
      resultsEl.replaceChildren(li);
      return;
    }

    if (!result.hits.length) {
      const li = document.createElement('li');
      li.textContent = 'No verses found. Try another word or reference.';
      resultsEl.replaceChildren(li);
      return;
    }

    resultsEl.replaceChildren();
    for (const hit of result.hits) {
      const anchor = hitToAnchor(hit);
      const href = readerRoute && anchor ? `${readerRoute}#${anchor}` : hit.url;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      fillSearchHitLink(a, hit, translationLabel);
      li.appendChild(a);
      resultsEl.appendChild(li);
    }
  }, 300);

  input.addEventListener('input', runSearch);

  if (suggestEl) {
    initSearchAutocomplete({
      translationId,
      input,
      listEl: suggestEl,
      onSelect: (token) => {
        input.value = token;
        runSearch();
      },
    });
  }
}
