import { describe, expect, it } from 'vitest';
import {
  bookMetaDescription,
  chapterMetaDescription,
} from '../../src/lib/document-meta';
import { VERSIONS, OT_BOOKS, NT_BOOKS } from '../../src/lib/bible-config';
import { isMetaDescriptionInRange } from '../../src/lib/meta-description';

describe('chapter and book meta templates', () => {
  it('stays in range for short and long book names', () => {
    const samples = ['Genesis', 'John', 'Song of Solomon', 'Thessalonians'];
    for (const book of samples) {
      for (const v of Object.values(VERSIONS)) {
        expect(isMetaDescriptionInRange(chapterMetaDescription(v.label, book, 1)), `${v.id} ${book} 1`).toBe(
          true,
        );
        expect(isMetaDescriptionInRange(bookMetaDescription(v.label, book)), `${v.id} ${book}`).toBe(true);
      }
    }
  });

  it('covers canon book names with KJV label', () => {
    for (const book of [...OT_BOOKS, ...NT_BOOKS]) {
      expect(isMetaDescriptionInRange(chapterMetaDescription(VERSIONS.kjv.label, book, 119))).toBe(
        true,
      );
    }
  });
});
