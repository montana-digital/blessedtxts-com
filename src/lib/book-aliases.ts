import canon from '../../data/canon.json';

/** Common abbreviations → canonical book name (client + server) */
export const BOOK_ALIASES: Record<string, string> = canon.aliases;

export function resolveBookAlias(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
  if (BOOK_ALIASES[key]) return BOOK_ALIASES[key];
  const titled = name.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return titled.replace(/^(\d+)\s*/, (_, n) => `${n} `).replace(/\s+/g, ' ').trim();
}
