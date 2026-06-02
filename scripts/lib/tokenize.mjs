const STOPWORDS = new Set([
  'the', 'and', 'that', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one',
  'our', 'out', 'day', 'had', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old',
  'see', 'two', 'way', 'who', 'did', 'get', 'let', 'say', 'she', 'too', 'use', 'unto', 'upon',
  'thee', 'thou', 'thy', 'thine', 'ye', 'shall', 'will', 'with', 'from', 'they', 'them', 'their',
  'this', 'these', 'those', 'there', 'then', 'than', 'when', 'where', 'which', 'while', 'into',
  'also', 'even', 'every', 'after', 'before', 'because', 'being', 'both', 'came', 'come', 'doth',
  'hath', 'have', 'hast', 'were', 'been', 'being', 'said', 'saith', 'thus', 'such', 'should',
  'would', 'could', 'might', 'must', 'does', 'done', 'make', 'made', 'many', 'much', 'more',
  'most', 'some', 'same', 'other', 'only', 'over', 'very', 'what', 'well', 'were', 'without',
]);

const SHORT_ALLOW = new Set(['joy', 'sin', 'god', 'son', 'law', 'man', 'men']);

export function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text) {
  const norm = normalizeText(text);
  const tokens = norm.split(' ').filter((w) => {
    if (!w) return false;
    if (SHORT_ALLOW.has(w)) return true;
    if (w.length < 3) return false;
    return !STOPWORDS.has(w);
  });
  return [...new Set(tokens)];
}
