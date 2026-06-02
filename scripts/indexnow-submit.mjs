import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INDEXNOW_API,
  keyLocation,
  loadIndexNowConfig,
  parseSitemapLocs,
  resolveKey,
  ROOT,
  shouldSubmitIndexNow,
} from './indexnow-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');

if (!shouldSubmitIndexNow()) {
  console.log('[indexnow] skip submit: not a production Cloudflare Pages build');
  process.exit(0);
}

const resolved = resolveKey();
if (!resolved.ok) {
  console.warn(`[indexnow] skip submit: ${resolved.reason}`);
  process.exit(0);
}

const { host } = loadIndexNowConfig();
const { key } = resolved;

if (!fs.existsSync(DIST)) {
  console.error('[indexnow] dist/ missing — run astro build first');
  process.exit(1);
}

const urlList = parseSitemapLocs(DIST, host);
if (urlList.length === 0) {
  console.error('[indexnow] no URLs found in sitemap');
  process.exit(1);
}

const payload = {
  host,
  key,
  keyLocation: keyLocation(host, key),
  urlList,
};

console.log(`[indexnow] submitting ${urlList.length} URL(s) to ${INDEXNOW_API}`);

const res = await fetch(INDEXNOW_API, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

if (res.status === 200 || res.status === 202) {
  console.log(`[indexnow] success (${res.status})`);
  process.exit(0);
}

const body = await res.text().catch(() => '');
console.error(`[indexnow] failed (${res.status})${body ? `: ${body}` : ''}`);
process.exit(1);
