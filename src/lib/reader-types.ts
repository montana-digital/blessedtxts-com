import type { VersionId } from './bible-config';

export interface ReaderManifestBook {
  slug: string;
  name: string;
  testament: 'ot' | 'nt';
  chapters: number[];
}

export interface ReaderManifest {
  versionId: VersionId;
  routeSlug: string;
  books: ReaderManifestBook[];
}

export interface ChapterData {
  book: string;
  bookSlug: string;
  chapter: number;
  translation: string;
  translationLabel: string;
  verses: { n: number; text: string }[];
  testament?: string;
  routeSlug?: string;
}
