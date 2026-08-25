import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const REQUIRE_DIST = process.env.REQUIRE_DIST === '1';

function distPath(...parts) {
  return path.join(DIST, ...parts);
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else count += 1;
  }
  return count;
}

describe('deploy budget smoke', () => {
  it('dist exists when REQUIRE_DIST=1', () => {
    if (!REQUIRE_DIST) return;
    assert.ok(fs.existsSync(DIST), 'dist/ missing — run npm run build:fast first');
  });

  it('homepage HTML is under size budget', () => {
    const home = distPath('index.html');
    if (!fs.existsSync(home)) {
      if (REQUIRE_DIST) assert.fail('dist/index.html missing');
      return;
    }
    const mb = fs.statSync(home).size / 1024 / 1024;
    const limitMb = process.env.HOMEPAGE_MB_LIMIT
      ? Number(process.env.HOMEPAGE_MB_LIMIT)
      : 0.5;
    assert.ok(mb < limitMb, `dist/index.html is ${mb.toFixed(2)} MB, expected < ${limitMb} MB`);
  });

  it('download artifacts exist after build', () => {
    if (!REQUIRE_DIST) return;
    const sample = path.join(ROOT, 'public', 'downloads', 'kjv', 'full.txt');
    assert.ok(fs.existsSync(sample), 'missing public/downloads/kjv/full.txt — run build:fast');
  });

  it('Genesis 1 txt/md exist and are linked from chapter HTML', () => {
    if (!REQUIRE_DIST) return;
    const txt = path.join(ROOT, 'public', 'downloads', 'kjv', 'genesis', '1.txt');
    const md = path.join(ROOT, 'public', 'downloads', 'kjv', 'genesis', '1.md');
    const distTxt = distPath('downloads', 'kjv', 'genesis', '1.txt');
    const distMd = distPath('downloads', 'kjv', 'genesis', '1.md');
    assert.ok(fs.existsSync(txt) || fs.existsSync(distTxt), 'missing downloads/kjv/genesis/1.txt');
    assert.ok(fs.existsSync(md) || fs.existsSync(distMd), 'missing downloads/kjv/genesis/1.md');
    const htmlPath = distPath('king-james-bible', 'genesis', '1', 'index.html');
    assert.ok(fs.existsSync(htmlPath), 'chapter page missing in dist/');
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.match(html, /\/downloads\/kjv\/genesis\/1\.txt/);
    assert.match(html, /\/downloads\/kjv\/genesis\/1\.md/);
  });

  it('chapter document has verse text and no JS redirect', () => {
    const sample = distPath('king-james-bible', 'genesis', '1', 'index.html');
    if (!fs.existsSync(sample)) {
      if (REQUIRE_DIST) assert.fail('chapter page missing in dist/');
      return;
    }
    const html = fs.readFileSync(sample, 'utf8');
    assert.match(html, /In the beginning God created/i);
    assert.doesNotMatch(html, /location\.replace/);
    assert.doesNotMatch(html, /name="robots" content="noindex"/);
  });

  it('dist file count is documented', () => {
    if (!fs.existsSync(DIST)) return;
    const count = countFiles(DIST);
    assert.ok(count > 100, `dist has only ${count} files — build may be incomplete`);
  });
});
