import { NO_CONTEXT_ANSWER, RetrievedChunk } from './answer-generator';
import { ExtractiveAnswerGenerator } from './extractive-answer.generator';
import { citationsFromText } from './claude-answer.generator';
import {
  clampQuote,
  extractKeywords,
  keywordOverlap,
  splitSentences,
} from './text.util';

function chunk(
  id: string,
  page: number,
  content: string,
  score: number,
): RetrievedChunk {
  return { id, idx: page, page, content, score };
}

describe('ExtractiveAnswerGenerator.compose', () => {
  const gen = new ExtractiveAnswerGenerator();

  it('quotes the keyword-matching sentence with a page citation', () => {
    const context: RetrievedChunk[] = [
      chunk(
        'c1',
        9,
        'Either party may terminate this Agreement upon ninety (90) days written notice. Other clauses apply too.',
        0.82,
      ),
      chunk(
        'c2',
        3,
        'Invoices are due net thirty days from the invoice date.',
        0.4,
      ),
    ];
    const { answer, citations } = gen.compose({
      question: 'How can the contract be terminated early?',
      context,
      history: [],
    });

    expect(answer).toContain('terminate this Agreement');
    expect(answer).toContain('(§ p. 9)');
    expect(citations).toHaveLength(1);
    expect(citations[0]).toMatchObject({ chunkId: 'c1', page: 9 });
    expect(citations[0].quote).toContain('terminate');
  });

  it('is honest when nothing is relevant (all below the floor)', () => {
    const context: RetrievedChunk[] = [
      chunk(
        'c1',
        1,
        'The quick brown fox jumps over the lazy dog repeatedly.',
        0.05,
      ),
      chunk(
        'c2',
        2,
        'Lorem ipsum dolor sit amet consectetur adipiscing elit.',
        0.1,
      ),
    ];
    const { answer, citations } = gen.compose({
      question: 'What is the refund policy for hardware returns?',
      context,
      history: [],
    });

    expect(answer).toBe(NO_CONTEXT_ANSWER);
    expect(citations).toHaveLength(0);
  });

  it('is honest with no retrieved context at all', () => {
    const { answer, citations } = gen.compose({
      question: 'Anything?',
      context: [],
      history: [],
    });
    expect(answer).toBe(NO_CONTEXT_ANSWER);
    expect(citations).toHaveLength(0);
  });

  it('cites multiple pages when several chunks match keywords', () => {
    const context: RetrievedChunk[] = [
      chunk(
        'c1',
        5,
        'Provider maintains technical safeguards to protect Customer Data.',
        0.7,
      ),
      chunk(
        'c2',
        6,
        'Customer Data is processed only to provide the data services.',
        0.68,
      ),
      chunk(
        'c3',
        1,
        'Unrelated boilerplate about office hours and parking.',
        0.3,
      ),
    ];
    const { citations } = gen.compose({
      question: 'How is customer data protected?',
      context,
      history: [],
    });
    const pages = citations.map((c) => c.page).sort();
    expect(pages).toEqual([5, 6]);
  });
});

describe('ExtractiveAnswerGenerator.generate (streaming)', () => {
  it('streams tokens then a sources event matching compose', async () => {
    const gen = new ExtractiveAnswerGenerator();
    const input = {
      question: 'How can the contract be terminated?',
      context: [
        chunk(
          'c1',
          9,
          'Either party may terminate this Agreement on notice.',
          0.8,
        ),
      ],
      history: [],
    };
    let text = '';
    let sources: unknown = null;
    for await (const ev of gen.generate(input)) {
      if (ev.type === 'token') text += ev.text;
      else sources = ev.citations;
    }
    const composed = gen.compose(input);
    expect(text).toBe(composed.answer);
    expect(sources).toEqual(composed.citations);
  });
});

describe('ExtractiveAnswerGenerator.summarizeExtractive', () => {
  it('produces a non-empty English summary and no Spanish (extractive mode)', () => {
    const gen = new ExtractiveAnswerGenerator();
    const result = gen.summarizeExtractive({
      filename: 'msa.pdf',
      chunks: [
        {
          page: 1,
          content:
            'This Master Services Agreement governs the cloud services provided to the Customer.',
        },
        {
          page: 9,
          content:
            'Either party may terminate this Agreement upon ninety days written notice to the other party.',
        },
        {
          page: 5,
          content:
            'Provider maintains administrative and technical safeguards to protect Customer Data.',
        },
      ],
    });
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.summaryEs).toBeNull();
  });

  it('handles an empty document gracefully', () => {
    const gen = new ExtractiveAnswerGenerator();
    expect(gen.summarizeExtractive({ filename: 'x', chunks: [] })).toEqual({
      summary: '',
      summaryEs: null,
    });
  });
});

describe('text utilities', () => {
  it('extractKeywords drops stopwords and short tokens', () => {
    expect(extractKeywords('What is the termination notice period?')).toEqual([
      'termination',
      'notice',
      'period',
    ]);
  });

  it('keywordOverlap matches on a stemmed prefix', () => {
    expect(
      keywordOverlap('the agreement was terminated early', ['terminate']),
    ).toBe(1);
    expect(
      keywordOverlap('confidential information is protected', [
        'confidentiality',
      ]),
    ).toBe(1);
    expect(keywordOverlap('nothing relevant here', ['payment'])).toBe(0);
  });

  it('splitSentences splits on sentence boundaries', () => {
    expect(
      splitSentences('First clause applies. Second clause follows! A third?'),
    ).toEqual(['First clause applies.', 'Second clause follows!', 'A third?']);
  });

  it('clampQuote trims long passages on a word boundary', () => {
    const long = 'word '.repeat(100).trim();
    const out = clampQuote(long, 50);
    expect(out.length).toBeLessThanOrEqual(51);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('citationsFromText (Claude marker mapping)', () => {
  const context: RetrievedChunk[] = [
    chunk('a', 9, 'Termination clause text on page nine.', 0.9),
    chunk('b', 9, 'A weaker page-nine chunk.', 0.4),
    chunk('c', 3, 'Payment terms on page three.', 0.8),
  ];

  it('maps each page marker to the best chunk on that page, in order', () => {
    const answer =
      'You may terminate the contract (§ p. 9). Fees are due net thirty (§ p. 3).';
    const citations = citationsFromText(answer, context);
    expect(citations.map((c) => c.page)).toEqual([9, 3]);
    expect(citations[0].chunkId).toBe('a'); // highest score on page 9
  });

  it('ignores pages not present in the context', () => {
    const citations = citationsFromText('See (§ p. 42).', context);
    expect(citations).toHaveLength(0);
  });

  it('dedupes repeated page markers', () => {
    const citations = citationsFromText('(§ p. 9) ... again (§ p. 9)', context);
    expect(citations).toHaveLength(1);
  });
});
