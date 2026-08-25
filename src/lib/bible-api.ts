import { VERSIONS, bookToSlug, routeSlugToId, type VersionId } from './bible-config';
import { parseReferenceQuery } from './reference-parse';
import type { ChapterData } from './reader-types';
import { chapterPagePath, chapterVersePath } from './passage-urls';

export const API_LICENSE = 'https://creativecommons.org/publicdomain/mark/1.0/';

export type ApiErrorCode = 'bad_request' | 'not_found' | 'method_not_allowed' | 'upstream';

export interface ApiErrorBody {
  error: ApiErrorCode;
  message: string;
}

export interface ApiSuccessMeta {
  status: number;
  body: Record<string, unknown>;
}

export interface ApiFailure {
  status: number;
  body: ApiErrorBody;
}

export type ApiResult = ApiSuccessMeta | ApiFailure;

export function jsonError(error: ApiErrorCode, message: string, status: number): ApiFailure {
  return { status, body: { error, message } };
}

/** Citation URL agents can open: origin of this request + site path (and optional hash). */
export function absoluteApiUrl(requestUrl: URL, sitePath: string): string {
  return new URL(sitePath, requestUrl.origin).href;
}

export function resolveVersionParam(raw: string | null): VersionId | null {
  if (!raw || !raw.trim()) return 'kjv';
  const key = raw.trim().toLowerCase();
  if (key in VERSIONS) return key as VersionId;
  return routeSlugToId(key) ?? null;
}

export type FetchChapter = (
  versionId: VersionId,
  bookSlug: string,
  chapter: number,
) => Promise<ChapterData | null>;

export async function handleVerseRequest(url: URL, fetchChapter: FetchChapter): Promise<ApiResult> {
  const versionId = resolveVersionParam(url.searchParams.get('version'));
  if (!versionId) {
    return jsonError('bad_request', 'Unknown version. Use kjv, web, webster, or a version slug.', 400);
  }

  const ref = url.searchParams.get('ref')?.trim() ?? '';
  if (!ref) {
    return jsonError('bad_request', 'Missing required query parameter ref (for example John 3:16).', 400);
  }

  const parsed = parseReferenceQuery(ref);
  if (!parsed || parsed.verse == null) {
    return jsonError('bad_request', 'Could not parse ref as a verse reference (for example John 3:16).', 400);
  }

  const bookSlug = bookToSlug(parsed.book);
  let chapter: ChapterData | null;
  try {
    chapter = await fetchChapter(versionId, bookSlug, parsed.chapter);
  } catch (err) {
    console.error('[bible-api] verse upstream', err);
    return jsonError('upstream', 'Could not load chapter text.', 502);
  }

  if (!chapter) {
    return jsonError(
      'not_found',
      `Chapter ${bookSlug} ${parsed.chapter} was not found in ${versionId}.`,
      404,
    );
  }

  const verse = chapter.verses.find((v) => v.n === parsed.verse);
  if (!verse) {
    return jsonError(
      'not_found',
      `Verse ${chapter.book} ${parsed.chapter}:${parsed.verse} was not found in ${versionId}.`,
      404,
    );
  }

  const meta = VERSIONS[versionId];
  return {
    status: 200,
    body: {
      ref: `${chapter.book} ${chapter.chapter}:${verse.n}`,
      version: { id: versionId, label: meta.label },
      text: verse.text,
      url: absoluteApiUrl(
        url,
        chapterVersePath(meta.routeSlug, bookSlug, chapter.chapter, verse.n),
      ),
      license: API_LICENSE,
      citation: `${chapter.book} ${chapter.chapter}:${verse.n}, ${meta.label}, Blessed Texts`,
    },
  };
}

export async function handleChapterRequest(url: URL, fetchChapter: FetchChapter): Promise<ApiResult> {
  const versionId = resolveVersionParam(url.searchParams.get('version'));
  if (!versionId) {
    return jsonError('bad_request', 'Unknown version. Use kjv, web, webster, or a version slug.', 400);
  }

  const bookRaw = url.searchParams.get('book')?.trim() ?? '';
  const chapterRaw = url.searchParams.get('chapter')?.trim() ?? '';
  if (!bookRaw || !chapterRaw) {
    return jsonError('bad_request', 'Missing required query parameters book and chapter.', 400);
  }

  const chapterNum = Number.parseInt(chapterRaw, 10);
  if (!Number.isFinite(chapterNum) || chapterNum < 1) {
    return jsonError('bad_request', 'chapter must be a positive integer.', 400);
  }

  const parsedBook = parseReferenceQuery(`${bookRaw} ${chapterNum}`);
  const bookSlug = parsedBook ? bookToSlug(parsedBook.book) : bookRaw.toLowerCase().replace(/\s+/g, '-');

  let chapter: ChapterData | null;
  try {
    chapter = await fetchChapter(versionId, bookSlug, chapterNum);
  } catch (err) {
    console.error('[bible-api] chapter upstream', err);
    return jsonError('upstream', 'Could not load chapter text.', 502);
  }

  if (!chapter) {
    return jsonError('not_found', `Chapter ${bookSlug} ${chapterNum} was not found in ${versionId}.`, 404);
  }

  const meta = VERSIONS[versionId];
  return {
    status: 200,
    body: {
      ref: `${chapter.book} ${chapter.chapter}`,
      version: { id: versionId, label: meta.label },
      book: chapter.book,
      bookSlug: chapter.bookSlug,
      chapter: chapter.chapter,
      verses: chapter.verses,
      url: absoluteApiUrl(
        url,
        chapterPagePath(meta.routeSlug, chapter.bookSlug, chapter.chapter),
      ),
      license: API_LICENSE,
    },
  };
}

export function apiResponse(result: ApiResult, extraHeaders: HeadersInit = {}): Response {
  const cache = result.status === 200 ? 'public, max-age=86400' : 'no-store';
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

export function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
