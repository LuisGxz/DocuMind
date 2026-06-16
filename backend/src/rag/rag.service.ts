import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { ANSWER_GENERATOR } from '../generation/answer-generator';
import type { AnswerGenerator, Citation } from '../generation/answer-generator';
import { RetrievalService } from './retrieval.service';

/** Events the SSE chat stream emits, in order. */
export type ChatStreamEvent =
  | { type: 'meta'; conversationId: string; title: string }
  | { type: 'token'; text: string }
  | { type: 'sources'; citations: Citation[] }
  | { type: 'done'; messageId: string };

/** Topic → suggested question, keyed by a marker found in the document text. */
const SUGGESTION_RULES: { match: RegExp; question: string }[] = [
  { match: /terminat/i, question: 'What are the termination terms?' },
  {
    match: /confidential/i,
    question: 'What are the confidentiality obligations?',
  },
  {
    match: /\bdata\b|personal data|processing/i,
    question: 'How is data handled and protected?',
  },
  {
    match: /payment|invoice|fee|net thirty|net 30/i,
    question: 'What are the payment and fee terms?',
  },
  { match: /liabilit/i, question: 'How is liability limited?' },
  { match: /indemnif/i, question: 'What are the indemnification obligations?' },
  {
    match: /intellectual property|\bip\b|ownership/i,
    question: 'Who owns the intellectual property?',
  },
  { match: /warrant/i, question: 'What warranties are provided?' },
  {
    match: /\bterm\b|renewal|subscription/i,
    question: 'What is the contract term and renewal?',
  },
];

const FALLBACK_SUGGESTIONS = [
  'What is this document about?',
  'Summarize the key obligations.',
  'What are the most important dates or deadlines?',
];

/** How many prior turns to feed the generator for follow-up coherence. */
const HISTORY_TURNS = 6;

@Injectable()
export class RagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retrieval: RetrievalService,
    private readonly conversations: ConversationsService,
    @Inject(ANSWER_GENERATOR) private readonly generator: AnswerGenerator,
  ) {}

  /**
   * Drives one chat turn end-to-end as an async stream: resolve/create the
   * conversation, persist the question, retrieve top-k chunks, stream the
   * grounded answer, then persist the assistant turn with its citations. The
   * controller forwards each yielded event as SSE.
   */
  async *chat(
    documentId: string,
    userId: string,
    conversationId: string | null,
    question: string,
  ): AsyncIterable<ChatStreamEvent> {
    const doc = await this.prisma.document.findUniqueOrThrow({
      where: { id: documentId },
      select: { status: true },
    });
    if (doc.status !== 'Indexed') {
      throw new BadRequestException(
        'This document is still being processed. Try again once it is indexed.',
      );
    }

    const conversation = conversationId
      ? await this.conversations.getOwned(conversationId, userId, documentId)
      : await this.conversations.create(
          documentId,
          userId,
          deriveTitle(question),
        );
    yield {
      type: 'meta',
      conversationId: conversation.id,
      title: conversation.title,
    };

    // Snapshot prior turns before recording the new question.
    const history = await this.conversations.recentHistory(
      conversation.id,
      HISTORY_TURNS,
    );
    await this.conversations.addMessage(
      conversation.id,
      'user',
      question,
      null,
    );

    const context = await this.retrieval.retrieve(documentId, question);

    let full = '';
    let citations: Citation[] = [];
    for await (const event of this.generator.generate({
      question,
      context,
      history,
    })) {
      if (event.type === 'token') {
        full += event.text;
        yield { type: 'token', text: event.text };
      } else {
        citations = event.citations;
        yield { type: 'sources', citations };
      }
    }

    const message = await this.conversations.addMessage(
      conversation.id,
      'assistant',
      full,
      citations,
    );
    await this.conversations.touch(conversation.id);
    yield { type: 'done', messageId: message.id };
  }

  /** Document-aware starter questions derived from the indexed chunk text (RF-05). */
  async suggestQuestions(documentId: string): Promise<string[]> {
    const chunks = await this.prisma.documentChunk.findMany({
      where: { documentId },
      select: { content: true },
      take: 60,
    });
    const text = chunks.map((c) => c.content).join(' ');

    const questions: string[] = [];
    for (const rule of SUGGESTION_RULES) {
      if (rule.match.test(text) && !questions.includes(rule.question)) {
        questions.push(rule.question);
      }
      if (questions.length >= 4) break;
    }
    for (const fallback of FALLBACK_SUGGESTIONS) {
      if (questions.length >= 4) break;
      if (!questions.includes(fallback)) questions.push(fallback);
    }
    return questions.slice(0, 4);
  }
}

/** A readable conversation title from the opening question. */
function deriveTitle(question: string): string {
  const clean = question.replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').slice(0, 8).join(' ');
  const title = words.length < clean.length ? `${words}…` : words;
  return title.slice(0, 120) || 'New conversation';
}
