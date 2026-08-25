import { describe, expect, it } from 'vitest';
import { GITHUB_REPO_URL } from '../../src/site.config';
import { absoluteFileUrl, chapterJsonLd, organizationJsonLd } from '../../src/lib/seo';

describe('chapterJsonLd', () => {
  it('points isPartOf at the translation entity, not the book page', () => {
    const jsonLd = chapterJsonLd({
      bookName: 'John',
      chapter: 3,
      translationName: 'King James Bible',
      description: 'Read John 3 in the King James Bible on Blessed Texts.',
      url: 'https://blessedtxts.com/king-james-bible/john/3/',
      translationUrl: 'https://blessedtxts.com/translations/king-james-bible/',
      markdownUrl: 'https://blessedtxts.com/downloads/kjv/john/3.md',
      jsonUrl: 'https://blessedtxts.com/bibles/kjv/john/3.json',
    });

    expect(jsonLd.isPartOf).toEqual({
      '@type': 'Book',
      name: 'King James Bible',
      url: 'https://blessedtxts.com/translations/king-james-bible/',
    });
    expect(jsonLd.encoding).toEqual([
      {
        '@type': 'MediaObject',
        encodingFormat: 'text/markdown',
        contentUrl: 'https://blessedtxts.com/downloads/kjv/john/3.md',
      },
      {
        '@type': 'MediaObject',
        encodingFormat: 'application/json',
        contentUrl: 'https://blessedtxts.com/bibles/kjv/john/3.json',
      },
    ]);
  });
});

describe('organizationJsonLd', () => {
  it('includes GitHub as sameAs', () => {
    expect(organizationJsonLd().sameAs).toEqual([GITHUB_REPO_URL]);
  });
});

describe('absoluteFileUrl', () => {
  it('does not add a trailing slash to markdown paths', () => {
    expect(absoluteFileUrl('/downloads/kjv/genesis/1.md')).toBe(
      'https://blessedtxts.com/downloads/kjv/genesis/1.md',
    );
  });
});
