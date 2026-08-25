import { describe, expect, it } from 'vitest';
import {
  bookMarkdownPath,
  bookPagePath,
  chapterJsonAssetPath,
  chapterMarkdownPath,
  chapterPagePath,
  chapterVersePath,
  readerPassagePath,
  translationDocumentHrefs,
} from '../../src/lib/passage-urls';

describe('passage URLs', () => {
  it('builds book, chapter, verse, and reader paths', () => {
    expect(bookPagePath('king-james-bible', 'john')).toBe('/king-james-bible/john/');
    expect(chapterPagePath('king-james-bible', 'john', 3)).toBe('/king-james-bible/john/3/');
    expect(chapterVersePath('king-james-bible', 'john', 3, 16)).toBe(
      '/king-james-bible/john/3/#v16',
    );
    expect(readerPassagePath('king-james-bible', 'john', 3, 16)).toBe(
      '/king-james-bible/read/#john-3-v16',
    );
    expect(chapterMarkdownPath('kjv', 'john', 3)).toBe('/downloads/kjv/john/3.md');
    expect(bookMarkdownPath('kjv', 'john')).toBe('/downloads/kjv/john.md');
    expect(chapterJsonAssetPath('kjv', 'john', 3)).toBe('/bibles/kjv/john/3.json');
  });

  it('lists the same chapter in every translation', () => {
    const hrefs = translationDocumentHrefs('kjv', 'john', 3);
    expect(hrefs.map((h) => h.href)).toEqual([
      '/king-james-bible/john/3/',
      '/world-english-bible/john/3/',
      '/websters-bible/john/3/',
    ]);
    expect(hrefs.find((h) => h.current)?.label).toBe('King James Bible');
  });
});
