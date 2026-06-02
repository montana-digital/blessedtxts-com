import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  VERSIONS, bookToSlug, getTestament,
} from './bible-books.mjs';
import { tokenize, normalizeText } from './lib/tokenize.mjs';
import { writeAtomic } from './lib/write-atomic.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw');
const CONTENT_DIR = path.join(ROOT, 'src', 'data', 'bibles');
const DATA_DIR = path.join(ROOT, 'src', 'data');

const VERSE_RE = /^(.+?)\s+(\d+):(\d+)\t(.+)$/;

function parseRawFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const header = { code: lines[0]?.trim(), attribution: lines[1]?.trim() };
  const verses = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const m = line.match(VERSE_RE);
    if (!m) continue;
    verses.push({
      book: m[1].trim(),
      chapter: parseInt(m[2], 10),
      verse: parseInt(m[3], 10),
      text: m[4].trim(),
    });
  }
  return { header, verses };
}

function groupChapters(verses, version) {
  const chapters = new Map();
  for (const v of verses) {
    const key = `${v.book}\t${v.chapter}`;
    if (!chapters.has(key)) {
      chapters.set(key, { book: v.book, chapter: v.chapter, verses: [] });
    }
    chapters.get(key).verses.push({ n: v.verse, text: v.text });
  }
  for (const ch of chapters.values()) {
    ch.verses.sort((a, b) => a.n - b.n);
    ch.bookSlug = bookToSlug(ch.book);
    ch.testament = getTestament(ch.book);
    ch.translation = version.id;
    ch.translationLabel = version.label;
    ch.routeSlug = version.routeSlug;
  }
  return chapters;
}

function verseId(versionId, bookSlug, chapter, verse) {
  return `${versionId}:${bookSlug}:${chapter}:${verse}`;
}

function writeChapterFiles(versionId, chapters) {
  const base = path.join(CONTENT_DIR, versionId);
  for (const ch of chapters.values()) {
    const dir = path.join(base, ch.bookSlug);
    fs.mkdirSync(dir, { recursive: true });
    writeAtomic(
      path.join(dir, `${ch.chapter}.json`),
      JSON.stringify({
        book: ch.book,
        bookSlug: ch.bookSlug,
        chapter: ch.chapter,
        testament: ch.testament,
        translation: ch.translation,
        translationLabel: ch.translationLabel,
        routeSlug: ch.routeSlug,
        verses: ch.verses,
      }),
    );
  }
}

function buildVersePools(parsedVerses, header) {
  const flat = [];
  const otOnly = [];
  for (const v of parsedVerses) {
    const ref = `${v.book} ${v.chapter}:${v.verse}`;
    const line = `${ref}\t${v.text}`;
    flat.push(line);
    if (getTestament(v.book) === 'ot') otOnly.push(line);
  }
  return { all: flat, ot: otOnly, meta: header };
}

function buildVerseDocuments(version, parsedVerses) {
  return parsedVerses.map((v) => {
    const bookSlug = bookToSlug(v.book);
    const id = verseId(version.id, bookSlug, v.chapter, v.verse);
    const ref = `${v.book} ${v.chapter}:${v.verse}`;
    return {
      id,
      ref,
      book: v.book,
      bookSlug,
      chapter: v.chapter,
      verse: v.verse,
      testament: getTestament(v.book),
      translation: version.id,
      text: v.text,
      textNormalized: normalizeText(v.text),
      tokens: tokenize(v.text),
      url: `/${version.routeSlug}/read/#${bookSlug}-${v.chapter}-v${v.verse}`,
      topics: [],
    };
  });
}

async function main() {
  console.log('📖 Parsing Bibles...\n');
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const allPools = [];
  const manifest = { versions: {}, parsedAt: new Date().toISOString() };

  for (const version of Object.values(VERSIONS)) {
    const rawPath = path.join(RAW_DIR, version.rawFile);
    if (!fs.existsSync(rawPath)) {
      console.error(`Missing ${rawPath}`);
      process.exit(1);
    }
    const { header, verses } = parseRawFile(rawPath);
    console.log(`   ${version.label}: ${verses.length} verses`);

    const chapters = groupChapters(verses, version);
    writeChapterFiles(version.id, chapters);

    const docs = buildVerseDocuments(version, verses);
    const jsonlPath = path.join(DATA_DIR, 'search', `verses-${version.id}.jsonl`);
    fs.mkdirSync(path.dirname(jsonlPath), { recursive: true });
    writeAtomic(jsonlPath, docs.map((d) => JSON.stringify(d)).join('\n'));

    const pools = buildVersePools(verses, header);
    if (version.id === 'kjv') {
      writeAtomic(path.join(DATA_DIR, 'verses-kjv-ot.json'), JSON.stringify(pools.ot));
    }
    writeAtomic(path.join(DATA_DIR, `verses-${version.id}.json`), JSON.stringify(pools.all));

    const bookSet = new Set(verses.map((v) => v.book));
    manifest.versions[version.id] = {
      label: version.label,
      routeSlug: version.routeSlug,
      verseCount: verses.length,
      chapterCount: chapters.size,
      bookCount: bookSet.size,
      attribution: header.attribution,
      books: [...bookSet],
    };
  }

  const combined = [];
  for (const id of ['kjv', 'web', 'webster']) {
    const p = path.join(DATA_DIR, `verses-${id}.json`);
    if (fs.existsSync(p)) combined.push(...JSON.parse(fs.readFileSync(p, 'utf8')));
  }
  writeAtomic(path.join(DATA_DIR, 'verses-all.json'), JSON.stringify(combined));

  const poolsDir = path.join(ROOT, 'public', 'blessings', 'pools');
  fs.mkdirSync(poolsDir, { recursive: true });
  writeAtomic(path.join(poolsDir, 'all.json'), JSON.stringify(combined));
  writeAtomic(
    path.join(poolsDir, 'kjv-ot.json'),
    fs.readFileSync(path.join(DATA_DIR, 'verses-kjv-ot.json'), 'utf8'),
  );
  writeAtomic(
    path.join(poolsDir, 'web.json'),
    fs.readFileSync(path.join(DATA_DIR, 'verses-web.json'), 'utf8'),
  );
  writeAtomic(
    path.join(poolsDir, 'webster.json'),
    fs.readFileSync(path.join(DATA_DIR, 'verses-webster.json'), 'utf8'),
  );

  writeAtomic(path.join(DATA_DIR, 'bible-manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('\n✅ Parse complete.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
