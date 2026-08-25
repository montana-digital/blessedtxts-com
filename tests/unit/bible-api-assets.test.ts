import { describe, expect, it } from 'vitest';
import { handleChapterRequest, handleVerseRequest } from '../../src/lib/bible-api';
import {
  fetchChapterFromAssets,
  InvalidChapterAssetError,
  parseChapterData,
} from '../../src/lib/bible-api-assets';
import type { ChapterData } from '../../src/lib/reader-types';

const genesis1: ChapterData = {
  book: 'Genesis',
  bookSlug: 'genesis',
  chapter: 1,
  translation: 'kjv',
  translationLabel: 'King James Bible',
  verses: [{ n: 1, text: 'In the beginning God created the heaven and the earth.' }],
};

function assetEnv(status: number, body: string) {
  return {
    ASSETS: {
      fetch: async () =>
        new Response(body, {
          status,
          headers: { 'Content-Type': status === 200 ? 'application/json' : 'text/html' },
        }),
    },
  };
}

const request = new Request('https://blessedtxts.com/api/v1/verse?ref=Genesis+1:1');

describe('parseChapterData', () => {
  it('accepts a complete chapter payload', () => {
    expect(parseChapterData(genesis1)).toMatchObject({
      book: 'Genesis',
      bookSlug: 'genesis',
      chapter: 1,
      verses: [{ n: 1, text: 'In the beginning God created the heaven and the earth.' }],
    });
  });

  it('rejects missing verses and malformed verse rows', () => {
    expect(() => parseChapterData({ book: 'Genesis', bookSlug: 'genesis', chapter: 1 })).toThrow(
      InvalidChapterAssetError,
    );
    expect(() =>
      parseChapterData({
        book: 'Genesis',
        bookSlug: 'genesis',
        chapter: 1,
        verses: [{ n: '1', text: 'ok' }],
      }),
    ).toThrow(InvalidChapterAssetError);
  });
});

describe('fetchChapterFromAssets', () => {
  it('returns parsed chapter JSON', async () => {
    const chapter = await fetchChapterFromAssets(
      request,
      assetEnv(200, JSON.stringify(genesis1)),
      'kjv',
      'genesis',
      1,
    );
    expect(chapter?.book).toBe('Genesis');
    expect(chapter?.verses).toHaveLength(1);
  });

  it('returns null when the asset is missing', async () => {
    const chapter = await fetchChapterFromAssets(
      request,
      assetEnv(404, 'not found'),
      'kjv',
      'genesis',
      99,
    );
    expect(chapter).toBeNull();
  });

  it('throws on HTML or other non-JSON bodies', async () => {
    await expect(
      fetchChapterFromAssets(request, assetEnv(200, '<!doctype html><html></html>'), 'kjv', 'genesis', 1),
    ).rejects.toBeInstanceOf(InvalidChapterAssetError);
  });

  it('throws on JSON that is not a chapter', async () => {
    await expect(
      fetchChapterFromAssets(request, assetEnv(200, JSON.stringify({ error: 'oops' })), 'kjv', 'genesis', 1),
    ).rejects.toBeInstanceOf(InvalidChapterAssetError);
  });
});

describe('API handlers with invalid assets', () => {
  it('returns 502 upstream when verse chapter JSON is garbage', async () => {
    const url = new URL('https://blessedtxts.com/api/v1/verse?ref=Genesis+1:1');
    const result = await handleVerseRequest(url, async () => {
      return fetchChapterFromAssets(
        request,
        assetEnv(200, '<html>not a chapter</html>'),
        'kjv',
        'genesis',
        1,
      );
    });
    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({ error: 'upstream' });
  });

  it('returns 502 upstream when chapter JSON is garbage', async () => {
    const url = new URL('https://blessedtxts.com/api/v1/chapter?book=genesis&chapter=1');
    const result = await handleChapterRequest(url, async () => {
      return fetchChapterFromAssets(
        request,
        assetEnv(200, JSON.stringify({ not: 'a chapter' })),
        'kjv',
        'genesis',
        1,
      );
    });
    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({ error: 'upstream' });
  });
});
