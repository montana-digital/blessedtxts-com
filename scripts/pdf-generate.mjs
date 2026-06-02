import fs from 'fs';
import path from 'path';
import {
  drawTranslationHeader,
  drawBookTitle,
  drawChapterTitle,
  drawVerses,
  PDF_THEME,
} from './pdf-theme.mjs';

export async function generatePdf(chapters, label, outPath) {
  const PDFDocument = (await import('pdfkit')).default;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PDF_THEME.margin, size: 'LETTER' });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    drawTranslationHeader(doc, label);

    let lastBook = '';
    for (const ch of chapters) {
      if (ch.book !== lastBook) {
        if (lastBook) doc.addPage();
        drawBookTitle(doc, ch.book);
        lastBook = ch.book;
      }
      drawChapterTitle(doc, ch.book, ch.chapter);
      drawVerses(doc, ch.verses);
      doc.moveDown(0.5);
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}
