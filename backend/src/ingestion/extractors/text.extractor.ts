import { ExtractedDocument, ExtractedPage } from '../types';

const PAGE_BREAK = '\f';
const WORDS_PER_SYNTHETIC_PAGE = 450;

/**
 * Extract pages from plain text / markdown. Honors form-feed (`\f`) page breaks
 * when present (the seed corpus uses them); otherwise paginates by word count so
 * citations still reference a stable page number.
 */
export function extractText(raw: string): ExtractedDocument {
  const text = raw.replace(/\r\n/g, '\n');

  if (text.includes(PAGE_BREAK)) {
    const pages: ExtractedPage[] = text
      .split(PAGE_BREAK)
      .map((t, i) => ({ page: i + 1, text: t.trim() }))
      .filter((p) => p.text.length > 0)
      .map((p, i) => ({ page: i + 1, text: p.text }));
    return { pageCount: pages.length, pages };
  }

  const words = text.split(/\s+/);
  const pages: ExtractedPage[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_SYNTHETIC_PAGE) {
    pages.push({
      page: pages.length + 1,
      text: words.slice(i, i + WORDS_PER_SYNTHETIC_PAGE).join(' '),
    });
  }
  if (pages.length === 0) pages.push({ page: 1, text: text.trim() });
  return { pageCount: pages.length, pages };
}
