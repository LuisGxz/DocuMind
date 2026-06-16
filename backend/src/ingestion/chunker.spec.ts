import { approxTokenCount, chunkPages, DEFAULT_CHUNK_OPTIONS } from './chunker';
import { ExtractedPage } from './types';

describe('approxTokenCount', () => {
  it('counts whitespace-delimited words', () => {
    expect(approxTokenCount('hello world')).toBe(2);
    expect(approxTokenCount('  spaced   out  text ')).toBe(3);
    expect(approxTokenCount('')).toBe(0);
  });
});

describe('chunkPages', () => {
  const sentence = (n: number) =>
    `This is sentence number ${n} with enough words to matter here.`;

  it('keeps a short page as a single chunk on its own page', () => {
    const pages: ExtractedPage[] = [{ page: 1, text: 'A short clause here.' }];
    const chunks = chunkPages(pages);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].page).toBe(1);
    expect(chunks[0].content).toBe('A short clause here.');
  });

  it('never mixes content from two pages into one chunk', () => {
    const pages: ExtractedPage[] = [
      {
        page: 1,
        text: Array.from({ length: 30 }, (_, i) => sentence(i)).join(' '),
      },
      { page: 2, text: 'Second page content only.' },
    ];
    const chunks = chunkPages(pages);
    const page2 = chunks.filter((c) => c.page === 2);
    expect(page2).toHaveLength(1);
    expect(page2[0].content).toBe('Second page content only.');
    // every chunk belongs to exactly one source page
    for (const c of chunks) expect([1, 2]).toContain(c.page);
  });

  it('splits a long page into multiple bounded chunks with monotonic idx', () => {
    const longText = Array.from({ length: 80 }, (_, i) => sentence(i)).join(
      ' ',
    );
    const chunks = chunkPages([{ page: 1, text: longText }]);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c, i) => {
      expect(c.idx).toBe(i);
      // allow a small overrun for the trailing sentence past the target
      expect(c.tokenCount).toBeLessThanOrEqual(
        DEFAULT_CHUNK_OPTIONS.targetTokens + 20,
      );
    });
  });

  it('carries an overlap tail between consecutive chunks of the same page', () => {
    const longText = Array.from({ length: 80 }, (_, i) => sentence(i)).join(
      ' ',
    );
    const chunks = chunkPages([{ page: 1, text: longText }]);
    expect(chunks.length).toBeGreaterThan(1);
    const firstWords = new Set(chunks[0].content.split(/\s+/));
    const secondStart = chunks[1].content.split(/\s+/).slice(0, 5);
    // at least one of the second chunk's opening words appeared in the first
    expect(secondStart.some((w) => firstWords.has(w))).toBe(true);
  });

  it('skips empty pages', () => {
    const chunks = chunkPages([
      { page: 1, text: '   ' },
      { page: 2, text: 'Real content.' },
    ]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].page).toBe(2);
  });
});
