import { loadKeywordPrefixes, loadKeywordShard, isSingleTokenQuery } from './search-core';

export interface AutocompleteOptions {
  translationId: string;
  input: HTMLInputElement;
  listEl: HTMLElement;
  onSelect: (token: string) => void;
  debounceMs?: number;
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: never[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function initSearchAutocomplete(opts: AutocompleteOptions): void {
  const { translationId, input, listEl, onSelect, debounceMs = 150 } = opts;
  let activeIdx = -1;
  let suggestions: string[] = [];

  const hide = () => {
    listEl.hidden = true;
    listEl.innerHTML = '';
    activeIdx = -1;
    suggestions = [];
  };

  const render = () => {
    listEl.innerHTML = '';
    if (!suggestions.length) {
      hide();
      return;
    }
    listEl.hidden = false;
    suggestions.forEach((token, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reader-search-suggest-item';
      btn.textContent = token;
      btn.setAttribute('role', 'option');
      if (i === activeIdx) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
      }
      btn.addEventListener('click', () => {
        input.value = token;
        hide();
        onSelect(token);
      });
      li.appendChild(btn);
      listEl.appendChild(li);
    });
  };

  const update = debounce(async () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) {
      hide();
      return;
    }

    const found = new Set<string>();

    try {
      const prefixes = await loadKeywordPrefixes(translationId);
      for (const [prefix, tokens] of Object.entries(prefixes)) {
        if (prefix.startsWith(q) || q.startsWith(prefix)) {
          for (const t of tokens) {
            if (t.startsWith(q)) found.add(t);
          }
        }
      }

      if (isSingleTokenQuery(q)) {
        const shard = await loadKeywordShard(translationId, q);
        if (shard) {
          for (const token of Object.keys(shard)) {
            if (token.startsWith(q)) found.add(token);
          }
        }
      }
    } catch {
      hide();
      return;
    }

    suggestions = [...found].sort((a, b) => a.localeCompare(b)).slice(0, 12);
    activeIdx = suggestions.length ? 0 : -1;
    render();
  }, debounceMs);

  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    if (listEl.hidden || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, suggestions.length - 1);
      render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      render();
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      input.value = suggestions[activeIdx];
      hide();
      onSelect(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      hide();
    }
  });

  document.addEventListener('click', (e) => {
    if (!listEl.contains(e.target as Node) && e.target !== input) hide();
  });
}
