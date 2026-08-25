import { describe, expect, it } from 'vitest';
import {
  bookPagePath,
  chapterPagePath,
  chapterVersePath,
  readerPassagePath,
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
  });
});
