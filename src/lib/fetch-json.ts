export const SCRIPTURE_DATA_UNAVAILABLE =
  'Scripture data could not be loaded. Check your connection and refresh, or tap Retry.';

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function withOfflinePrefix(message: string): string {
  if (isOffline()) return `You appear to be offline. ${message}`;
  return message;
}

export class FetchJsonError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'FetchJsonError';
    this.status = status;
  }
}

export interface FetchJsonOptions {
  fetchImpl?: typeof fetch;
  retries?: number;
  retryDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

function shouldRetry(err: unknown): boolean {
  if (err instanceof FetchJsonError && err.status !== undefined) {
    return err.status >= 500;
  }
  return true;
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retries = options.retries ?? 1;
  const retryDelayMs = options.retryDelayMs ?? 400;
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));

  const attempt = async (): Promise<T> => {
    const res = await fetchImpl(url);
    if (!res.ok) {
      throw new FetchJsonError(`Failed to load ${url} (${res.status})`, res.status);
    }
    return res.json() as Promise<T>;
  };

  try {
    return await attempt();
  } catch (err) {
    if (retries < 1 || !shouldRetry(err)) throw err;
    await sleep(retryDelayMs);
    return attempt();
  }
}
