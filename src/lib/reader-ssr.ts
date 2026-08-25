import type { ChapterData } from './reader-types';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type VerseDomIdMode = 'reader' | 'chapter';

export function verseDomId(
  ch: Pick<ChapterData, 'bookSlug' | 'chapter'>,
  verse: number,
  mode: VerseDomIdMode = 'reader',
): string {
  return mode === 'chapter' ? `v${verse}` : `${ch.bookSlug}-${ch.chapter}-v${verse}`;
}

export function renderChapterVersesHtml(
  ch: ChapterData,
  mode: VerseDomIdMode = 'reader',
): string {
  const items = ch.verses
    .map(
      (v) =>
        `<li id="${verseDomId(ch, v.n, mode)}" class="reader-ssr-verse" data-verse="${v.n}">
        <sup>${v.n}</sup>
        <span class="verse-text">${escapeHtml(v.text)}</span>
      </li>`,
    )
    .join('');
  return `<ol class="verse-list">${items}</ol>`;
}

export function renderChapterSectionHtml(ch: ChapterData): string {
  return `<section class="reader-chapter reader-ssr-chapter" id="${ch.bookSlug}-${ch.chapter}" data-book="${ch.bookSlug}" data-chapter="${ch.chapter}">
  <h3 class="reader-chapter-title">${escapeHtml(ch.book)} ${ch.chapter}</h3>
  ${renderChapterVersesHtml(ch)}
</section>`;
}

export const POPULAR_PASSAGES: { book: string; chapter: number; label: string; verse?: number }[] = [
  { book: 'john', chapter: 3, verse: 16, label: 'John 3:16' },
  { book: 'psalm', chapter: 23, label: 'Psalm 23' },
  { book: 'romans', chapter: 8, verse: 28, label: 'Romans 8:28' },
  { book: 'philippians', chapter: 4, verse: 13, label: 'Philippians 4:13' },
  { book: 'matthew', chapter: 5, verse: 3, label: 'Matthew 5:3' },
  { book: 'proverbs', chapter: 3, verse: 5, label: 'Proverbs 3:5' },
];

export function popularPassageHash(
  book: string,
  chapter: number,
  verse?: number,
): string {
  return verse ? `${book}-${chapter}-v${verse}` : `${book}-${chapter}`;
}
