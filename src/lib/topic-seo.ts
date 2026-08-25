import fs from 'fs';
import path from 'path';
import { VERSIONS, slugToBook, type VersionId } from './bible-config';
import { loadChapter } from './load-chapter';
import { chapterVersePath, readerPassagePath } from './passage-urls';
import { formatTopicLabel } from './topic-label';

export { formatTopicLabel };

export interface TopicsIndex {
  [topicId: string]: {
    keywords: string[];
    verses: Record<VersionId, string[]>;
  };
}

export function loadTopicsIndex(root: string): TopicsIndex {
  const p = path.join(root, 'public', 'search', 'topics-index.json');
  if (!fs.existsSync(p)) {
    throw new Error(
      'Missing public/search/topics-index.json. Run npm run prebuild (or npm run dev:full / npm run build:fast).',
    );
  }
  return JSON.parse(fs.readFileSync(p, 'utf8')) as TopicsIndex;
}

export function parseVerseRef(ref: string): {
  versionId: VersionId;
  bookSlug: string;
  chapter: number;
  verse: number;
} | null {
  const parts = ref.split(':');
  if (parts.length !== 4) return null;
  const [versionId, bookSlug, chapterStr, verseStr] = parts;
  if (!(versionId in VERSIONS)) return null;
  const chapter = parseInt(chapterStr, 10);
  const verse = parseInt(verseStr, 10);
  if (!bookSlug || !chapter || !verse) return null;
  return { versionId: versionId as VersionId, bookSlug, chapter, verse };
}

export interface TopicVerseExcerpt {
  ref: string;
  text: string;
  bookName: string;
  readerHref: string;
  chapterHref: string;
}

export function buildTopicExcerpts(
  root: string,
  topicId: string,
  topics: TopicsIndex,
  maxVerses = 10,
): TopicVerseExcerpt[] {
  const entry = topics[topicId];
  if (!entry) return [];
  const refs = entry.verses.kjv?.slice(0, maxVerses) ?? [];
  const excerpts: TopicVerseExcerpt[] = [];

  for (const ref of refs) {
    const parsed = parseVerseRef(ref);
    if (!parsed) continue;
    const ch = loadChapter(root, parsed.versionId, parsed.bookSlug, parsed.chapter);
    if (!ch) continue;
    const verse = ch.verses.find((v) => v.n === parsed.verse);
    if (!verse) continue;
    const meta = VERSIONS[parsed.versionId];
    const bookName = slugToBook(parsed.bookSlug);
    excerpts.push({
      ref: `${bookName} ${parsed.chapter}:${parsed.verse}`,
      text: verse.text,
      bookName,
      readerHref: readerPassagePath(
        meta.routeSlug,
        parsed.bookSlug,
        parsed.chapter,
        parsed.verse,
      ),
      chapterHref: chapterVersePath(
        meta.routeSlug,
        parsed.bookSlug,
        parsed.chapter,
        parsed.verse,
      ),
    });
  }
  return excerpts;
}
