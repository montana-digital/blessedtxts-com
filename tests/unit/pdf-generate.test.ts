import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { generatePdf } from '../../scripts/pdf-generate.mjs';

const fixtureChapter = {
  book: 'Genesis',
  bookSlug: 'genesis',
  chapter: 1,
  verses: [
    { n: 1, text: 'In the beginning God created the heaven and the earth.' },
    { n: 2, text: 'And the earth was without form, and void.' },
    { n: 3, text: 'And God said, Let there be light: and there was light.' },
  ],
};

describe('pdf-generate', () => {
  const tempFiles: string[] = [];

  afterEach(() => {
    for (const file of tempFiles) {
      try {
        fs.unlinkSync(file);
      } catch {
        /* ignore */
      }
    }
    tempFiles.length = 0;
  });

  it('generates a non-empty PDF file without throwing', async () => {
    const outPath = path.join(os.tmpdir(), `pdf-test-${Date.now()}.pdf`);
    tempFiles.push(outPath);

    await generatePdf([fixtureChapter], 'Test Bible', outPath);

    expect(fs.existsSync(outPath)).toBe(true);
    const stat = fs.statSync(outPath);
    expect(stat.size).toBeGreaterThan(500);
    const header = fs.readFileSync(outPath).subarray(0, 5).toString('latin1');
    expect(header.startsWith('%PDF')).toBe(true);
  });
});
