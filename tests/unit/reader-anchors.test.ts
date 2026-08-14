import { describe, it, expect } from 'vitest';
import { parseHash, chapterAnchor, verseAnchor } from '../../src/lib/reader-anchors';

describe('reader-anchors', () => {
  it('builds chapter and verse anchors', () => {
    expect(chapterAnchor('genesis', 1)).toBe('genesis-1');
    expect(verseAnchor('genesis', 1, 16)).toBe('genesis-1-v16');
  });

  it('parses verse hash', () => {
    expect(parseHash('#genesis-1-v16')).toEqual({
      bookSlug: 'genesis',
      chapter: 1,
      verse: 16,
    });
  });

  it('parses chapter hash', () => {
    expect(parseHash('#1-samuel-2')).toEqual({
      bookSlug: '1-samuel',
      chapter: 2,
      verse: undefined,
    });
  });

  it('parses book-only hash', () => {
    expect(parseHash('#genesis')).toEqual({ bookSlug: 'genesis' });
  });

  it('returns null for empty hash', () => {
    expect(parseHash('')).toBeNull();
    expect(parseHash('#')).toBeNull();
  });
});
