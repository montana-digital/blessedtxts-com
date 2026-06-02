import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VERSIONS, OT_BOOKS, NT_BOOKS, bookToSlug, slugToBook } from './bible-books.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'data', 'bibles');
const OUT = path.join(ROOT, 'public', 'bibles');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else if (name.endsWith('.json')) {
      fs.copyFileSync(s, d);
    }
  }
}

function buildManifest(versionId, routeSlug) {
  const base = path.join(SRC, versionId);
  const contentSlugs = fs.readdirSync(base).filter((d) =>
    fs.statSync(path.join(base, d)).isDirectory(),
  );
  const ordered = [...OT_BOOKS, ...NT_BOOKS]
    .map((name) => ({ name, slug: bookToSlug(name) }))
    .filter((b) => contentSlugs.includes(b.slug));

  for (const slug of contentSlugs) {
    if (!ordered.some((b) => b.slug === slug)) {
      ordered.push({ name: slugToBook(slug), slug });
    }
  }

  const books = ordered.map(({ name, slug }) => {
    const dir = path.join(base, slug);
    const chapters = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => parseInt(f.replace('.json', ''), 10))
      .sort((a, b) => a - b);
    return {
      slug,
      name,
      testament: OT_BOOKS.includes(name) ? 'ot' : 'nt',
      chapters,
    };
  });

  return { versionId, routeSlug, books };
}

function main() {
  console.log('📚 Copying chapter JSON to public/bibles...\n');
  fs.mkdirSync(OUT, { recursive: true });

  for (const v of Object.values(VERSIONS)) {
    const src = path.join(SRC, v.id);
    const dest = path.join(OUT, v.id);
    if (!fs.existsSync(src)) {
      console.error(`Missing ${src}`);
      process.exit(1);
    }
    copyDir(src, dest);
    const manifest = buildManifest(v.id, v.routeSlug);
    fs.writeFileSync(
      path.join(OUT, `manifest-${v.id}.json`),
      JSON.stringify(manifest),
    );
    console.log(`   ${v.label}: ${manifest.books.length} books`);
  }
  console.log('\n✅ Public Bible JSON ready.\n');
}

main();
