/** Shared text helpers for the extractive generator (sentence splitting, keywords). */

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'of',
  'to',
  'in',
  'on',
  'for',
  'with',
  'at',
  'by',
  'from',
  'as',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'their',
  'they',
  'them',
  'what',
  'which',
  'who',
  'whom',
  'whose',
  'when',
  'where',
  'why',
  'how',
  'do',
  'does',
  'did',
  'can',
  'could',
  'will',
  'would',
  'shall',
  'should',
  'may',
  'might',
  'must',
  'have',
  'has',
  'had',
  'i',
  'you',
  'we',
  'he',
  'she',
  'my',
  'your',
  'our',
  'about',
  'into',
  'than',
  'then',
  'there',
  'here',
  'any',
  'all',
  'each',
  'if',
  'so',
  'such',
  'not',
  'no',
  'me',
  'us',
]);

/** Split text into sentences, normalizing whitespace. */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"(§])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Content words from a question: lowercased, stopwords and punctuation removed. */
export function extractKeywords(question: string): string[] {
  const tokens = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const t of tokens) {
    if (STOPWORDS.has(t)) continue;
    if (t.length < 3 && !/\d/.test(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    keywords.push(t);
  }
  return keywords;
}

/**
 * How many question keywords a sentence touches. Matches on a stemmed prefix so
 * "terminate"/"termination"/"terminated" all count toward a "terminate" keyword.
 */
export function keywordOverlap(sentence: string, keywords: string[]): number {
  const haystack = sentence.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    const stem = kw.length > 5 ? kw.slice(0, Math.ceil(kw.length * 0.75)) : kw;
    if (haystack.includes(stem)) hits++;
  }
  return hits;
}

/** Trim a passage to a readable quote length on a word boundary. */
export function clampQuote(text: string, maxChars = 240): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxChars)}…`;
}
