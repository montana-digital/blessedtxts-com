import { describe, it, expect } from 'vitest';
import {
  formatChapterHeaderLabel,
  versePrefix,
  PDF_THEME,
  SITE,
} from '../../scripts/pdf-theme.mjs';

describe('pdf-layout', () => {
  it('formatChapterHeaderLabel matches reader chapter label', () => {
    expect(formatChapterHeaderLabel('Genesis', 1)).toBe('Genesis 1');
    expect(formatChapterHeaderLabel('John', 3)).toBe('John 3');
  });

  it('versePrefix includes trailing space for inline verse numbers', () => {
    expect(versePrefix(1)).toBe('1 ');
    expect(versePrefix(16)).toBe('16 ');
  });

  it('PDF_THEME uses reader gold and light-theme body text', () => {
    expect(PDF_THEME.gold).toBe('#D4AF37');
    expect(PDF_THEME.text).toBe('#0a0a0a');
    expect(PDF_THEME.textMuted).toBe('#525252');
  });

  it('SITE matches download attribution URL', () => {
    expect(SITE).toBe('https://blessedtxts.com');
  });
});
