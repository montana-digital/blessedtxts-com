import {
  INDEXNOW_API,
  keyLocation,
  loadIndexNowConfig,
  parseSitemapLocs,
  resolveKey,
  ROOT,
  shouldSubmitIndexNow,
  submitIndexNowWithRetry,
} from './indexnow-lib.mjs';
import fs from 'fs';
import path from 'path';

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

console.log(`[indexnow] submitting ${urlList.length} URL(s) to ${INDEXNOW_API}`);

const result = await submitIndexNowWithRetry({
  host,
  key,
  keyLocation: keyLocation(host, key),
  urlList,
});

if (result.ok) {
  console.log(`[indexnow] success (${result.status})`);
  process.exit(0);
}

console.warn(
  `[indexnow] failed after retries (${result.status})${result.body ? `: ${result.body}` : ''} — continuing deploy`,
);
process.exit(0);
