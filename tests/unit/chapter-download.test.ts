import { describe, it, expect } from 'vitest';
import { buildChapterTxt, buildChapterMd } from '../../src/lib/chapter-download';
import type { ChapterData } from '../../src/lib/reader-types';

const sample: ChapterData = {
  book: 'John',
  bookSlug: 'john',
  chapter: 3,
  translation: 'kjv',
  translationLabel: 'King James Bible',
  verses: [
    { n: 16, text: 'For God so loved the world.' },
  ],
};

describe('chapter-download', () => {
  it('buildChapterTxt includes reference and verse text', () => {
    const txt = buildChapterTxt(sample);
    expect(txt).toContain('King James Bible');
    expect(txt).toContain('John 3:16');
    expect(txt).toContain('For God so loved the world.');
  });

  it('buildChapterMd includes heading and numbered verses', () => {
    const md = buildChapterMd(sample);
    expect(md).toContain('# King James Bible');
    expect(md).toContain('### John 3');
    expect(md).toContain('16. For God so loved the world.');
  });
});
