import fs from 'fs';
import path from 'path';
import type { VersionId } from './bible-config';
import type { ReaderManifest } from './reader-types';

const ROOT = path.join(process.cwd(), 'src', 'data', 'bibles');
const VERSION_IDS: VersionId[] = ['kjv', 'web', 'webster'];

export function loadVersionManifest(versionId: VersionId): ReaderManifest {
  const p = path.join(process.cwd(), 'public', 'bibles', `manifest-${versionId}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`Missing ${p}. Run npm run prebuild before building pages.`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8')) as ReaderManifest;
}

export function listBooks(versionId: VersionId): string[] {
  const base = path.join(ROOT, versionId);
  return fs.readdirSync(base).filter((d) => fs.statSync(path.join(base, d)).isDirectory());
}

export function getAllChapterPaths(): { params: { version: string; book: string; chapter: string } }[] {
  const paths: { params: { version: string; book: string; chapter: string } }[] = [];
  for (const versionId of VERSION_IDS) {
    const manifest = loadVersionManifest(versionId);
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
    const manifest = loadVersionManifest(versionId);
    for (const book of manifest.books) {
      paths.push({ params: { version: manifest.routeSlug, book: book.slug } });
    }
  }
  return paths;
}
