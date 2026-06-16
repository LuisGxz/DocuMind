import Anthropic from '@anthropic-ai/sdk';
import {
  AnswerEvent,
  AnswerGenerator,
  AnswerInput,
  Citation,
  DocumentSummary,
  RetrievedChunk,
  SummaryInput,
} from './answer-generator';
import { clampQuote } from './text.util';

const ANSWER_SYSTEM = `You are DocuMind, a careful assistant that answers questions strictly from the provided document excerpts.
Rules:
- Use ONLY the information in the excerpts. Never rely on outside knowledge.
- After each claim, cite the page it came from inline as "(§ p. N)" using the page numbers shown.
- If the excerpts do not contain the answer, say so plainly — do not guess or invent.
- Be concise and quote the document's own wording where it helps.`;

const SUMMARY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    summaryEs: { type: 'string' },
  },
  required: ['summary', 'summaryEs'],
} as const;

/**
 * Real Claude-backed generator. Activated only when an `ANTHROPIC_API_KEY` is
 * present (see GenerationModule). Streams tokens via the Messages API and derives
 * citations from the `(§ p. N)` markers Claude emits, mapping each back to the
 * highest-scoring retrieved chunk on that page. The demo runs without a key, so
 * this path stays real-but-dormant — enabling Claude is just setting the env var.
 */
export class ClaudeAnswerGenerator implements AnswerGenerator {
  readonly mode = 'claude' as const;
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async *generate(input: AnswerInput): AsyncIterable<AnswerEvent> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: ANSWER_SYSTEM,
      messages: [
        ...this.historyMessages(input.history),
        { role: 'user', content: this.buildUserPrompt(input) },
      ],
    });

    let full = '';
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        full += event.delta.text;
        yield { type: 'token', text: event.delta.text };
      }
    }

    yield {
      type: 'sources',
      citations: citationsFromText(full, input.context),
    };
  }

  async summarize(input: SummaryInput): Promise<DocumentSummary> {
    const text = input.chunks
      .map((c) => `[p. ${c.page}] ${c.content}`)
      .join('\n\n')
      .slice(0, 24000);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 700,
      system:
        'Summarize the document for a reader browsing a library. 2-3 sentences. Return both an English and a Spanish summary.',
      messages: [
        {
          role: 'user',
          content: `Document: ${input.filename}\n\n${text}`,
        },
      ],
      output_config: {
        format: { type: 'json_schema', schema: SUMMARY_SCHEMA },
      },
    });

    const block = response.content.find((b) => b.type === 'text');
    const raw = block && block.type === 'text' ? block.text : '{}';
    const parsed = JSON.parse(raw) as { summary?: string; summaryEs?: string };
    return {
      summary: parsed.summary?.trim() ?? '',
      summaryEs: parsed.summaryEs?.trim() || null,
    };
  }

  private historyMessages(
    history: AnswerInput['history'],
  ): Anthropic.MessageParam[] {
    return history.map((turn) => ({ role: turn.role, content: turn.content }));
  }

  private buildUserPrompt(input: AnswerInput): string {
    const excerpts = input.context
      .map((c, i) => `Excerpt ${i + 1} (p. ${c.page}):\n${c.content}`)
      .join('\n\n');
    return `Document excerpts:\n\n${excerpts}\n\nQuestion: ${input.question}`;
  }
}

/** Map each `(§ p. N)` / `(p. N)` marker to the best chunk on that page. */
export function citationsFromText(
  answer: string,
  context: RetrievedChunk[],
): Citation[] {
  const pages: number[] = [];
  const seen = new Set<number>();
  const re = /\(?\s*§?\s*p\.?\s*(\d+)\s*\)?/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(answer)) !== null) {
    const page = Number(match[1]);
    if (!seen.has(page)) {
      seen.add(page);
      pages.push(page);
    }
  }

  const citations: Citation[] = [];
  for (const page of pages) {
    const chunk = context
      .filter((c) => c.page === page)
      .sort((a, b) => b.score - a.score)[0];
    if (chunk) {
      citations.push({
        chunkId: chunk.id,
        page,
        quote: clampQuote(chunk.content),
      });
    }
  }
  return citations;
}
