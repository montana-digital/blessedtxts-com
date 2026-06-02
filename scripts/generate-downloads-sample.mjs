import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VERSIONS } from './bible-books.mjs';
import { generatePdf } from './pdf-generate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'data', 'bibles');
const DL_DIR = path.join(ROOT, 'public', 'downloads');

const SAMPLES = [
  { versionId: 'webster', bookSlug: 'genesis', chapter: 1 },
  { versionId: 'kjv', bookSlug: 'john', chapter: 3 },
];

async function main() {
  for (const { versionId, bookSlug, chapter } of SAMPLES) {
    const v = VERSIONS[versionId];
    if (!v) throw new Error(`Unknown version: ${versionId}`);
    const chPath = path.join(CONTENT_DIR, versionId, bookSlug, `${chapter}.json`);
    const ch = JSON.parse(fs.readFileSync(chPath, 'utf8'));
    const outPath = path.join(DL_DIR, versionId, bookSlug, `${chapter}.pdf`);
    await generatePdf([ch], v.label, outPath);
    console.log(`✓ ${outPath}`);
  }

  console.log('\nSample PDFs generated.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
