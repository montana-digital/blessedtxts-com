import { VERSIONS, type VersionId } from './bible-config';

export function bookPagePath(routeSlug: string, bookSlug: string): string {
  return `/${routeSlug}/${bookSlug}/`;
}

export function chapterPagePath(routeSlug: string, bookSlug: string, chapter: number): string {
  return `/${routeSlug}/${bookSlug}/${chapter}/`;
}

export function chapterVerseFragment(verse: number): string {
  return `v${verse}`;
}

export function chapterVersePath(
  routeSlug: string,
  bookSlug: string,
  chapter: number,
  verse: number,
): string {
  return `${chapterPagePath(routeSlug, bookSlug, chapter)}#${chapterVerseFragment(verse)}`;
}

export function readerPassagePath(
  routeSlug: string,
  bookSlug: string,
  chapter: number,
  verse?: number,
): string {
  const hash = verse != null ? `${bookSlug}-${chapter}-v${verse}` : `${bookSlug}-${chapter}`;
  return `/${routeSlug}/read/#${hash}`;
}

export function versionRouteSlug(versionId: VersionId): string {
  return VERSIONS[versionId].routeSlug;
}

export function chapterMarkdownPath(versionId: VersionId, bookSlug: string, chapter: number): string {
  return `/downloads/${versionId}/${bookSlug}/${chapter}.md`;
}

export function bookMarkdownPath(versionId: VersionId, bookSlug: string): string {
  return `/downloads/${versionId}/${bookSlug}.md`;
}

export function chapterJsonAssetPath(versionId: VersionId, bookSlug: string, chapter: number): string {
  return `/bibles/${versionId}/${bookSlug}/${chapter}.json`;
}

export interface TranslationDocumentHref {
  versionId: VersionId;
  routeSlug: string;
  label: string;
  href: string;
  current: boolean;
}

export function translationDocumentHrefs(
  currentVersionId: VersionId,
  bookSlug: string,
  chapter?: number,
): TranslationDocumentHref[] {
  return Object.values(VERSIONS).map((meta) => ({
    versionId: meta.id,
    routeSlug: meta.routeSlug,
    label: meta.label,
    href:
      chapter != null
        ? chapterPagePath(meta.routeSlug, bookSlug, chapter)
        : bookPagePath(meta.routeSlug, bookSlug),
    current: meta.id === currentVersionId,
  }));
}
