import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadIndexNowConfig, resolveKey } from '../../scripts/indexnow-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const SITE_URL = 'https://blessedtxts.com';
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

describe('SEO artifacts smoke', () => {
  it('robots.txt points to sitemap-index.xml and documents llms.txt', () => {
    const robots = fs.readFileSync(path.join(ROOT, 'public', 'robots.txt'), 'utf8');
    assert.match(robots, /sitemap-index\.xml/i);
    assert.doesNotMatch(robots, /sitemap\.xml\s*$/m);
    assert.match(robots, /llms\.txt/i);
  });

  it('llms.txt exists and lists primary URLs', () => {
    const llms = fs.readFileSync(path.join(ROOT, 'public', 'llms.txt'), 'utf8');
    assert.match(llms, /blessedtxts\.com\/topics\//);
    assert.match(llms, /king-james-bible\/read/);
  });

  it('committed stub sitemap.xml is not present', () => {
    assert.ok(!fs.existsSync(path.join(ROOT, 'public', 'sitemap.xml')));
  });

  it('indexnow.config.example.json documents host blessedtxts.com', () => {
    const examplePath = path.join(ROOT, 'indexnow.config.example.json');
    assert.ok(fs.existsSync(examplePath));
    const config = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
    assert.equal(config.host, 'blessedtxts.com');
    assert.match(config.key, /^[a-f0-9]{8,128}$/i);
  });

  it('indexnow.config.json host matches when present', () => {
    const configPath = path.join(ROOT, 'indexnow.config.json');
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.equal(config.host, 'blessedtxts.com');
    assert.match(config.key, /^[a-f0-9]{8,128}$/i);
  });

  it('indexnow key file matches config when a real key is configured', () => {
    const resolved = resolveKey();
    if (!resolved.ok) return;
    const keyPath = path.join(ROOT, 'public', `${resolved.key}.txt`);
    if (!fs.existsSync(keyPath)) return;
    const content = fs.readFileSync(keyPath, 'utf8');
    assert.equal(content, resolved.key);
    assert.doesNotMatch(content, /\n$/);
    assert.equal(loadIndexNowConfig().host, 'blessedtxts.com');
  });

  it('_redirects defines legacy 301 patterns', () => {
    const redirects = fs.readFileSync(path.join(ROOT, 'public', '_redirects'), 'utf8');
    assert.match(redirects, /\/king-james-bible\/:book\/:chapter/);
    assert.match(redirects, /\/bible-versions\//);
    assert.match(redirects, /301/);
  });

  it('PWA manifest and touch icon exist in public', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'public', 'site.webmanifest')));
    const manifest = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'public', 'site.webmanifest'), 'utf8'),
    );
    assert.match(manifest.icons[0].src, /apple-touch-icon/);
    assert.ok(fs.existsSync(path.join(ROOT, 'public', 'apple-touch-icon.png')));
  });

  it('built sitemap excludes legacy chapter redirects when dist exists', () => {
    const indexPath = path.join(ROOT, 'dist', 'sitemap-0.xml');
    if (!fs.existsSync(indexPath)) return;
    const xml = fs.readFileSync(indexPath, 'utf8');
    assert.doesNotMatch(xml, /king-james-bible\/genesis\/1\/?<\/loc>/);
    assert.match(xml, /\/topics\/hope\/?<\/loc>/);
    assert.match(xml, /\/indexed-bible\/?<\/loc>/);
    assert.match(xml, /\/king-james-bible\/read\/?<\/loc>/);
  });

  it('dist branding assets exist when dist exists', () => {
    for (const file of ['og-image.jpg', 'favicon.ico', 'logo.webp']) {
      const p = path.join(ROOT, 'dist', file);
      if (!fs.existsSync(p)) return;
      assert.ok(fs.statSync(p).size > 0, `${file} should not be empty`);
    }
  });

  it('dist indexable pages have canonical and description when dist exists', () => {
    const home = path.join(ROOT, 'dist', 'index.html');
    if (!fs.existsSync(home)) return;
    const html = fs.readFileSync(home, 'utf8');
    assert.match(html, /rel="canonical"/);
    assert.match(html, /name="description"/);
    assert.match(html, /twitter:card/);
    assert.match(html, /application\/ld\+json/);
    assert.ok(html.includes(OG_IMAGE), 'home should reference absolute og:image URL');
    assert.match(html, /property="og:image"/);
    assert.match(html, /site\.webmanifest/);
  });

  it('reader dist includes SEO preview and popular chapters in noscript when dist exists', () => {
    const reader = path.join(ROOT, 'dist', 'king-james-bible', 'read', 'index.html');
    if (!fs.existsSync(reader)) return;
    const html = fs.readFileSync(reader, 'utf8');
    assert.match(html, /reader-seo-preview/);
    assert.match(html, /<noscript>[\s\S]*In the beginning God created/i);
    assert.match(html, /<noscript>[\s\S]*For God so loved the world/i);
    const previewSection = html.match(/<section class="reader-seo-preview"[\s\S]*?<\/section>/i);
    assert.ok(previewSection, 'reader SEO preview section should exist');
    assert.doesNotMatch(previewSection[0], /In the beginning God created/i);
    assert.doesNotMatch(previewSection[0], /For God so loved the world/i);
  });

  it('indexed-bible book links use trailing slash before hash when dist exists', () => {
    const page = path.join(ROOT, 'dist', 'indexed-bible', 'index.html');
    if (!fs.existsSync(page)) return;
    const html = fs.readFileSync(page, 'utf8');
    assert.doesNotMatch(html, /href="\/king-james-bible\/read#[^/]/);
    assert.doesNotMatch(html, /href="\/world-english-bible\/read#[^/]/);
    assert.doesNotMatch(html, /href="\/websters-bible\/read#[^/]/);
    assert.match(html, /href="\/king-james-bible\/read\/#/);
  });

  it('built indexable pages have meta descriptions in 120–160 chars when dist exists', () => {
    const indexPath = path.join(ROOT, 'dist', 'sitemap-0.xml');
    if (!fs.existsSync(indexPath)) return;
    const xml = fs.readFileSync(indexPath, 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());
    const MIN = 120;
    const MAX = 160;
    for (const loc of locs) {
      const pathname = new URL(loc).pathname;
      const htmlPath =
        pathname === '/'
          ? path.join(ROOT, 'dist', 'index.html')
          : path.join(ROOT, 'dist', pathname.replace(/\/$/, ''), 'index.html');
      if (!fs.existsSync(htmlPath)) continue;
      const html = fs.readFileSync(htmlPath, 'utf8');
      const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
      assert.ok(m, `missing meta description: ${loc}`);
      const len = m[1].length;
      assert.ok(
        len >= MIN && len <= MAX,
        `meta description for ${loc} is ${len} chars (expected ${MIN}–${MAX})`,
      );
    }
  });

  it('built sitemap has expected indexable URL count when dist exists', () => {
    const indexPath = path.join(ROOT, 'dist', 'sitemap-0.xml');
    if (!fs.existsSync(indexPath)) return;
    const xml = fs.readFileSync(indexPath, 'utf8');
    const count = (xml.match(/<loc>/g) || []).length;
    assert.ok(count >= 22 && count <= 26, `expected 22–26 sitemap URLs, got ${count}`);
  });
});
