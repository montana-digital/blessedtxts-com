import { describe, it, expect } from 'vitest';
import { getAdjacentChapter, formatChapterHeaderLabel } from '../../src/lib/reader-passage-nav';
import type { ReaderManifest } from '../../src/lib/reader-types';

const miniManifest: ReaderManifest = {
  versionId: 'kjv',
  routeSlug: 'king-james-bible',
  books: [
    { slug: 'john', name: 'John', testament: 'nt', chapters: [1, 2, 21] },
    { slug: 'acts', name: 'Acts', testament: 'nt', chapters: [1, 2] },
  ],
};

describe('getAdjacentChapter', () => {
  it('returns next chapter in same book', () => {
    const adj = getAdjacentChapter(miniManifest, { bookSlug: 'john', chapter: 1 });
    expect(adj.next).toEqual({ bookSlug: 'john', chapter: 2 });
    expect(adj.prev).toBeUndefined();
  });

  it('crosses from John 21 to Acts 1', () => {
    const adj = getAdjacentChapter(miniManifest, { bookSlug: 'john', chapter: 21 });
    expect(adj.next).toEqual({ bookSlug: 'acts', chapter: 1 });
    expect(adj.prev).toEqual({ bookSlug: 'john', chapter: 2 });
  });

  it('returns prev chapter crossing book boundary', () => {
    const adj = getAdjacentChapter(miniManifest, { bookSlug: 'acts', chapter: 1 });
    expect(adj.prev).toEqual({ bookSlug: 'john', chapter: 21 });
  });
});

describe('formatChapterHeaderLabel', () => {
  it('formats chapter-only label', () => {
    expect(formatChapterHeaderLabel('Genesis', 1)).toBe('Genesis 1');
  });

  it('formats verse label', () => {
    expect(formatChapterHeaderLabel('Genesis', 1, 16)).toBe('Genesis 1:16');
  });
});
