import fs from 'fs';
import path from 'path';
import type { VersionId } from './bible-config';

export interface Verse {
  n: number;
  text: string;
}

export interface ChapterData {
  book: string;
  bookSlug: string;
  chapter: number;
  testament: string;
  translation: string;
  translationLabel: string;
  routeSlug: string;
  verses: Verse[];
}

const ROOT = path.join(process.cwd(), 'src', 'data', 'bibles');
const VERSION_IDS: VersionId[] = ['kjv', 'web', 'webster'];

interface PublicBookManifest {
  routeSlug: string;
  books: { slug: string; chapters: number[] }[];
}

function loadPublicManifest(versionId: VersionId): PublicBookManifest {
  const p = path.join(process.cwd(), 'public', 'bibles', `manifest-${versionId}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function loadChapter(versionId: VersionId, bookSlug: string, chapter: number): ChapterData {
  const p = path.join(ROOT, versionId, bookSlug, `${chapter}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function listBooks(versionId: VersionId): string[] {
  const base = path.join(ROOT, versionId);
  return fs.readdirSync(base).filter((d) => fs.statSync(path.join(base, d)).isDirectory());
}

export function listChapters(versionId: VersionId, bookSlug: string): number[] {
  const dir = path.join(ROOT, versionId, bookSlug);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => parseInt(f.replace('.json', ''), 10))
    .sort((a, b) => a - b);
}

export function getAllChapterPaths(): { params: { version: string; book: string; chapter: string } }[] {
  const paths: { params: { version: string; book: string; chapter: string } }[] = [];
  for (const versionId of VERSION_IDS) {
    const manifest = loadPublicManifest(versionId);
    for (const book of manifest.books) {
      for (const ch of book.chapters) {
        paths.push({
          params: {
            version: manifest.routeSlug,
            book: book.slug,
            chapter: String(ch),
          },
        });
      }
    }
  }
  return paths;
}

export function getAllBookPaths(): { params: { version: string; book: string } }[] {
  const paths: { params: { version: string; book: string } }[] = [];
  for (const versionId of VERSION_IDS) {
    const manifest = loadPublicManifest(versionId);
    for (const book of manifest.books) {
      paths.push({ params: { version: manifest.routeSlug, book: book.slug } });
    }
  }
  return paths;
}
