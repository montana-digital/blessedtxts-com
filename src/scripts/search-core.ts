import MiniSearch from 'minisearch';
import { bookToSlug } from '../lib/bible-config';
import { fetchJson, withOfflinePrefix } from '../lib/fetch-json';
import { formatTopicLabel } from '../lib/topic-label';
import { parseReferenceQuery, refKeyFromParsed } from '../lib/reference-parse';

const MINI_SEARCH_OPTIONS = {
  fields: ['ref', 'book', 'text'],
  storeFields: ['id', 'ref', 'bookSlug', 'chapter', 'verse'],
  searchOptions: { boost: { ref: 3, book: 2 }, fuzzy: 0.2, prefix: true },
};

export interface VerseHit {
  id: string;
  ref: string;
  text: string;
  url: string;
  bookSlug?: string;
  chapter?: number;
  verse?: number;
}

export interface TopicEntry {
  keywords: string[];
  verses: Record<string, string[]>;
}

export interface SearchResult {
  ok: boolean;
  hits: VerseHit[];
  error?: string;
}

interface KeywordHit {
  id: string;
  ref: string;
  text: string;
}

interface KeywordEntry {
  count: number;
  hits: KeywordHit[];
}

interface TranslationManifest {
  label: string;
  routeSlug: string;
  miniSearch: string;
  verseIdMap: string;
  keywords?: {
    shards: string;
    prefixes: string;
  };
}

let manifest: {
  translations: Record<string, TranslationManifest>;
} | null = null;

const verseMaps = new Map<string, Record<string, VerseHit>>();
const miniSearchLoaded = new Map<string, MiniSearch>();
const keywordShards = new Map<string, Record<string, KeywordEntry>>();
let prefixesCache: Record<string, Record<string, string[]>> = {};
let refMapCache: Record<string, Record<string, string>> | null = null;
let synonymsCache: Record<string, string[]> | null = null;
let topicsCache: Record<string, TopicEntry> | null = null;

async function ensureManifest(): Promise<void> {
  if (!manifest) {
    manifest = await fetchJson('/search/retrieval-manifest.json');
  }
}

export function isSingleTokenQuery(q: string): boolean {
  const t = q.trim();
  return t.length >= 2 && t.length <= 32 && /^[a-z0-9'-]+$/i.test(t);
}

/** True only for parsed or compact reference shapes — not bare keywords like "faith". */
export function queryLooksLikeReference(q: string): boolean {
  if (parseReferenceQuery(q)) return true;
  const compact = q.trim().replace(/\s+/g, '');
  if (/^\d?[a-zA-Z.]{2,}\d+:\d+$/i.test(compact)) return true;
  if (/^\d?[a-zA-Z.]{2,}\d+$/i.test(compact)) return true;
  return false;
}

function keywordShardKey(token: string): string {
  const c = token.charAt(0).toLowerCase();
  if (c >= 'a' && c <= 'z') return c;
  if (c >= '0' && c <= '9') return '0';
  return 'other';
}

function keywordHitsToVerseHits(
  hits: KeywordHit[],
  routeSlug: string,
): VerseHit[] {
  return hits.map((h) => {
    const parts = h.id.split(':');
    const bookSlug = parts[1];
    const chapter = parseInt(parts[2], 10);
    const verse = parseInt(parts[3], 10);
    return {
      id: h.id,
      ref: h.ref,
      text: h.text,
      url: `/${routeSlug}/read/#${bookSlug}-${chapter}-v${verse}`,
      bookSlug,
      chapter,
      verse,
    };
  });
}

export async function loadKeywordShard(
  translationId: string,
  token: string,
): Promise<Record<string, KeywordEntry> | null> {
  await ensureManifest();
  const t = manifest!.translations[translationId];
  if (!t?.keywords?.shards) return null;

  const shard = keywordShardKey(token);
  const cacheKey = `${translationId}:${shard}`;
  if (keywordShards.has(cacheKey)) return keywordShards.get(cacheKey)!;

  const url = t.keywords.shards.replace('{shard}', shard);
  try {
    const data = await fetchJson<Record<string, KeywordEntry>>(url);
    keywordShards.set(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

export async function loadKeywordPrefixes(translationId: string): Promise<Record<string, string[]>> {
  if (prefixesCache[translationId]) return prefixesCache[translationId];
  await ensureManifest();
  const t = manifest!.translations[translationId];
  if (!t?.keywords?.prefixes) return {};
  const data = await fetchJson<Record<string, string[]>>(t.keywords.prefixes);
  prefixesCache[translationId] = data;
  return data;
}

export async function loadVerseMap(id: string): Promise<Record<string, VerseHit>> {
  if (verseMaps.has(id)) return verseMaps.get(id)!;
  await ensureManifest();
  const t = manifest!.translations[id];
  if (!t) throw new Error(`Unknown translation: ${id}`);
  const map = await fetchJson<Record<string, VerseHit>>(t.verseIdMap);
  verseMaps.set(id, map);
  return map;
}

export async function loadMiniSearch(id: string): Promise<MiniSearch> {
  if (miniSearchLoaded.has(id)) return miniSearchLoaded.get(id)!;
  await ensureManifest();
  const t = manifest!.translations[id];
  if (!t) throw new Error(`Unknown translation: ${id}`);
  const idxRes = await fetch(t.miniSearch);
  if (!idxRes.ok) throw new Error('Search index could not be loaded.');
  const ms = MiniSearch.loadJSON(await idxRes.text(), MINI_SEARCH_OPTIONS);
  miniSearchLoaded.set(id, ms);
  return ms;
}

async function loadSynonyms(): Promise<Record<string, string[]>> {
  if (!synonymsCache) {
    synonymsCache = await fetchJson('/search/synonyms.json');
  }
  return synonymsCache!;
}

export async function loadTopicsIndex(): Promise<Record<string, TopicEntry>> {
  if (!topicsCache) {
    topicsCache = await fetchJson('/search/topics-index.json');
  }
  return topicsCache!;
}

export function expandSearchTerms(q: string, synonyms: Record<string, string[]>): string[] {
  const terms = new Set<string>([q]);
  const lower = q.toLowerCase().trim();
  if (synonyms[lower]) {
    for (const s of synonyms[lower]) terms.add(s);
  }
  for (const [key, vals] of Object.entries(synonyms)) {
    if (vals.some((v) => v.toLowerCase() === lower)) {
      terms.add(key);
      for (const v of vals) terms.add(v);
    }
  }
  return [...terms];
}

async function tryReferenceHits(
  translationId: string,
  q: string,
  refMap: Record<string, Record<string, string>>,
  map: Record<string, VerseHit>,
): Promise<VerseHit[] | null> {
  const parsed = parseReferenceQuery(q);
  if (parsed) {
    const refKey = refKeyFromParsed(parsed);
    let direct = refMap[refKey]?.[translationId];
    if (!direct && parsed.verse == null) {
      const slug = bookToSlug(parsed.book).replace(/-/g, '');
      direct = refMap[`${slug}:${parsed.chapter}:1`]?.[translationId];
    }
    if (direct && map[direct]) return [map[direct]];
  }

  const legacyKey = q.toLowerCase().replace(/\s+/g, '').replace(/^(\d?\w+)(\d+)(?::(\d+))?/, '$1:$2:$3');
  const legacyDirect = refMap[legacyKey]?.[translationId];
  if (legacyDirect && map[legacyDirect]) return [map[legacyDirect]];

  return null;
}

async function tryKeywordHits(
  translationId: string,
  q: string,
  limit: number,
): Promise<VerseHit[] | null> {
  if (!isSingleTokenQuery(q)) return null;
  await ensureManifest();
  const routeSlug = manifest!.translations[translationId]?.routeSlug ?? '';

  const token = q.toLowerCase().trim();
  const shard = await loadKeywordShard(translationId, token);
  if (shard?.[token]) {
    return keywordHitsToVerseHits(shard[token].hits.slice(0, limit), routeSlug);
  }

  const synonyms = await loadSynonyms();
  const related = expandSearchTerms(token, synonyms).filter((t) => t !== token);
  for (const alt of related.slice(0, 2)) {
    if (!isSingleTokenQuery(alt)) continue;
    const altShard = await loadKeywordShard(translationId, alt);
    if (altShard?.[alt]) {
      return keywordHitsToVerseHits(altShard[alt].hits.slice(0, limit), routeSlug);
    }
  }

  return null;
}

export async function searchVerses(
  translationId: string,
  query: string,
  limit = 50,
): Promise<SearchResult> {
  const q = query.trim();
  if (q.length < 2) return { ok: true, hits: [] };

  try {
    if (!refMapCache) {
      refMapCache = await fetchJson('/search/reference-map.json');
    }
    if (!refMapCache) {
      return { ok: false, hits: [], error: 'Reference map unavailable.' };
    }

    if (queryLooksLikeReference(q)) {
      const map = await loadVerseMap(translationId);
      const refHits = await tryReferenceHits(translationId, q, refMapCache, map);
      if (refHits?.length) return { ok: true, hits: refHits };
    }

    const keywordHits = await tryKeywordHits(translationId, q, limit);
    if (keywordHits?.length) return { ok: true, hits: keywordHits };

    const [ms, map] = await Promise.all([
      loadMiniSearch(translationId),
      loadVerseMap(translationId),
    ]);

    const refHits = await tryReferenceHits(translationId, q, refMapCache, map);
    if (refHits?.length) return { ok: true, hits: refHits };

    const synonyms = await loadSynonyms();
    const terms = expandSearchTerms(q, synonyms);
    const seen = new Set<string>();
    const results: VerseHit[] = [];

    for (const term of terms) {
      const hits = ms.search(term, { fuzzy: 0.15, prefix: true });
      for (const h of hits) {
        if (seen.has(h.id)) continue;
        seen.add(h.id);
        const v = map[h.id];
        if (v) results.push(v);
        if (results.length >= limit) return { ok: true, hits: results };
      }
    }

    return { ok: true, hits: results };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search unavailable.';
    return { ok: false, hits: [], error: withOfflinePrefix(message) };
  }
}

export async function getTopicHits(translationId: string, topicId: string): Promise<SearchResult> {
  try {
    const topics = await loadTopicsIndex();
    const topic = topics[topicId];
    if (!topic) return { ok: true, hits: [] };

    const ids = topic.verses[translationId] || [];
    const map = await loadVerseMap(translationId);
    return { ok: true, hits: ids.map((id) => map[id]).filter(Boolean) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Topics unavailable.';
    return { ok: false, hits: [], error: withOfflinePrefix(message) };
  }
}

export function listTopicIds(topics: Record<string, TopicEntry>): string[] {
  return Object.keys(topics).sort();
}

export { formatTopicLabel };

export function fillSearchHitLink(
  anchor: HTMLAnchorElement,
  hit: Pick<VerseHit, 'ref' | 'text'>,
  translationLabel: string,
  maxLen = 100,
): void {
  const strong = document.createElement('strong');
  strong.textContent = hit.ref;
  anchor.appendChild(strong);
  anchor.appendChild(document.createTextNode(` · ${translationLabel}`));
  anchor.appendChild(document.createElement('br'));
  const preview = hit.text.length > maxLen ? `${hit.text.slice(0, maxLen)}…` : hit.text;
  anchor.appendChild(document.createTextNode(preview));
}

export function hitToAnchor(hit: VerseHit): string {
  if (hit.url.includes('#')) {
    return hit.url.split('#')[1] || '';
  }
  if (hit.bookSlug && hit.chapter != null && hit.verse != null) {
    return `${hit.bookSlug}-${hit.chapter}-v${hit.verse}`;
  }
  const parts = hit.id.split(':');
  if (parts.length >= 4) {
    return `${parts[1]}-${parts[2]}-v${parts[3]}`;
  }
  return '';
}
