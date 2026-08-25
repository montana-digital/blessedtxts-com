import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..');
export const CONFIG_PATH = path.join(ROOT, 'indexnow.config.json');
export const PLACEHOLDER_KEY = '00000000000000000000000000000000';
export const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
export const PRODUCTION_BRANCH = 'main';

const HEX_KEY_RE = /^[a-f0-9]{8,128}$/i;

export function validateKey(key) {
  if (typeof key !== 'string' || !HEX_KEY_RE.test(key)) {
    return { ok: false, reason: 'key must be 8–128 hexadecimal characters' };
  }
  if (key.toLowerCase() === PLACEHOLDER_KEY) {
    return { ok: false, reason: 'placeholder key — replace in indexnow.config.json' };
  }
  return { ok: true, key: key.toLowerCase() };
}

export function loadIndexNowConfig() {
  let host = 'blessedtxts.com';
  let key = process.env.INDEXNOW_KEY?.trim() || '';

  if (fs.existsSync(CONFIG_PATH)) {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (raw.host) host = String(raw.host).trim();
    if (!key && raw.key) key = String(raw.key).trim();
  }

  return { host, key };
}

export function resolveKey() {
  const { key } = loadIndexNowConfig();
  if (!key) return { ok: false, reason: 'no key in INDEXNOW_KEY or indexnow.config.json' };
  return validateKey(key);
}

export function keyFilePath(key) {
  return path.join(ROOT, 'public', `${key}.txt`);
}

export function keyLocation(host, key) {
  return `https://${host}/${key}.txt`;
}

export function shouldSubmitIndexNow() {
  if (process.env.CF_PAGES !== '1') return false;
  const branch = process.env.CF_PAGES_BRANCH || '';
  return branch === PRODUCTION_BRANCH;
}

export function parseLocTags(xml) {
  const locs = [];
  const re = /<loc>([^<]+)<\/loc>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    locs.push(m[1].trim());
  }
  return locs;
}

export function parseSitemapLocs(distDir, expectedHost) {
  const indexPath = path.join(distDir, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`missing ${indexPath} — run astro build first`);
  }

  const indexXml = fs.readFileSync(indexPath, 'utf8');
  const childNames = parseLocTags(indexXml).map((url) => {
    try {
      return path.basename(new URL(url).pathname);
    } catch {
      return null;
    }
  }).filter(Boolean);

  const sitemapFiles = childNames.length > 0
    ? childNames.map((name) => path.join(distDir, name))
    : [path.join(distDir, 'sitemap-0.xml')];

  const urls = [];
  for (const file of sitemapFiles) {
    if (!fs.existsSync(file)) continue;
    urls.push(...parseLocTags(fs.readFileSync(file, 'utf8')));
  }

  const host = expectedHost.toLowerCase();
  const seen = new Set();
  const filtered = [];

  for (const url of urls) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    if (parsed.hostname.toLowerCase() !== host) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    filtered.push(url);
  }

  return filtered;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitIndexNowWithRetry({
  host,
  key,
  keyLocation: keyLoc,
  urlList,
  fetchImpl = fetch,
  retries = 2,
  delayMs = 400,
  apiUrl = INDEXNOW_API,
}) {
  const payload = JSON.stringify({
    host,
    key,
    keyLocation: keyLoc,
    urlList,
  });

  let last = { ok: false, status: 0, body: 'no attempt' };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchImpl(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: payload,
      });
      const body = await res.text().catch(() => '');
      if (res.status === 200 || res.status === 202) {
        return { ok: true, status: res.status, body };
      }
      last = { ok: false, status: res.status, body };
    } catch (err) {
      last = { ok: false, status: 0, body: err instanceof Error ? err.message : String(err) };
    }
    if (attempt < retries) await sleep(delayMs * (attempt + 1));
  }

  return last;
}

