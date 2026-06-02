import type { ChapterData } from './reader-types';

const SITE = 'https://blessedtxts.com';

export function buildChapterTxt(ch: ChapterData): string {
  let content = `${ch.translationLabel}\nFree from ${SITE}\n\n`;
  for (const v of ch.verses) {
    content += `${ch.book} ${ch.chapter}:${v.n}\t${v.text}\n`;
  }
  return content;
}

export function buildChapterMd(ch: ChapterData): string {
  let content = `# ${ch.translationLabel}\n\n*Free from [blessedtxts.com](${SITE})*\n\n### ${ch.book} ${ch.chapter}\n\n`;
  for (const v of ch.verses) {
    content += `${v.n}. ${v.text}\n\n`;
  }
  return content;
}

export function triggerDownload(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
