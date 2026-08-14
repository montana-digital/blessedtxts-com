import { describe, it, expect } from 'vitest';
import { resolveBookAlias } from '../../src/lib/book-aliases';

describe('resolveBookAlias', () => {
  it('resolves common abbreviations', () => {
    expect(resolveBookAlias('jn')).toBe('John');
    expect(resolveBookAlias('Jn')).toBe('John');
    expect(resolveBookAlias('ps')).toBe('Psalms');
    expect(resolveBookAlias('psalm')).toBe('Psalms');
    expect(resolveBookAlias('1cor')).toBe('1 Corinthians');
  });

  it('preserves full book names', () => {
    expect(resolveBookAlias('Genesis')).toBe('Genesis');
    expect(resolveBookAlias('Revelation')).toBe('Revelation');
  });
});
