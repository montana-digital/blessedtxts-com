import { describe, it, expect } from 'vitest';
import {
  buildVerseShareText,
  buildVerseImageFilename,
} from '../../src/lib/verse-image';

describe('verse-image', () => {
  it('buildVerseShareText formats quote with ref and translation', () => {
    expect(buildVerseShareText('Genesis 1:1', 'In the beginning', 'King James Bible')).toBe(
      '"In the beginning" — Genesis 1:1 (King James Bible)',
    );
  });

  it('buildVerseImageFilename includes site domain', () => {
    expect(buildVerseImageFilename('genesis', 1, 1)).toBe('genesis-1-1-blessedtxts.com.png');
  });
});
