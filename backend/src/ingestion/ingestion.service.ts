import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embeddings/embedding.service';
import { chunkPages } from './chunker';
import { extractText } from './extractors/text.extractor';
import { extractPdf } from './extractors/pdf.extractor';
import { ExtractedDocument } from './types';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingService,
  ) {}

  /**
   * Fire-and-forget ingestion (used by the upload endpoint). The HTTP request
   * returns immediately; the document moves Queued → Processing → Indexed in the
   * background, and the client polls status/progress.
   */
  enqueue(documentId: string, buffer: Buffer): void {
    void this.ingest(documentId, buffer).catch((err) => {
      this.logger.error(
        `Ingestion failed for document ${documentId}: ${String(err)}`,
      );
    });
  }

  /** Run the full pipeline synchronously (used by the seed and tests). */
  async ingest(documentId: string, buffer: Buffer): Promise<void> {
    const doc = await this.prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });

    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'Processing',
          statusDetail: 'Extracting text',
          progressPages: 0,
          indexedAt: null,
        },
      });

      const extracted = await this.extract(buffer, doc.mimeType);

      await this.prisma.document.update({
        where: { id: documentId },
        data: { pageCount: extracted.pageCount, statusDetail: 'Chunking' },
      });

      const chunks = chunkPages(extracted.pages);

      // Reprocess-safe: clear any previous chunks for this document.
      await this.prisma.documentChunk.deleteMany({ where: { documentId } });

      let processedPage = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const vector = await this.embeddings.embed(chunk.content);
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "DocumentChunk" (id, "documentId", idx, page, content, "tokenCount", embedding)
           VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::vector)`,
          randomUUID(),
          documentId,
          chunk.idx,
          chunk.page,
          chunk.content,
          chunk.tokenCount,
          `[${vector.join(',')}]`,
        );

        if (chunk.page > processedPage) {
          processedPage = chunk.page;
          if (i % 3 === 0) {
            await this.prisma.document.update({
              where: { id: documentId },
              data: {
                progressPages: processedPage,
                statusDetail: `Embedding · p. ${processedPage}/${extracted.pageCount}`,
              },
            });
          }
        }
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'Indexed',
          statusDetail: null,
          progressPages: extracted.pageCount,
          chunkCount: chunks.length,
          indexedAt: new Date(),
        },
      });
      this.logger.log(
        `Indexed ${doc.filename}: ${extracted.pageCount} pages, ${chunks.length} chunks`,
      );
    } catch (err) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'Failed',
          statusDetail: err instanceof Error ? err.message : 'Ingestion failed',
        },
      });
      throw err;
    }
  }

  private async extract(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedDocument> {
    if (mimeType === 'application/pdf') {
      return extractPdf(buffer);
    }
    // text/plain, text/markdown, and anything else readable as UTF-8 text.
    return extractText(buffer.toString('utf-8'));
  }
}
