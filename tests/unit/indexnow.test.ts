import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  keyLocation,
  parseLocTags,
  parseSitemapLocs,
  PLACEHOLDER_KEY,
  validateKey,
} from '../../scripts/indexnow-lib.mjs';

describe('validateKey', () => {
  it('accepts valid hex keys', () => {
    expect(validateKey('8f3c079a4d4f4069874bec9750826f56')).toEqual({
      ok: true,
      key: '8f3c079a4d4f4069874bec9750826f56',
    });
  });

  it('rejects short or non-hex keys', () => {
    expect(validateKey('abc')).toMatchObject({ ok: false });
    expect(validateKey('not-hex-key!!')).toMatchObject({ ok: false });
  });

  it('rejects placeholder key', () => {
    expect(validateKey(PLACEHOLDER_KEY)).toMatchObject({ ok: false });
  });
});

describe('keyLocation', () => {
  it('builds root key URL', () => {
    expect(keyLocation('blessedtxts.com', '8f3c079a4d4f4069874bec9750826f56')).toBe(
      'https://blessedtxts.com/8f3c079a4d4f4069874bec9750826f56.txt',
    );
  });
});

describe('parseLocTags', () => {
  it('extracts loc elements', () => {
    const xml = `<?xml version="1.0"?><urlset>
      <url><loc>https://blessedtxts.com/</loc></url>
      <url><loc>https://blessedtxts.com/about/</loc></url>
    </urlset>`;
    expect(parseLocTags(xml)).toEqual([
      'https://blessedtxts.com/',
      'https://blessedtxts.com/about/',
    ]);
  });
});

describe('parseSitemapLocs', () => {
  it('reads child sitemaps from index and filters by host', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-'));
    fs.writeFileSync(
      path.join(dir, 'sitemap-index.xml'),
      `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://blessedtxts.com/sitemap-0.xml</loc></sitemap>
</sitemapindex>`,
    );
    fs.writeFileSync(
      path.join(dir, 'sitemap-0.xml'),
      `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://blessedtxts.com/</loc></url>
  <url><loc>https://blessedtxts.com/topics/hope/</loc></url>
  <url><loc>https://other.example.com/nope/</loc></url>
</urlset>`,
    );

    expect(parseSitemapLocs(dir, 'blessedtxts.com')).toEqual([
      'https://blessedtxts.com/',
      'https://blessedtxts.com/topics/hope/',
    ]);

    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('indexnow key file format', () => {
  it('writes key without trailing newline', () => {
    const key = '8f3c079a4d4f4069874bec9750826f56';
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-key-'));
    const file = path.join(dir, `${key}.txt`);
    fs.writeFileSync(file, key, 'utf8');
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toBe(key);
    expect(content.endsWith('\n')).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
