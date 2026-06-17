import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from '@huggingface/transformers';

export const EMBEDDING_DIMS = 384;
const MODEL = 'Xenova/all-MiniLM-L6-v2';

// Resolve the model from a bundled `models/` directory shipped with the deploy.
// This keeps production self-contained: it never reaches out to HuggingFace at
// runtime (no cold-start download, no network dependency) and works on Azure's
// read-only run-from-package mount. Locally the directory is populated on first
// run. `ALLOW_REMOTE_MODELS=false` (set in prod) forces offline, local-only load.
env.cacheDir = process.env.MODEL_CACHE_DIR ?? join(process.cwd(), 'models');
if (process.env.ALLOW_REMOTE_MODELS === 'false') {
  env.allowRemoteModels = false;
}

/**
 * Local, key-free sentence embeddings via transformers.js (ONNX).
 * `all-MiniLM-L6-v2` → 384-dim, L2-normalized vectors, so cosine similarity
 * reduces to a dot product and lines up with pgvector's `<=>` operator.
 *
 * The model is loaded lazily and cached as a singleton — the first call pays
 * the load cost, subsequent calls are fast.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: FeatureExtractionPipeline | null = null;
  private loading: Promise<FeatureExtractionPipeline> | null = null;

  private async getExtractor(): Promise<FeatureExtractionPipeline> {
    if (this.extractor) return this.extractor;
    if (!this.loading) {
      this.logger.log(`Loading embedding model ${MODEL}…`);
      this.loading = pipeline('feature-extraction', MODEL).then((p) => {
        this.extractor = p;
        this.logger.log('Embedding model ready');
        return p;
      });
    }
    return this.loading;
  }

  /** Embed a single text into a 384-dim unit vector. */
  async embed(text: string): Promise<number[]> {
    const extractor = await this.getExtractor();
    const output = await extractor(this.clean(text), {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data as Float32Array);
  }

  /** Embed many texts sequentially (memory-friendly on free-tier hosts). */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (const text of texts) {
      out.push(await this.embed(text));
    }
    return out;
  }

  private clean(text: string): string {
    return text.replace(/\s+/g, ' ').trim().slice(0, 8000);
  }
}

/** Cosine similarity for unit vectors (== dot product). Exposed for tests/ranking. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}
