// Pre-download the embedding model into ./models so the deploy is self-contained.
// Run in CI after `npm ci` (transformers.js is a prod dependency). The runtime
// (embedding.service.ts) reads from the same `models/` cacheDir with remote
// models disabled, so production never reaches out to HuggingFace.
import { env, pipeline } from '@huggingface/transformers';

env.cacheDir = './models';

const MODEL = 'Xenova/all-MiniLM-L6-v2';
console.log(`Fetching ${MODEL} into ./models …`);
await pipeline('feature-extraction', MODEL);
console.log('Model bundled at ./models');
