import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MiniSearch from 'minisearch';
import { VERSIONS } from './bible-books.mjs';
import { bookToSlug } from './bible-books.mjs';
import { writeAtomic } from './lib/write-atomic.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const SEARCH_DIR = path.join(DATA_DIR, 'search');
const PUBLIC_SEARCH = path.join(ROOT, 'public', 'search');

const KEYWORD_DISPLAY_CAP = 50;
const TEXT_PREVIEW_LEN = 120;

function loadVerses(versionId) {
  const p = path.join(DATA_DIR, 'search', `verses-${versionId}.jsonl`);
  return fs.readFileSync(p, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
}

function buildKeywordIndex(docs) {
  const index = {};
  for (const doc of docs) {
    const tokens = doc.tokens || [];
    for (const t of tokens) {
      if (!index[t]) index[t] = { count: 0, hits: [] };
      index[t].count++;
      if (index[t].hits.length < KEYWORD_DISPLAY_CAP) {
        index[t].hits.push({
          id: doc.id,
          ref: doc.ref,
          text: doc.text.slice(0, TEXT_PREVIEW_LEN),
        });
      }
    }
  }
  return index;
}

function shardKeyForToken(token) {
  const c = token.charAt(0).toLowerCase();
  if (c >= 'a' && c <= 'z') return c;
  if (c >= '0' && c <= '9') return '0';
  return 'other';
}

function writeKeywordShards(versionId, keywordIndex) {
  const dir = path.join(PUBLIC_SEARCH, `keywords-${versionId}`);
  fs.mkdirSync(dir, { recursive: true });

  const shards = {};
  for (const [token, entry] of Object.entries(keywordIndex)) {
    const shard = shardKeyForToken(token);
    if (!shards[shard]) shards[shard] = {};
    shards[shard][token] = { count: entry.count, hits: entry.hits };
  }

  for (const [shard, data] of Object.entries(shards)) {
    writeAtomic(path.join(dir, `${shard}.json`), JSON.stringify(data));
  }

  const prefixes = {};
  const tokensByCount = Object.entries(keywordIndex)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 2500)
    .map(([t]) => t);

  for (const token of tokensByCount) {
    for (let len = 2; len <= Math.min(3, token.length); len++) {
      const prefix = token.slice(0, len);
      if (!prefixes[prefix]) prefixes[prefix] = [];
      if (prefixes[prefix].length < 40) prefixes[prefix].push(token);
    }
  }

  writeAtomic(path.join(dir, 'prefixes.json'), JSON.stringify(prefixes));
}

const MINI_SEARCH_OPTIONS = {
  fields: ['ref', 'book', 'text'],
  storeFields: ['id', 'ref', 'bookSlug', 'chapter', 'verse'],
  searchOptions: { boost: { ref: 3, book: 2 }, fuzzy: 0.2, prefix: true },
};

function buildMiniSearch(docs) {
  const ms = new MiniSearch(MINI_SEARCH_OPTIONS);
  const records = docs.map((d) => ({
    id: d.id,
    ref: d.ref,
    book: d.book,
    bookSlug: d.bookSlug,
    chapter: d.chapter,
    verse: d.verse,
    text: d.text,
  }));
  ms.addAll(records);
  return { ms, json: JSON.stringify(ms) };
}

function buildReferenceMap(allDocsByVersion) {
  const map = {};
  for (const [versionId, docs] of Object.entries(allDocsByVersion)) {
    for (const d of docs) {
      const bookKey = d.book.toLowerCase().replace(/\s+/g, '');
      const key = `${bookKey}:${d.chapter}:${d.verse}`;
      if (!map[key]) map[key] = {};
      map[key][versionId] = d.id;
      const slugKey = `${bookToSlug(d.book).replace(/-/g, '')}:${d.chapter}:${d.verse}`;
      if (!map[slugKey]) map[slugKey] = {};
      map[slugKey][versionId] = d.id;
    }
  }
  return map;
}

function buildVerseIdMap(docs) {
  const m = {};
  for (let i = 0; i < docs.length; i++) m[docs[i].id] = docs[i];
  return m;
}

async function main() {
  console.log('🔍 Building search indexes...\n');
  fs.mkdirSync(SEARCH_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_SEARCH, { recursive: true });

  const allDocsByVersion = {};
  const manifest = {
    schemaVersion: 2,
    translations: {},
    shared: {
      referenceMap: '/search/reference-map.json',
      synonyms: '/search/synonyms.json',
      topics: '/search/topics-index.json',
      queryIntents: '/search/query-intents.json',
      chatTemplates: '/search/chat-templates.json',
    },
  };

  const msByVersion = {};
  for (const v of Object.values(VERSIONS)) {
    const docs = loadVerses(v.id);
    allDocsByVersion[v.id] = docs;
    console.log(`   ${v.label}: ${docs.length} documents`);

    const kw = buildKeywordIndex(docs);
    writeKeywordShards(v.id, kw);
    const legacyPath = path.join(PUBLIC_SEARCH, `keywords-${v.id}.json`);
    if (fs.existsSync(legacyPath)) fs.unlinkSync(legacyPath);

    const { ms, json } = buildMiniSearch(docs);
    msByVersion[v.id] = ms;
    const indexPath = path.join(PUBLIC_SEARCH, `index-${v.id}.min.json`);
    writeAtomic(indexPath, json);
    const indexMb = (fs.statSync(indexPath).size / 1024 / 1024).toFixed(2);
    console.log(`      index-${v.id}.min.json: ${indexMb} MB`);

    writeAtomic(
      path.join(PUBLIC_SEARCH, `verse-id-map-${v.id}.json`),
      JSON.stringify(buildVerseIdMap(docs)),
    );
  }

  writeAtomic(
    path.join(PUBLIC_SEARCH, 'reference-map.json'),
    JSON.stringify(buildReferenceMap(allDocsByVersion)),
  );

  for (const v of Object.values(VERSIONS)) {
    manifest.translations[v.id] = {
      label: v.label,
      routeSlug: v.routeSlug,
      miniSearch: `/search/index-${v.id}.min.json`,
      verseIdMap: `/search/verse-id-map-${v.id}.json`,
      keywords: {
        shards: `/search/keywords-${v.id}/{shard}.json`,
        prefixes: `/search/keywords-${v.id}/prefixes.json`,
      },
    };
  }

  const synonyms = {
    love: ['charity', 'lovingkindness', 'beloved'],
    afraid: ['fear', 'troubled', 'dismayed'],
    strength: ['strong', 'courage', 'strengtheneth'],
    peace: ['rest', 'quiet', 'calm'],
    hope: ['trust', 'wait', 'expectation'],
  };
  const queryIntents = [
    { intent: 'reference', pattern: '^([1-3]?\\s?[a-z]+)\\s+(\\d+)(?::(\\d+))?$' },
    { intent: 'topic', pattern: '(?:verses|scripture|bible say).*(?:about|on)\\s+(.+)' },
    { intent: 'keyword', pattern: '^(.+)$' },
  ];
  const chatTemplates = {
    topic: 'Here are scriptures that speak about **{topic}** ({translation}):',
    keyword: 'Verses matching **{query}**:',
    reference: '**{ref}** ({translation}):',
  };

  fs.writeFileSync(path.join(PUBLIC_SEARCH, 'synonyms.json'), JSON.stringify(synonyms));
  fs.writeFileSync(path.join(PUBLIC_SEARCH, 'query-intents.json'), JSON.stringify(queryIntents));
  fs.writeFileSync(path.join(PUBLIC_SEARCH, 'chat-templates.json'), JSON.stringify(chatTemplates));

  const topicsPath = path.join(ROOT, 'data', 'topics', 'topics.yaml');
  const topicsIndex = {};
  if (fs.existsSync(topicsPath)) {
    const yaml = fs.readFileSync(topicsPath, 'utf8');
    const blocks = yaml.split(/\n(?=\w)/);
    for (const block of blocks) {
      const nameMatch = block.match(/^(\w+):/);
      if (!nameMatch) continue;
      const topic = nameMatch[1];
      const kwMatch = block.match(/keywords:\s*\[([^\]]+)\]/);
      const keywords = kwMatch ? kwMatch[1].split(',').map((k) => k.trim()) : [topic];
      topicsIndex[topic] = { keywords, verses: {} };
      for (const vid of Object.keys(VERSIONS)) {
        const ms = msByVersion[vid];
        const hits = ms.search(keywords.join(' '), { prefix: true, fuzzy: 0.15 }).slice(0, 15);
        topicsIndex[topic].verses[vid] = hits.map((h) => h.id);
      }
    }
  } else {
    for (const topic of ['hope', 'love', 'peace', 'faith', 'strength', 'comfort']) {
      topicsIndex[topic] = { keywords: [topic], verses: {} };
      for (const vid of Object.keys(VERSIONS)) {
        const ms = msByVersion[vid];
        topicsIndex[topic].verses[vid] = ms.search(topic, { prefix: true }).slice(0, 10).map((h) => h.id);
      }
    }
  }
  writeAtomic(path.join(PUBLIC_SEARCH, 'topics-index.json'), JSON.stringify(topicsIndex));
  writeAtomic(path.join(PUBLIC_SEARCH, 'retrieval-manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('\n✅ Search indexes built.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
