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
