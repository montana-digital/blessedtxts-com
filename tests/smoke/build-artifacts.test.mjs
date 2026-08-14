import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

describe('build artifacts smoke', () => {
  for (const id of ['kjv', 'web', 'webster']) {
    it(`manifest-${id}.json has 66 books`, () => {
      const p = path.join(ROOT, 'public', 'bibles', `manifest-${id}.json`);
      assert.ok(fs.existsSync(p), `missing ${p}`);
      const m = JSON.parse(fs.readFileSync(p, 'utf8'));
      assert.equal(m.books.length, 66);
    });
  }

  it('sample chapter JSON exists at public path', () => {
    const p = path.join(ROOT, 'public', 'bibles', 'kjv', 'genesis', '1.json');
    assert.ok(fs.existsSync(p));
    const ch = JSON.parse(fs.readFileSync(p, 'utf8'));
    assert.ok(ch.verses.length > 0);
  });

  it('verse-id-map URLs use reader hashes', () => {
    const p = path.join(ROOT, 'public', 'search', 'verse-id-map-kjv.json');
    const map = JSON.parse(fs.readFileSync(p, 'utf8'));
    const first = Object.values(map)[0];
    assert.match(first.url, /\/read\/#/);
  });

  it('reference-map resolves john:3:16', () => {
    const p = path.join(ROOT, 'public', 'search', 'reference-map.json');
    const map = JSON.parse(fs.readFileSync(p, 'utf8'));
    assert.ok(map['john:3:16']?.kjv);
  });

  for (const id of ['kjv', 'web', 'webster']) {
    it(`keywords-${id} shards and prefixes exist`, () => {
      const dir = path.join(ROOT, 'public', 'search', `keywords-${id}`);
      assert.ok(fs.existsSync(path.join(dir, 'a.json')), `missing ${dir}/a.json`);
      assert.ok(fs.existsSync(path.join(dir, 'prefixes.json')));
      const shard = JSON.parse(fs.readFileSync(path.join(dir, 'a.json'), 'utf8'));
      const tokens = Object.keys(shard);
      assert.ok(tokens.length > 0);
    });
  }

  it('slim index-kjv.min.json is under 14 MB', () => {
    const p = path.join(ROOT, 'public', 'search', 'index-kjv.min.json');
    assert.ok(fs.existsSync(p));
    const mb = fs.statSync(p).size / 1024 / 1024;
    assert.ok(mb < 14, `index-kjv.min.json is ${mb.toFixed(2)} MB, expected < 14 MB`);
  });

  it('retrieval-manifest lists keyword shards', () => {
    const m = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'public', 'search', 'retrieval-manifest.json'), 'utf8'),
    );
    assert.ok(m.translations.kjv.keywords?.shards);
    assert.ok(m.translations.kjv.keywords?.prefixes);
  });

  it('blessing pool JSON files exist', () => {
    for (const file of ['all.json', 'kjv-ot.json', 'web.json', 'webster.json']) {
      const p = path.join(ROOT, 'public', 'blessings', 'pools', file);
      assert.ok(fs.existsSync(p), `missing ${p}`);
    }
  });

  it('kjv-ot blessing pool includes Psalms', () => {
    const p = path.join(ROOT, 'public', 'blessings', 'pools', 'kjv-ot.json');
    const pool = JSON.parse(fs.readFileSync(p, 'utf8'));
    assert.ok(Array.isArray(pool) && pool.length > 0);
    assert.ok(
      pool.some((line) => /^Psalm(s)? \d+:/.test(line)),
      'kjv-ot pool should include Psalm references',
    );
  });

  it('favicon and PWA assets exist in public', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'public', 'favicon.ico')));
    assert.ok(fs.existsSync(path.join(ROOT, 'public', 'site.webmanifest')));
    assert.ok(fs.existsSync(path.join(ROOT, 'public', 'apple-touch-icon.png')));
    assert.ok(fs.existsSync(path.join(ROOT, 'public', 'favicon.svg')));
  });

  it('built CSS bundles web fonts when dist is present', () => {
    const distAstro = path.join(ROOT, 'dist', '_astro');
    if (!fs.existsSync(distAstro)) return;
    const woff2 = fs
      .readdirSync(distAstro)
      .filter((name) => name.endsWith('.woff2'));
    assert.ok(woff2.length > 0, 'expected hashed .woff2 files under dist/_astro');
    const cssFiles = fs.readdirSync(distAstro).filter((name) => name.endsWith('.css'));
    const hasBundledFontUrl = cssFiles.some((name) => {
      const css = fs.readFileSync(path.join(distAstro, name), 'utf8');
      return /url\([^)]+\.woff2\)/.test(css) && !css.includes('url(./files/');
    });
    assert.ok(hasBundledFontUrl, 'expected @font-face URLs rewritten away from ./files/');
  });

});
