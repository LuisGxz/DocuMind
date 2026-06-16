/**
 * The generation layer behind the RAG chat. Two interchangeable implementations
 * satisfy this contract, chosen at boot by `AppConfig.claudeEnabled`:
 *   - ExtractiveAnswerGenerator (default, key-free, deterministic, grounded)
 *   - ClaudeAnswerGenerator      (real Claude, activated when a key is present)
 * Both stream tokens and emit citations, so the controller's SSE path is identical.
 */

/** A chunk returned by retrieval, with its cosine similarity to the question. */
export interface RetrievedChunk {
  id: string;
  idx: number;
  page: number;
  content: string;
  /** Cosine similarity in [-1, 1]; higher means closer. */
  score: number;
}

/** A snapshot of a passage the answer leaned on, anchored to its source chunk. */
export interface Citation {
  chunkId: string;
  page: number;
  quote: string;
}

/** One prior turn, oldest-first, used to keep the answer on-topic. */
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnswerInput {
  question: string;
  context: RetrievedChunk[];
  history: ConversationTurn[];
}

/** A streamed answer event: incremental text, then the final citation list. */
export type AnswerEvent =
  | { type: 'token'; text: string }
  | { type: 'sources'; citations: Citation[] };

export interface SummaryInput {
  filename: string;
  chunks: { page: number; content: string }[];
}

export interface DocumentSummary {
  summary: string;
  /** Spanish summary when the generator can produce one (Claude); else null. */
  summaryEs: string | null;
}

export interface AnswerGenerator {
  /** Which backend is active — surfaced on /health and useful in logs/tests. */
  readonly mode: 'claude' | 'extractive';

  /** Stream a grounded answer: token events followed by a single sources event. */
  generate(input: AnswerInput): AsyncIterable<AnswerEvent>;

  /** Produce a short document summary for the library/detail view (RF-07). */
  summarize(input: SummaryInput): Promise<DocumentSummary>;
}

/** DI token — resolved to the right implementation by GenerationModule. */
export const ANSWER_GENERATOR = Symbol('ANSWER_GENERATOR');

/**
 * Below this cosine similarity, retrieval found nothing genuinely relevant — the
 * generator says so honestly instead of quoting a weak match (RF-05: no hallucination).
 */
export const RELEVANCE_FLOOR = 0.25;

/** Honest fallback when the document doesn't cover the question. */
export const NO_CONTEXT_ANSWER =
  "I couldn't find anything in this document that answers that. " +
  'Try rephrasing your question, or ask about a topic the document actually covers.';
