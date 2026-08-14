import { describe, it, expect } from 'vitest';
import { expandSearchTerms } from '../../src/scripts/search-core';

describe('expandSearchTerms', () => {
  const synonyms = {
    love: ['charity', 'beloved'],
    afraid: ['fear', 'troubled'],
  };

  it('includes original query', () => {
    const terms = expandSearchTerms('love', synonyms);
    expect(terms).toContain('love');
    expect(terms).toContain('charity');
    expect(terms).toContain('beloved');
  });

  it('expands reverse synonym lookup', () => {
    const terms = expandSearchTerms('fear', synonyms);
    expect(terms).toContain('fear');
    expect(terms).toContain('afraid');
  });

  it('returns single term when no synonyms', () => {
    const terms = expandSearchTerms('righteousness', synonyms);
    expect(terms).toEqual(['righteousness']);
  });
});
