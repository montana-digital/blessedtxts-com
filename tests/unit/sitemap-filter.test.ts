import { describe, it, expect } from 'vitest';
import { shouldIncludeInSitemap } from '../../src/lib/sitemap-filter.mjs';

describe('shouldIncludeInSitemap', () => {
  it('includes indexable hub pages', () => {
    expect(shouldIncludeInSitemap('https://blessedtxts.com/')).toBe(true);
    expect(shouldIncludeInSitemap('https://blessedtxts.com/indexed-bible/')).toBe(true);
    expect(shouldIncludeInSitemap('https://blessedtxts.com/topics/hope/')).toBe(true);
    expect(shouldIncludeInSitemap('https://blessedtxts.com/king-james-bible/read/')).toBe(true);
    expect(shouldIncludeInSitemap('https://blessedtxts.com/translations/king-james-bible/')).toBe(
      true,
    );
  });

  it('includes book and chapter documents', () => {
    expect(shouldIncludeInSitemap('https://blessedtxts.com/king-james-bible/genesis/')).toBe(true);
    expect(shouldIncludeInSitemap('https://blessedtxts.com/king-james-bible/genesis/1/')).toBe(true);
    expect(shouldIncludeInSitemap('https://blessedtxts.com/world-english-bible/john/3/')).toBe(true);
  });

  it('excludes version roots and bible-versions hub', () => {
    expect(shouldIncludeInSitemap('https://blessedtxts.com/king-james-bible/')).toBe(false);
    expect(shouldIncludeInSitemap('https://blessedtxts.com/bible-versions/')).toBe(false);
  });
});
