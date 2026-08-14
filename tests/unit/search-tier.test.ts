import { describe, it, expect } from 'vitest';
import { isSingleTokenQuery, queryLooksLikeReference } from '../../src/scripts/search-core';

describe('isSingleTokenQuery', () => {
  it('accepts single words', () => {
    expect(isSingleTokenQuery('beginning')).toBe(true);
    expect(isSingleTokenQuery("god's")).toBe(true);
  });

  it('rejects phrases and references with spaces', () => {
    expect(isSingleTokenQuery('fear not')).toBe(false);
    expect(isSingleTokenQuery('Jn 3:16')).toBe(false);
  });

  it('rejects too short queries', () => {
    expect(isSingleTokenQuery('a')).toBe(false);
  });
});

describe('queryLooksLikeReference', () => {
  it('accepts parsed and compact references', () => {
    expect(queryLooksLikeReference('Jn 3:16')).toBe(true);
    expect(queryLooksLikeReference('jn3:16')).toBe(true);
    expect(queryLooksLikeReference('Genesis 1')).toBe(true);
  });

  it('rejects bare keywords', () => {
    expect(queryLooksLikeReference('beginning')).toBe(false);
    expect(queryLooksLikeReference('faith')).toBe(false);
  });
});
