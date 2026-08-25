import type { VersionId } from './bible-config';
import type { ChapterData } from './reader-types';

export interface PagesAssetEnv {
  ASSETS?: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };
}

export class InvalidChapterAssetError extends Error {
  constructor(message = 'invalid chapter json') {
    super(message);
    this.name = 'InvalidChapterAssetError';
  }
}

export function parseChapterData(data: unknown): ChapterData {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new InvalidChapterAssetError();
  }

  const raw = data as Record<string, unknown>;
  if (typeof raw.book !== 'string' || !raw.book.trim()) {
    throw new InvalidChapterAssetError();
  }
  if (typeof raw.bookSlug !== 'string' || !raw.bookSlug.trim()) {
    throw new InvalidChapterAssetError();
  }
  if (typeof raw.chapter !== 'number' || !Number.isFinite(raw.chapter) || raw.chapter < 1) {
    throw new InvalidChapterAssetError();
  }
  if (!Array.isArray(raw.verses)) {
    throw new InvalidChapterAssetError();
  }

  const verses: { n: number; text: string }[] = [];
  for (const item of raw.verses) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new InvalidChapterAssetError();
    }
    const verse = item as Record<string, unknown>;
    if (typeof verse.n !== 'number' || !Number.isFinite(verse.n) || typeof verse.text !== 'string') {
      throw new InvalidChapterAssetError();
    }
    verses.push({ n: verse.n, text: verse.text });
  }

  return {
    book: raw.book,
    bookSlug: raw.bookSlug,
    chapter: raw.chapter,
    translation: typeof raw.translation === 'string' ? raw.translation : '',
    translationLabel: typeof raw.translationLabel === 'string' ? raw.translationLabel : '',
    verses,
  };
}

export async function fetchChapterFromAssets(
  request: Request,
  env: PagesAssetEnv,
  versionId: VersionId,
  bookSlug: string,
  chapter: number,
): Promise<ChapterData | null> {
  const assetUrl = new URL(`/bibles/${versionId}/${bookSlug}/${chapter}.json`, request.url);
  const res = env.ASSETS
    ? await env.ASSETS.fetch(new Request(assetUrl))
    : await fetch(assetUrl);
  if (!res.ok) return null;

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new InvalidChapterAssetError();
  }
  return parseChapterData(data);
}
