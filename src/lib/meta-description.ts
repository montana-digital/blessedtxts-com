/** Ahrefs / Google-friendly meta description length band. */
export const META_DESC_MIN = 120;
export const META_DESC_MAX = 160;

export function metaDescriptionLength(text: string): number {
  return text.trim().length;
}

export function isMetaDescriptionInRange(text: string): boolean {
  const len = metaDescriptionLength(text);
  return len >= META_DESC_MIN && len <= META_DESC_MAX;
}

/** Truncate on a word boundary for dynamic templates (e.g. topic pages). */
export function truncateMetaDescription(text: string, max = META_DESC_MAX): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > META_DESC_MIN ? slice.slice(0, lastSpace) : slice).trimEnd() + '…';
}

export function assertMetaDescriptionInRange(text: string, label: string): void {
  const len = metaDescriptionLength(text);
  if (len < META_DESC_MIN || len > META_DESC_MAX) {
    throw new Error(
      `Meta description for "${label}" is ${len} chars (expected ${META_DESC_MIN}–${META_DESC_MAX}): ${text}`,
    );
  }
}
