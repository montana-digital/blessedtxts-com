import { describe, expect, it } from 'vitest';
import { submitIndexNowWithRetry } from '../../scripts/indexnow-lib.mjs';

describe('submitIndexNowWithRetry', () => {
  it('returns ok on 202', async () => {
    const fetchImpl = async () => new Response('accepted', { status: 202 });
    const result = await submitIndexNowWithRetry({
      host: 'blessedtxts.com',
      key: 'abc',
      keyLocation: 'https://blessedtxts.com/abc.txt',
      urlList: ['https://blessedtxts.com/'],
      fetchImpl,
      retries: 0,
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(202);
  });

  it('retries then returns failure without throwing', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return new Response('nope', { status: 500 });
    };
    const result = await submitIndexNowWithRetry({
      host: 'blessedtxts.com',
      key: 'abc',
      keyLocation: 'https://blessedtxts.com/abc.txt',
      urlList: ['https://blessedtxts.com/'],
      fetchImpl,
      retries: 2,
      delayMs: 1,
    });
    expect(result.ok).toBe(false);
    expect(calls).toBe(3);
  });
});
