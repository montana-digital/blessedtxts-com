import { describe, it, expect } from 'vitest';
import { parseReferenceQuery, refKeyFromParsed } from '../../src/lib/reference-parse';

describe('parseReferenceQuery', () => {
  it('parses John 3:16', () => {
    const r = parseReferenceQuery('John 3:16');
    expect(r).toEqual({ book: 'John', chapter: 3, verse: 16 });
    expect(refKeyFromParsed(r!)).toBe('john:3:16');
  });

  it('parses Jn 3:16', () => {
    const r = parseReferenceQuery('Jn 3:16');
    expect(r?.book).toBe('John');
    expect(r?.chapter).toBe(3);
    expect(r?.verse).toBe(16);
  });

  it('parses compact jn3:16', () => {
    const r = parseReferenceQuery('jn3:16');
    expect(r?.book).toBe('John');
    expect(r?.chapter).toBe(3);
    expect(r?.verse).toBe(16);
  });

  it('parses Ps 23:1', () => {
    const r = parseReferenceQuery('Ps 23:1');
    expect(r?.book).toBe('Psalms');
    expect(refKeyFromParsed(r!)).toBe('psalm:23:1');
  });

  it('parses 1 Cor 13:4', () => {
    const r = parseReferenceQuery('1 Cor 13:4');
    expect(r?.book).toBe('1 Corinthians');
    expect(r?.chapter).toBe(13);
    expect(r?.verse).toBe(4);
  });

  it('parses Genesis 1 without verse', () => {
    const r = parseReferenceQuery('Genesis 1');
    expect(r).toEqual({ book: 'Genesis', chapter: 1, verse: undefined });
  });

  it('returns null for invalid input', () => {
    expect(parseReferenceQuery('')).toBeNull();
    expect(parseReferenceQuery('hello')).toBeNull();
  });
});
