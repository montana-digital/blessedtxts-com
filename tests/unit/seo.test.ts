import { describe, expect, it } from 'vitest';
import { chapterJsonLd } from '../../src/lib/seo';

describe('chapterJsonLd', () => {
  it('points isPartOf at the translation entity, not the book page', () => {
    const jsonLd = chapterJsonLd({
      bookName: 'John',
      chapter: 3,
      translationName: 'King James Bible',
      description: 'Read John 3 in the King James Bible on Blessed Texts.',
      url: 'https://blessedtxts.com/king-james-bible/john/3/',
      translationUrl: 'https://blessedtxts.com/translations/king-james-bible/',
    });

    expect(jsonLd.isPartOf).toEqual({
      '@type': 'Book',
      name: 'King James Bible',
      url: 'https://blessedtxts.com/translations/king-james-bible/',
    });
  });
});
