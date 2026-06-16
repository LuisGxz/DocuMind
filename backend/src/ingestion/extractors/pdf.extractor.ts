import { PDFParse } from 'pdf-parse';
import { ExtractedDocument, ExtractedPage } from '../types';

/**
 * Extract per-page text from a PDF buffer using pdf-parse v2's `getText()`,
 * which returns page-wise text — so page numbers stay accurate for citations.
 */
export async function extractPdf(buffer: Buffer): Promise<ExtractedDocument> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const pages: ExtractedPage[] = result.pages
      .map((p) => ({ page: p.num, text: p.text.replace(/\s+/g, ' ').trim() }))
      .filter((p) => p.text.length > 0);
    return {
      pageCount: result.total || pages.length,
      pages,
    };
  } finally {
    await parser.destroy();
  }
}
