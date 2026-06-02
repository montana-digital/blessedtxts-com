import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VERSIONS } from './bible-books.mjs';
import { generatePdf } from './pdf-generate.mjs';
import { SITE } from './pdf-theme.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'data', 'bibles');
const DL_DIR = path.join(ROOT, 'public', 'downloads');

const SKIP_PDF = process.env.SKIP_PDF === '1';
const ONLY_VERSION = process.env.ONLY_VERSION || '';

if (ONLY_VERSION && !VERSIONS[ONLY_VERSION]) {
  console.error(
    `Invalid ONLY_VERSION="${ONLY_VERSION}". Expected one of: ${Object.keys(VERSIONS).join(', ')}`,
  );
  process.exit(1);
}

async function generatePdfWithRetry(chapters, label, outPath, attempts = 8) {
  const tmpPath = `${outPath}.tmp`;
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
      await generatePdf(chapters, label, tmpPath);
      try {
        fs.unlinkSync(outPath);
      } catch {
        /* ignore */
      }
      fs.renameSync(tmpPath, outPath);
      return;
    } catch (err) {
      lastErr = err;
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
      const retryable = err?.code === 'UNKNOWN' || err?.code === 'EBUSY';
      if (i < attempts - 1 && retryable) {
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function formatTxtHeader(label, attribution) {
  return `${label}\n${attribution || ''}\nFree from ${SITE}\n\n`;
}

function chapterToTxt(ch, label, attribution) {
  let out = formatTxtHeader(label, attribution);
  for (const v of ch.verses) {
    out += `${ch.book} ${ch.chapter}:${v.n}\t${v.text}\n`;
  }
  return out;
}

function chapterToMd(ch, label) {
  let out = `# ${label}\n\n*Free from [blessedtxts.com](${SITE})*\n\n## ${ch.book}\n\n### Chapter ${ch.chapter}\n\n`;
  for (const v of ch.verses) {
    out += `${v.n}. ${v.text}\n\n`;
  }
  return out;
}

function loadAllChapters(versionId) {
  const base = path.join(CONTENT_DIR, versionId);
  const chapters = [];
  const books = fs.readdirSync(base);
  for (const bookSlug of books) {
    const bookDir = path.join(base, bookSlug);
    if (!fs.statSync(bookDir).isDirectory()) continue;
    const files = fs.readdirSync(bookDir).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      chapters.push(JSON.parse(fs.readFileSync(path.join(bookDir, f), 'utf8')));
    }
  }
  chapters.sort((a, b) => {
    if (a.book !== b.book) return a.book.localeCompare(b.book);
    return a.chapter - b.chapter;
  });
  return chapters;
}

async function main() {
  console.log('📥 Generating downloads...\n');
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'bible-manifest.json'), 'utf8'));
  const versions = Object.values(VERSIONS).filter(
    (v) => !ONLY_VERSION || v.id === ONLY_VERSION,
  );
  for (const v of versions) {
    const meta = manifest.versions[v.id];
    const chapters = loadAllChapters(v.id);
    const outBase = path.join(DL_DIR, v.id);
    fs.mkdirSync(outBase, { recursive: true });

    let fullTxt = formatTxtHeader(v.label, meta.attribution);
    let fullMd = `# ${v.label}\n\n*Free from [blessedtxts.com](${SITE})*\n\n`;

    const byBook = new Map();
    for (const ch of chapters) {
      if (!byBook.has(ch.bookSlug)) byBook.set(ch.bookSlug, []);
      byBook.get(ch.bookSlug).push(ch);

      const chDir = path.join(outBase, ch.bookSlug);
      fs.mkdirSync(chDir, { recursive: true });
      const baseName = String(ch.chapter);
      fs.writeFileSync(path.join(chDir, `${baseName}.txt`), chapterToTxt(ch, v.label, meta.attribution));
      fs.writeFileSync(path.join(chDir, `${baseName}.md`), chapterToMd(ch, v.label));

      for (const verse of ch.verses) {
        fullTxt += `${ch.book} ${ch.chapter}:${verse.n}\t${verse.text}\n`;
      }
      fullMd += `## ${ch.book}\n\n### Chapter ${ch.chapter}\n\n`;
      for (const verse of ch.verses) {
        fullMd += `${verse.n}. ${verse.text}\n\n`;
      }

      if (!SKIP_PDF) {
        await generatePdfWithRetry([ch], v.label, path.join(chDir, `${baseName}.pdf`));
      }
    }

    fs.writeFileSync(path.join(outBase, 'full.txt'), fullTxt);
    fs.writeFileSync(path.join(outBase, 'full.md'), fullMd);

    for (const [bookSlug, bookChapters] of byBook) {
      let bookTxt = formatTxtHeader(v.label, meta.attribution);
      let bookMd = `# ${v.label}\n\n## ${bookChapters[0].book}\n\n`;
      for (const ch of bookChapters) {
        for (const verse of ch.verses) {
          bookTxt += `${ch.book} ${ch.chapter}:${verse.n}\t${verse.text}\n`;
        }
        bookMd += `### Chapter ${ch.chapter}\n\n`;
        for (const verse of ch.verses) {
          bookMd += `${verse.n}. ${verse.text}\n\n`;
        }
      }
      fs.writeFileSync(path.join(outBase, `${bookSlug}.txt`), bookTxt);
      fs.writeFileSync(path.join(outBase, `${bookSlug}.md`), bookMd);
      if (!SKIP_PDF) {
        await generatePdfWithRetry(bookChapters, v.label, path.join(outBase, `${bookSlug}.pdf`));
      }
    }

    if (!SKIP_PDF) {
      console.log(`   PDF ${v.label}: ${chapters.length} chapters...`);
      await generatePdfWithRetry(chapters, v.label, path.join(outBase, 'full.pdf'));
    }
    console.log(`   ✓ ${v.label}: TXT/MD${SKIP_PDF ? '' : ' + PDF'}`);
  }

  console.log('\n✅ Downloads generated.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
