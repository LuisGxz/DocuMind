import { Chunk, ExtractedPage } from './types';

export interface ChunkOptions {
  /** Target chunk size in approximate tokens (whitespace-delimited words). */
  targetTokens: number;
  /** Overlap between consecutive chunks in the same page, in tokens. */
  overlapTokens: number;
}

export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  targetTokens: 220,
  overlapTokens: 40,
};

/**
 * Token count is approximated by whitespace word count. This is intentionally
 * a heuristic — the real Claude tokenizer differs — but it keeps chunking
 * dependency-free and good enough to bound chunk size for retrieval.
 */
export function approxTokenCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Split extracted pages into overlapping chunks, **preserving page boundaries**
 * so every chunk maps to exactly one source page (citations stay page-accurate).
 * A page shorter than the target becomes a single chunk; longer pages are split
 * on sentence boundaries with a sliding overlap window.
 */
export function chunkPages(
  pages: ExtractedPage[],
  options: ChunkOptions = DEFAULT_CHUNK_OPTIONS,
): Chunk[] {
  const { targetTokens, overlapTokens } = options;
  const chunks: Chunk[] = [];
  let idx = 0;

  for (const { page, text } of pages) {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) continue;

    const sentences = splitSentences(normalized);
    let current: string[] = [];
    let currentTokens = 0;

    const flush = () => {
      if (current.length === 0) return;
      const content = current.join(' ').trim();
      chunks.push({
        idx: idx++,
        page,
        content,
        tokenCount: approxTokenCount(content),
      });
    };

    for (const sentence of sentences) {
      const sentenceTokens = approxTokenCount(sentence);

      // A single sentence larger than the target becomes its own chunk(s).
      if (sentenceTokens > targetTokens) {
        flush();
        current = [];
        currentTokens = 0;
        for (const part of splitLongSentence(sentence, targetTokens)) {
          chunks.push({
            idx: idx++,
            page,
            content: part,
            tokenCount: approxTokenCount(part),
          });
        }
        continue;
      }

      if (currentTokens + sentenceTokens > targetTokens && current.length > 0) {
        flush();
        // Carry an overlap tail into the next chunk for context continuity.
        const tail = takeTail(current, overlapTokens);
        current = [...tail];
        currentTokens = approxTokenCount(current.join(' '));
      }

      current.push(sentence);
      currentTokens += sentenceTokens;
    }

    flush();
  }

  return chunks;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"(§])|\n{2,}/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function splitLongSentence(sentence: string, targetTokens: number): string[] {
  const words = sentence.split(/\s+/);
  const parts: string[] = [];
  for (let i = 0; i < words.length; i += targetTokens) {
    parts.push(words.slice(i, i + targetTokens).join(' '));
  }
  return parts;
}

function takeTail(sentences: string[], overlapTokens: number): string[] {
  const tail: string[] = [];
  let tokens = 0;
  for (let i = sentences.length - 1; i >= 0; i--) {
    const t = approxTokenCount(sentences[i]);
    if (tokens + t > overlapTokens && tail.length > 0) break;
    tail.unshift(sentences[i]);
    tokens += t;
  }
  return tail;
}
