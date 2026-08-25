import { describe, expect, it } from 'vitest';
import {
  handleChapterRequest,
  handleVerseRequest,
  jsonError,
  resolveVersionParam,
} from '../../src/lib/bible-api';
import type { ChapterData } from '../../src/lib/reader-types';

const genesis1: ChapterData = {
  book: 'Genesis',
  bookSlug: 'genesis',
  chapter: 1,
  translation: 'kjv',
  translationLabel: 'King James Bible',
  verses: [
    { n: 1, text: 'In the beginning God created the heaven and the earth.' },
  ],
};

const fetchOk = async (versionId: string, bookSlug: string, chapter: number) => {
  if (versionId === 'kjv' && bookSlug === 'genesis' && chapter === 1) return genesis1;
  return null;
};

const fetchThrow = async () => {
  throw new Error('network');
};

describe('resolveVersionParam', () => {
  it('defaults to kjv', () => {
    expect(resolveVersionParam(null)).toBe('kjv');
    expect(resolveVersionParam('')).toBe('kjv');
  });

  it('accepts ids and route slugs', () => {
    expect(resolveVersionParam('web')).toBe('web');
    expect(resolveVersionParam('king-james-bible')).toBe('kjv');
  });

  it('rejects unknown versions', () => {
    expect(resolveVersionParam('niv')).toBeNull();
  });
});

describe('handleVerseRequest', () => {
  it('returns 200 for John-style refs via genesis fixture', async () => {
    const url = new URL('https://blessedtxts.com/api/v1/verse?ref=Genesis+1:1&version=kjv');
    const result = await handleVerseRequest(url, fetchOk);
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      text: 'In the beginning God created the heaven and the earth.',
      url: 'https://blessedtxts.com/king-james-bible/genesis/1/#v1',
    });
  });

  it('builds an absolute citation url from the request origin', async () => {
    const url = new URL('https://preview.example/api/v1/verse?ref=Genesis+1:1&version=kjv');
    const result = await handleVerseRequest(url, fetchOk);
    expect(result.status).toBe(200);
    expect((result.body as { url: string }).url).toBe(
      'https://preview.example/king-james-bible/genesis/1/#v1',
    );
  });

  it('returns 400 without ref', async () => {
    const url = new URL('https://blessedtxts.com/api/v1/verse');
    const result = await handleVerseRequest(url, fetchOk);
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ error: 'bad_request' });
  });

  it('returns 404 for missing verse', async () => {
    const url = new URL('https://blessedtxts.com/api/v1/verse?ref=Genesis+1:99');
    const result = await handleVerseRequest(url, fetchOk);
    expect(result.status).toBe(404);
    expect(result.body).toMatchObject({ error: 'not_found' });
  });

  it('returns 502 when fetch throws', async () => {
    const url = new URL('https://blessedtxts.com/api/v1/verse?ref=Genesis+1:1');
    const result = await handleVerseRequest(url, fetchThrow);
    expect(result.status).toBe(502);
    expect(result.body).toMatchObject({ error: 'upstream' });
  });
});

describe('handleChapterRequest', () => {
  it('returns verses for a known chapter', async () => {
    const url = new URL('https://blessedtxts.com/api/v1/chapter?book=genesis&chapter=1&version=kjv');
    const result = await handleChapterRequest(url, fetchOk);
    expect(result.status).toBe(200);
    expect((result.body as { verses: unknown[] }).verses).toHaveLength(1);
    expect((result.body as { url: string }).url).toBe(
      'https://blessedtxts.com/king-james-bible/genesis/1/',
    );
  });

  it('builds an absolute chapter url from the request origin', async () => {
    const url = new URL('http://localhost:8788/api/v1/chapter?book=genesis&chapter=1');
    const result = await handleChapterRequest(url, fetchOk);
    expect(result.status).toBe(200);
    expect((result.body as { url: string }).url).toBe(
      'http://localhost:8788/king-james-bible/genesis/1/',
    );
  });

  it('returns 404 for unknown chapter', async () => {
    const url = new URL('https://blessedtxts.com/api/v1/chapter?book=genesis&chapter=99');
    const result = await handleChapterRequest(url, fetchOk);
    expect(result.status).toBe(404);
  });

  it('returns 400 when chapter is missing', async () => {
    const url = new URL('https://blessedtxts.com/api/v1/chapter?book=genesis');
    const result = await handleChapterRequest(url, fetchOk);
    expect(result.status).toBe(400);
  });
});

describe('jsonError', () => {
  it('shapes a stable body', () => {
    expect(jsonError('not_found', 'missing', 404)).toEqual({
      status: 404,
      body: { error: 'not_found', message: 'missing' },
    });
  });
});
