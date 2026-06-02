const SITE = 'blessedtxts.com';
const CANVAS_WIDTH = 1080;
const PADDING = 72;
const BG = '#0a192f';
const TEXT_COLOR = '#fffef7';
const GOLD = '#d4af37';
const TRANSLATION_FONT = `600 32px Georgia, 'Times New Roman', serif`;
const REF_FONT = `600 36px Georgia, 'Times New Roman', serif`;
const BODY_FONT_FAMILY = `Georgia, 'Times New Roman', serif`;

export interface VerseImageInput {
  ref: string;
  text: string;
  translationLabel: string;
  bookSlug: string;
  chapter: number;
  verse: number;
}

export function buildVerseShareText(
  ref: string,
  text: string,
  translationLabel: string,
): string {
  return `"${text}" — ${ref} (${translationLabel})`;
}

export function buildVerseImageFilename(bookSlug: string, chapter: number, verse: number): string {
  return `${bookSlug}-${chapter}-${verse}-${SITE}.png`;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function headerLineCount(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number,
): number {
  ctx.font = font;
  return wrapLines(ctx, text, maxWidth).length;
}

function drawWrappedHeader(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  x: number,
  startY: number,
): number {
  ctx.font = font;
  let y = startY;
  for (const line of wrapLines(ctx, text, maxWidth)) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

interface LayoutMetrics {
  bodySize: number;
  height: number;
  translationLines: number;
  refLines: number;
  bodyLines: number;
}

function computeLayout(ctx: CanvasRenderingContext2D, input: VerseImageInput): LayoutMetrics {
  const maxTextWidth = CANVAS_WIDTH - PADDING * 2;
  let bodySize = 42;

  while (bodySize >= 28) {
    ctx.font = `${bodySize}px ${BODY_FONT_FAMILY}`;
    const translationLines = headerLineCount(ctx, input.translationLabel, TRANSLATION_FONT, maxTextWidth);
    const refLines = headerLineCount(ctx, input.ref, REF_FONT, maxTextWidth);
    const bodyLines = wrapLines(ctx, input.text, maxTextWidth).length;

    const height =
      PADDING +
      translationLines * 38 +
      8 +
      refLines * 42 +
      16 +
      bodyLines * (bodySize * 1.45) +
      80 +
      PADDING;

    if (height <= 1920) {
      return { bodySize, height, translationLines, refLines, bodyLines };
    }
    bodySize -= 4;
  }

  ctx.font = `28px ${BODY_FONT_FAMILY}`;
  return {
    bodySize: 28,
    height: Math.max(
      PADDING +
        headerLineCount(ctx, input.translationLabel, TRANSLATION_FONT, maxTextWidth) * 38 +
        8 +
        headerLineCount(ctx, input.ref, REF_FONT, maxTextWidth) * 42 +
        16 +
        wrapLines(ctx, input.text, maxTextWidth).length * (28 * 1.45) +
        80 +
        PADDING,
      480,
    ),
    translationLines: headerLineCount(ctx, input.translationLabel, TRANSLATION_FONT, maxTextWidth),
    refLines: headerLineCount(ctx, input.ref, REF_FONT, maxTextWidth),
    bodyLines: wrapLines(ctx, input.text, maxTextWidth).length,
  };
}

export function measureVerseImageHeight(input: VerseImageInput): number {
  if (typeof document === 'undefined') return 800;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 800;
  return computeLayout(ctx, input).height;
}

export async function renderVerseImageCanvas(input: VerseImageInput): Promise<HTMLCanvasElement> {
  if (typeof document === 'undefined') {
    throw new Error('Canvas rendering requires a browser document');
  }

  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const maxTextWidth = CANVAS_WIDTH - PADDING * 2;
  const { bodySize, height } = computeLayout(ctx, input);

  canvas.width = CANVAS_WIDTH;
  canvas.height = height;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  ctx.fillStyle = GOLD;
  let y = drawWrappedHeader(ctx, input.translationLabel, TRANSLATION_FONT, maxTextWidth, 38, PADDING, PADDING + 28);
  y += 8;
  y = drawWrappedHeader(ctx, input.ref, REF_FONT, maxTextWidth, 42, PADDING, y + 10);
  y += 16;

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `${bodySize}px ${BODY_FONT_FAMILY}`;
  const lineHeight = bodySize * 1.45;
  for (const line of wrapLines(ctx, input.text, maxTextWidth)) {
    ctx.fillText(line, PADDING, y + bodySize);
    y += lineHeight;
  }

  y += 40;
  ctx.fillStyle = 'rgba(255, 254, 247, 0.55)';
  ctx.font = `500 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillText(SITE, PADDING, y + 24);

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create image'))),
      'image/png',
    );
  });
}

export function triggerImageDownload(filename: string, blob: Blob): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadVerseImage(input: VerseImageInput): Promise<void> {
  const canvas = await renderVerseImageCanvas(input);
  const blob = await canvasToBlob(canvas);
  triggerImageDownload(buildVerseImageFilename(input.bookSlug, input.chapter, input.verse), blob);
}
