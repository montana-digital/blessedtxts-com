import fs from 'fs';
import path from 'path';
import type { VersionId } from './bible-config';
import type { ChapterData } from './reader-types';

const chapterCache = new Map<string, ChapterData>();

export function loadChapter(
  root: string,
  versionId: VersionId,
  bookSlug: string,
  chapter: number,
): ChapterData | null {
  const key = `${versionId}/${bookSlug}/${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key)!;
  const p = path.join(root, 'public', 'bibles', versionId, bookSlug, `${chapter}.json`);
  if (!fs.existsSync(p)) return null;
  const data = JSON.parse(fs.readFileSync(p, 'utf8')) as ChapterData;
  chapterCache.set(key, data);
  return data;
}
