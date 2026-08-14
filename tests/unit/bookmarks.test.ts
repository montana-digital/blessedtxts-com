import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadBookmarks,
  saveBookmarks,
  toggleBookmark,
  isBookmarked,
} from '../../src/lib/bookmarks';

const store: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  globalThis.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    key: () => null,
    length: 0,
  } as Storage;
});

describe('bookmarks', () => {
  it('toggles bookmark on and off', () => {
    const entry = { id: 'kjv:genesis:1:1', ref: 'Genesis 1:1', anchor: 'genesis-1-v1' };
    expect(toggleBookmark('kjv', entry)).toBe(true);
    expect(isBookmarked('kjv', entry.id)).toBe(true);
    expect(toggleBookmark('kjv', entry)).toBe(false);
    expect(isBookmarked('kjv', entry.id)).toBe(false);
  });

  it('persists across load', () => {
    expect(saveBookmarks('web', [
      { id: 'web:john:3:16', ref: 'John 3:16', anchor: 'john-3-v16', addedAt: 1 },
    ])).toBe(true);
    const loaded = loadBookmarks('web');
    expect(loaded).toHaveLength(1);
    expect(loaded[0].ref).toBe('John 3:16');
  });

  it('returns false when storage write fails', () => {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('QuotaExceededError');
      },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
    expect(saveBookmarks('kjv', [])).toBe(false);
  });
});
