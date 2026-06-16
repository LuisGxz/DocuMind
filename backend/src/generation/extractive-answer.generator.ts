import {
  AnswerEvent,
  AnswerGenerator,
  AnswerInput,
  Citation,
  DocumentSummary,
  NO_CONTEXT_ANSWER,
  RELEVANCE_FLOOR,
  RetrievedChunk,
  SummaryInput,
} from './answer-generator';
import {
  clampQuote,
  extractKeywords,
  keywordOverlap,
  splitSentences,
} from './text.util';

/** How many top chunks to mine for quotable sentences. */
const SCAN_CHUNKS = 5;
/** How many cited passages to compose into the answer. */
const MAX_CITATIONS = 3;
/** Per-token pacing for the typing effect (ms). 0 in tests via the `compose` path. */
const STREAM_DELAY_MS = 12;

interface Pick {
  chunk: RetrievedChunk;
  sentence: string;
  score: number;
}

/**
 * Deterministic, key-free answer generator. It never invents text: every answer
 * is stitched from sentences that actually appear in the retrieved chunks, each
 * tagged with a `(§ p. N)` citation that maps back to its exact source chunk.
 * The embedding retrieval already did the semantic work; this layer selects the
 * most on-topic sentences and presents them honestly (RF-05).
 */
export class ExtractiveAnswerGenerator implements AnswerGenerator {
  readonly mode = 'extractive' as const;

  /**
   * Pure, synchronous core — composes the full answer + citations. Tested
   * directly so the streaming/timing wrapper stays untested noise.
   */
  compose(input: AnswerInput): { answer: string; citations: Citation[] } {
    const relevant = input.context.filter((c) => c.score >= RELEVANCE_FLOOR);
    if (relevant.length === 0) {
      return { answer: NO_CONTEXT_ANSWER, citations: [] };
    }

    const keywords = extractKeywords(input.question);
    const picks = this.selectPassages(relevant, keywords);
    if (picks.length === 0) {
      return { answer: NO_CONTEXT_ANSWER, citations: [] };
    }

    const citations: Citation[] = picks.map((p) => ({
      chunkId: p.chunk.id,
      page: p.chunk.page,
      quote: clampQuote(p.sentence),
    }));

    const lead =
      picks.length === 1
        ? 'Based on the document:'
        : 'Based on the document, here is what is relevant:';
    const body = picks
      .map((p) => `“${clampQuote(p.sentence)}” (§ p. ${p.chunk.page})`)
      .join(' ');

    return { answer: `${lead} ${body}`, citations };
  }

  async *generate(input: AnswerInput): AsyncIterable<AnswerEvent> {
    const { answer, citations } = this.compose(input);
    // Stream word-by-word for the typing effect; the frontend renders as it arrives.
    const tokens = answer.match(/\S+\s*/g) ?? [answer];
    for (const token of tokens) {
      yield { type: 'token', text: token };
      if (STREAM_DELAY_MS > 0) await sleep(STREAM_DELAY_MS);
    }
    yield { type: 'sources', citations };
  }

  summarize(input: SummaryInput): Promise<DocumentSummary> {
    return Promise.resolve(this.summarizeExtractive(input));
  }

  /**
   * Extractive summary: score every sentence by how many of the document's most
   * frequent content words it carries (a TextRank-lite proxy), then keep the
   * highest-signal sentences in their original order. Spanish is left to the
   * Claude path — a faithful translation isn't deterministically available here.
   */
  summarizeExtractive(input: SummaryInput): DocumentSummary {
    const sentences: { idx: number; text: string }[] = [];
    let idx = 0;
    for (const chunk of input.chunks) {
      for (const s of splitSentences(chunk.content)) {
        if (s.length >= 40) sentences.push({ idx: idx++, text: s });
      }
    }
    if (sentences.length === 0) {
      return { summary: '', summaryEs: null };
    }

    const freq = new Map<string, number>();
    for (const { text } of sentences) {
      for (const word of contentWords(text)) {
        freq.set(word, (freq.get(word) ?? 0) + 1);
      }
    }

    const ranked = sentences
      .map((s) => {
        const words = contentWords(s.text);
        const raw = words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0);
        return { ...s, score: words.length ? raw / words.length : 0 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .sort((a, b) => a.idx - b.idx);

    const summary = ranked.map((s) => clampQuote(s.text, 300)).join(' ');
    return { summary, summaryEs: null };
  }

  /** One best sentence per top chunk, ranked by keyword overlap then similarity. */
  private selectPassages(chunks: RetrievedChunk[], keywords: string[]): Pick[] {
    const picks: Pick[] = [];
    const seen = new Set<string>();

    for (const chunk of chunks.slice(0, SCAN_CHUNKS)) {
      const sentences = splitSentences(chunk.content);
      let best: Pick | null = null;
      for (const sentence of sentences) {
        const overlap = keywordOverlap(sentence, keywords);
        // Overlap dominates; similarity breaks ties so semantic matches still win.
        const score = overlap * 10 + chunk.score;
        if (!best || score > best.score) {
          best = { chunk, sentence, score };
        }
      }
      if (best) picks.push(best);
    }

    picks.sort((a, b) => b.score - a.score);

    // When the question shares keywords with the corpus, keep only chunks that
    // actually matched at least one. Otherwise fall back to the top semantic hit.
    const hasKeywordMatch = picks.some((p) => p.score >= 10);
    const filtered = hasKeywordMatch
      ? picks.filter((p) => p.score >= 10)
      : picks.slice(0, 1);

    const result: Pick[] = [];
    for (const p of filtered) {
      if (seen.has(p.sentence)) continue;
      seen.add(p.sentence);
      result.push(p);
      if (result.length >= MAX_CITATIONS) break;
    }
    return result;
  }
}

function contentWords(text: string): string[] {
  return extractKeywords(text);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
