import { Injectable } from '@nestjs/common';
import { EmbeddingService } from '../embeddings/embedding.service';
import { PrismaService } from '../prisma/prisma.service';
import { RetrievedChunk } from '../generation/answer-generator';

interface ChunkRow {
  id: string;
  idx: number;
  page: number;
  content: string;
  score: number;
}

/** Default number of chunks to pull into the answer context. */
export const DEFAULT_TOP_K = 6;

/**
 * pgvector top-k retrieval. Embeds the question with the same local ONNX model
 * used at ingestion, then ranks chunks by cosine distance (`<=>`) over the HNSW
 * index — this raw-SQL `ORDER BY embedding <=> $1` is the heart of the RAG.
 */
@Injectable()
export class RetrievalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingService,
  ) {}

  async retrieve(
    documentId: string,
    question: string,
    topK: number = DEFAULT_TOP_K,
  ): Promise<RetrievedChunk[]> {
    const vector = await this.embeddings.embed(question);
    const literal = `[${vector.join(',')}]`;

    const rows = await this.prisma.$queryRawUnsafe<ChunkRow[]>(
      `SELECT id, idx, page, content, 1 - (embedding <=> $1::vector) AS score
       FROM "DocumentChunk"
       WHERE "documentId" = $2::uuid AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      literal,
      documentId,
      topK,
    );

    return rows.map((r) => ({
      id: r.id,
      idx: r.idx,
      page: r.page,
      content: r.content,
      score: Number(r.score),
    }));
  }
}
