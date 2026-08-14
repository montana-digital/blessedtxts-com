import { describe, it, expect, vi } from 'vitest';
import { fetchJson, FetchJsonError, withOfflinePrefix } from '../../src/lib/fetch-json';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchJson', () => {
  it('returns JSON on the first successful response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const data = await fetchJson<{ ok: boolean }>('/x.json', {
      fetchImpl,
      sleep: () => Promise.resolve(),
    });
    expect(data).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries once after 5xx then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'no' }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const data = await fetchJson<{ ok: boolean }>('/x.json', {
      fetchImpl,
      sleep: () => Promise.resolve(),
    });
    expect(data).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry 4xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: 'missing' }, 404));
    await expect(
      fetchJson('/x.json', { fetchImpl, sleep: () => Promise.resolve() }),
    ).rejects.toBeInstanceOf(FetchJsonError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries a network failure then throws if the retry fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(
      fetchJson('/x.json', { fetchImpl, sleep: () => Promise.resolve() }),
    ).rejects.toThrow('Failed to fetch');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('withOfflinePrefix', () => {
  it('prefixes when navigator.onLine is false', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(withOfflinePrefix('Try again.')).toBe('You appear to be offline. Try again.');
    vi.unstubAllGlobals();
  });

  it('leaves the message unchanged when online', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(withOfflinePrefix('Try again.')).toBe('Try again.');
    vi.unstubAllGlobals();
  });
});
