export interface ReaderManifestBook {
  slug: string;
  name: string;
  testament: 'ot' | 'nt';
  chapters: number[];
}

export interface ReaderManifest {
  versionId: string;
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
}
