/** A page of extracted text (1-based page number). */
export interface ExtractedPage {
  page: number;
  text: string;
}

/** A retrieval unit: a slice of one page, sized for embedding + context. */
export interface Chunk {
  idx: number;
  page: number;
  content: string;
  tokenCount: number;
}

export interface ExtractedDocument {
  pageCount: number;
  pages: ExtractedPage[];
}
