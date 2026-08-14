/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isPassageReady } from '../../src/lib/reader-passage-ready';
import { chapterAnchor, verseAnchor } from '../../src/lib/reader-anchors';

vi.mock('../../src/lib/reader-hydration', () => ({
  isChapterHydrated: vi.fn(() => true),
  isBookLoaded: vi.fn(() => true),
}));

import { isChapterHydrated } from '../../src/lib/reader-hydration';

function mountReadyChapter(bookSlug: string, chapter: number, verses: string[]) {
  const section = document.createElement('section');
  section.id = chapterAnchor(bookSlug, chapter);
  section.className = 'reader-chapter';
  const body = document.createElement('div');
  body.className = 'reader-chapter-body';
  const list = document.createElement('ol');
  list.className = 'verse-list';
  verses.forEach((text, i) => {
    const n = i + 1;
    const li = document.createElement('li');
    li.id = verseAnchor(bookSlug, chapter, n);
    li.innerHTML = `<sup>${n}</sup><span class="verse-text">${text}</span>`;
    list.appendChild(li);
  });
  body.appendChild(list);
  section.appendChild(body);
  document.body.appendChild(section);
  return section;
}

describe('reader-passage-ready', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.mocked(isChapterHydrated).mockReturnValue(true);
  });

  it('returns false when book element is missing', () => {
    expect(isPassageReady({ bookSlug: 'genesis', chapter: 1, verse: 1 }, 'kjv')).toBe(false);
  });

  it('returns true when verse exists with text and chapter is hydrated', () => {
    const book = document.createElement('article');
    book.id = 'genesis';
    document.body.appendChild(book);
    mountReadyChapter('genesis', 1, ['In the beginning']);

    expect(isPassageReady({ bookSlug: 'genesis', chapter: 1, verse: 1 }, 'kjv')).toBe(true);
    expect(isChapterHydrated).toHaveBeenCalledWith('kjv', 'genesis', 1);
  });

  it('returns false when chapter is not hydrated even if DOM has verses', () => {
    const book = document.createElement('article');
    book.id = 'genesis';
    document.body.appendChild(book);
    mountReadyChapter('genesis', 1, ['In the beginning']);
    vi.mocked(isChapterHydrated).mockReturnValue(false);

    expect(isPassageReady({ bookSlug: 'genesis', chapter: 1, verse: 1 }, 'kjv')).toBe(false);
  });

  it('returns false when chapter body still shows loading', () => {
    const book = document.createElement('article');
    book.id = 'john';
    document.body.appendChild(book);
    const section = document.createElement('section');
    section.id = chapterAnchor('john', 3);
    section.innerHTML =
      '<div class="reader-chapter-body"><p class="reader-loading">Loading…</p></div>';
    document.body.appendChild(section);

    expect(isPassageReady({ bookSlug: 'john', chapter: 3, verse: 16 }, 'kjv')).toBe(false);
  });

  it('returns true for chapter-only when body is ready and hydrated', () => {
    const book = document.createElement('article');
    book.id = 'john';
    document.body.appendChild(book);
    mountReadyChapter('john', 3, ['A', 'B']);

    expect(isPassageReady({ bookSlug: 'john', chapter: 3 }, 'kjv')).toBe(true);
  });
});
