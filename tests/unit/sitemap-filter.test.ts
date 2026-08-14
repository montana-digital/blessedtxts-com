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

  it('excludes legacy redirect routes', () => {
    expect(shouldIncludeInSitemap('https://blessedtxts.com/king-james-bible/')).toBe(false);
    expect(shouldIncludeInSitemap('https://blessedtxts.com/king-james-bible/genesis/')).toBe(false);
    expect(shouldIncludeInSitemap('https://blessedtxts.com/king-james-bible/genesis/1/')).toBe(
      false,
    );
    expect(shouldIncludeInSitemap('https://blessedtxts.com/bible-versions/')).toBe(false);
  });
});
