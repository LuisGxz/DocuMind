import { Citation } from '../../core/models';

export interface Segment {
  text: string;
  cited: boolean;
  hot: boolean;
  chunkId?: string;
}

/**
 * Splits a page's text into plain and highlighted segments so cited passages can
 * be marked inline (and the active one emphasised). Quotes are exact substrings
 * of the indexed chunk text; we tolerate a trailing ellipsis from clamped quotes.
 */
export function highlightPage(
  text: string,
  citations: Citation[],
  activeChunkId: string | null,
): Segment[] {
  const matches: { start: number; end: number; chunkId: string }[] = [];

  for (const c of citations) {
    const needle = c.quote.replace(/[…]+$/, '').trim();
    if (needle.length < 4) continue;
    const start = text.indexOf(needle);
    if (start === -1) continue;
    matches.push({ start, end: start + needle.length, chunkId: c.chunkId });
  }

  matches.sort((a, b) => a.start - b.start);

  // Drop overlaps, keeping the earliest match.
  const clean: typeof matches = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue;
    clean.push(m);
    cursor = m.end;
  }

  if (clean.length === 0) return [{ text, cited: false, hot: false }];

  const segments: Segment[] = [];
  let pos = 0;
  for (const m of clean) {
    if (m.start > pos) segments.push({ text: text.slice(pos, m.start), cited: false, hot: false });
    segments.push({
      text: text.slice(m.start, m.end),
      cited: true,
      hot: m.chunkId === activeChunkId,
      chunkId: m.chunkId,
    });
    pos = m.end;
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), cited: false, hot: false });
  return segments;
}
