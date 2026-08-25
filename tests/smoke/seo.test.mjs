import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadIndexNowConfig, parseSitemapLocs, resolveKey } from '../../scripts/indexnow-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const SITE_URL = 'https://blessedtxts.com';
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

describe('SEO artifacts smoke', () => {
  it('robots.txt points to sitemap-index.xml, llms.txt, and Content-Signal', () => {
    const robots = fs.readFileSync(path.join(ROOT, 'public', 'robots.txt'), 'utf8');
    assert.match(robots, /sitemap-index\.xml/i);
    assert.doesNotMatch(robots, /sitemap\.xml\s*$/m);
    assert.match(robots, /llms\.txt/i);
    assert.match(robots, /agents\.txt/i);
    assert.match(robots, /OAI-SearchBot/);
    assert.match(robots, /Content-Signal:\s*search=yes,\s*ai-input=yes,\s*ai-train=yes/);
  });

  it('llms.txt exists and lists primary URLs', () => {
    const llms = fs.readFileSync(path.join(ROOT, 'public', 'llms.txt'), 'utf8');
    assert.match(llms, /blessedtxts\.com\/topics\//);
    assert.match(llms, /king-james-bible\/read/);
    assert.match(llms, /king-james-bible\/john\/3/);
    assert.match(llms, /api\/v1\/verse/);
    assert.match(llms, /agents\.txt/);
    const wellKnown = fs.readFileSync(path.join(ROOT, 'public', '.well-known', 'llms.txt'), 'utf8');
    assert.equal(llms, wellKnown);
  });

  it('agents.txt points at llms.txt and OpenAPI', () => {
    const agents = fs.readFileSync(path.join(ROOT, 'public', 'agents.txt'), 'utf8');
    assert.match(agents, /llms\.txt/);
    assert.match(agents, /api\/v1\/openapi\.json/);
    assert.match(agents, /api\/v1\/verse\?ref=/);
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

  it('_headers allows CORS on public corpus paths', () => {
    const headers = fs.readFileSync(path.join(ROOT, 'public', '_headers'), 'utf8');
    assert.match(headers, /\/bibles\/\*[\s\S]*Access-Control-Allow-Origin: \*/);
    assert.match(headers, /\/downloads\/\*[\s\S]*Access-Control-Allow-Origin: \*/);
    assert.match(headers, /\/api\/\*[\s\S]*Access-Control-Allow-Origin: \*/);
  });

  it('_headers caches all sitemap XML files', () => {
    const headers = fs.readFileSync(path.join(ROOT, 'public', '_headers'), 'utf8');
    assert.match(headers, /\/sitemap-\*\.xml\r?\n\s+Cache-Control: public, max-age=86400/);
  });

  it('OpenAPI spec exists', () => {
    const spec = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'public', 'api', 'v1', 'openapi.json'), 'utf8'),
    );
    assert.equal(spec.openapi.startsWith('3.'), true);
    assert.ok(spec.paths['/api/v1/verse']);
    assert.ok(spec.paths['/api/v1/chapter']);
    assert.ok(spec.paths['/api/v1/verse'].get.responses['502']);
    assert.ok(spec.paths['/api/v1/verse'].get.responses['405']);
    assert.equal(spec.components.schemas.VerseSuccess.properties.url.format, 'uri');
    assert.equal(spec.components.schemas.ChapterSuccess.properties.url.format, 'uri');
  });

  it('_redirects keeps version-root 301s and drops book/chapter rules', () => {
    const redirects = fs.readFileSync(path.join(ROOT, 'public', '_redirects'), 'utf8');
    assert.match(redirects, /\/bible-versions\//);
    assert.match(redirects, /\/king-james-bible\/ /);
    assert.doesNotMatch(redirects, /:book\/:chapter/);
    assert.doesNotMatch(redirects, /\/king-james-bible\/:book /);
  });

  it('PWA manifest and touch icon exist in public', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'public', 'site.webmanifest')));
    const manifest = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'public', 'site.webmanifest'), 'utf8'),
    );
    assert.match(manifest.icons[0].src, /apple-touch-icon/);
    assert.ok(fs.existsSync(path.join(ROOT, 'public', 'apple-touch-icon.png')));
  });

  it('built sitemap includes chapter documents and hubs when dist exists', () => {
    const indexPath = path.join(ROOT, 'dist', 'sitemap-index.xml');
    if (!fs.existsSync(indexPath) && !fs.existsSync(path.join(ROOT, 'dist', 'sitemap-0.xml'))) {
      return;
    }
    const locs = parseSitemapLocs(path.join(ROOT, 'dist'), 'blessedtxts.com');
    const joined = locs.join('\n');
    assert.match(joined, /king-james-bible\/genesis\/1\/?$/m);
    assert.match(joined, /king-james-bible\/john\/3\/?$/m);
    assert.match(joined, /world-english-bible\/psalm\/23\/?$/m);
    assert.match(joined, /\/topics\/hope\/?$/m);
    assert.match(joined, /\/topics\/prayer\/?$/m);
    assert.match(joined, /\/indexed-bible\/?$/m);
    assert.match(joined, /\/king-james-bible\/read\/?$/m);
    assert.doesNotMatch(joined, /^https:\/\/blessedtxts\.com\/king-james-bible\/?$/m);
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

  it('indexed-bible book links point at book pages when dist exists', () => {
    const page = path.join(ROOT, 'dist', 'indexed-bible', 'index.html');
    if (!fs.existsSync(page)) return;
    const html = fs.readFileSync(page, 'utf8');
    assert.match(html, /href="\/king-james-bible\/genesis\/"/);
    assert.doesNotMatch(html, /href="\/king-james-bible\/read\/#genesis"/);
  });

  it('sample chapter HTML has verse text and is indexable when dist exists', () => {
    const chapter = path.join(ROOT, 'dist', 'king-james-bible', 'john', '3', 'index.html');
    if (!fs.existsSync(chapter)) return;
    const html = fs.readFileSync(chapter, 'utf8');
    assert.match(html, /For God so loved the world/i);
    assert.match(html, /id="v16"/);
    assert.match(html, /rel="canonical"/);
    assert.match(html, /"isPartOf"[\s\S]*translations\/king-james-bible/);
    assert.match(html, /rel="alternate"[^>]*type="text\/markdown"|type="text\/markdown"[^>]*rel="alternate"/);
    assert.match(html, /downloads\/kjv\/john\/3\.md/);
    assert.match(html, /href="\/world-english-bible\/john\/3\/"/);
    assert.match(html, /href="\/websters-bible\/john\/3\/"/);
    assert.doesNotMatch(html, /name="robots" content="noindex"/);
    assert.doesNotMatch(html, /location\.replace/);
  });

  it('built hub and sample pages have meta descriptions in 120–160 chars when dist exists', () => {
    const samples = [
      path.join(ROOT, 'dist', 'index.html'),
      path.join(ROOT, 'dist', 'topics', 'hope', 'index.html'),
      path.join(ROOT, 'dist', 'king-james-bible', 'john', '3', 'index.html'),
      path.join(ROOT, 'dist', 'king-james-bible', 'genesis', 'index.html'),
    ];
    if (!samples.every((p) => fs.existsSync(p))) return;
    const MIN = 120;
    const MAX = 160;
    for (const htmlPath of samples) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
      assert.ok(m, `missing meta description: ${htmlPath}`);
      const len = m[1].length;
      assert.ok(
        len >= MIN && len <= MAX,
        `meta description for ${htmlPath} is ${len} chars (expected ${MIN}–${MAX})`,
      );
    }
  });

  it('built sitemap has expected indexable URL count when dist exists', () => {
    const indexPath = path.join(ROOT, 'dist', 'sitemap-index.xml');
    const fallback = path.join(ROOT, 'dist', 'sitemap-0.xml');
    if (!fs.existsSync(indexPath) && !fs.existsSync(fallback)) return;
    const locs = parseSitemapLocs(path.join(ROOT, 'dist'), 'blessedtxts.com');
    assert.ok(locs.length >= 3700, `expected at least 3700 sitemap URLs, got ${locs.length}`);
    assert.ok(!locs.some((loc) => loc.endsWith('.md')), 'sitemap must not list markdown files');
  });
});
