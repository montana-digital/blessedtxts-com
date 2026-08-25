import { slugToBook } from '@/lib/bible-config';
import { truncateMetaDescription } from '@/lib/meta-description';

export function chapterMetaDescription(
  translationLabel: string,
  bookName: string,
  chapter: number,
): string {
  return truncateMetaDescription(
    `Read ${bookName} ${chapter} in the ${translationLabel} on Blessed Texts. Public-domain Scripture with verse numbers, downloads, and a full searchable reader.`,
  );
}

export function bookMetaDescription(translationLabel: string, bookName: string): string {
  return truncateMetaDescription(
    `Browse every chapter of ${bookName} in the ${translationLabel} on Blessed Texts. Read online, download TXT or Markdown, or open the full searchable reader.`,
  );
}

export function chapterPageTitle(translationLabel: string, bookName: string, chapter: number): string {
  return `${bookName} ${chapter} (${translationLabel})`;
}

export function bookPageTitle(translationLabel: string, bookName: string): string {
  return `${bookName} — ${translationLabel}`;
}

export function bookNameFromSlug(bookSlug: string): string {
  return slugToBook(bookSlug);
}
