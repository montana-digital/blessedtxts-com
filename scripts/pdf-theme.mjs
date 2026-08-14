import { SITE_URL } from '../src/site-url.mjs';

/** PDF styling aligned with reader UI and verse-image.ts palette. */

export const SITE = SITE_URL;

export const PDF_THEME = {
  gold: '#D4AF37',
  text: '#0a0a0a',
  textMuted: '#525252',
  goldRule: '#D4AF37',
  margin: 50,
  translationSize: 18,
  attributionSize: 9,
  bookTitleSize: 16,
  chapterTitleSize: 14,
  verseNumSize: 9,
  verseSize: 10,
  verseSpacing: 0.5,
  lineGap: 2,
};

/** Matches formatChapterHeaderLabel in src/lib/reader-passage-nav.ts */
export function formatChapterHeaderLabel(bookName, chapter) {
  return `${bookName} ${chapter}`;
}

export function versePrefix(verseNumber) {
  return `${verseNumber} `;
}

export function getContentBounds(doc) {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  return { left, width };
}

export function drawTranslationHeader(doc, label, theme = PDF_THEME) {
  const { left, width } = getContentBounds(doc);
  doc
    .font('Times-Bold')
    .fontSize(theme.translationSize)
    .fillColor(theme.gold)
    .text(label, left, doc.y, { width });
  doc.moveDown(0.25);
  doc
    .font('Helvetica')
    .fontSize(theme.attributionSize)
    .fillColor(theme.textMuted)
    .text(`Free from ${SITE}`, left, doc.y, { link: SITE, underline: true, width });
  doc.moveDown(1);
}

export function drawBookTitle(doc, bookName, theme = PDF_THEME) {
  const { left, width } = getContentBounds(doc);
  const y = doc.y;
  doc
    .font('Times-Bold')
    .fontSize(theme.bookTitleSize)
    .fillColor(theme.text)
    .text(bookName, left, y, { width });
  const lineY = doc.y + 4;
  doc
    .strokeColor(theme.goldRule)
    .lineWidth(0.5)
    .moveTo(left, lineY)
    .lineTo(left + width, lineY)
    .stroke();
  doc.moveDown(0.75);
}

export function drawChapterTitle(doc, bookName, chapter, theme = PDF_THEME) {
  const { left, width } = getContentBounds(doc);
  doc
    .font('Times-Bold')
    .fontSize(theme.chapterTitleSize)
    .fillColor(theme.gold)
    .text(formatChapterHeaderLabel(bookName, chapter), left, doc.y, { width });
  doc.moveDown(0.5);
}

/**
 * Renders verses with a fixed left margin per row (avoids PDFKit continued:true drift).
 */
export function drawVerses(doc, verses, theme = PDF_THEME) {
  const { left, width } = getContentBounds(doc);

  for (const v of verses) {
    const y = doc.y;
    const prefix = versePrefix(v.n);

    doc.font('Helvetica-Bold').fontSize(theme.verseNumSize).fillColor(theme.gold);
    const prefixWidth = doc.widthOfString(prefix);
    doc.text(prefix, left, y, { lineBreak: false });

    doc.font('Times-Roman').fontSize(theme.verseSize).fillColor(theme.text);
    doc.text(v.text, left + prefixWidth, y, {
      width: width - prefixWidth,
      lineGap: theme.lineGap,
      align: 'left',
    });

    doc.x = left;
    doc.moveDown(theme.verseSpacing);
  }
}
