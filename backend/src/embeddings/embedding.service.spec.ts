import { cosineSimilarity } from './embedding.service';

// Note: the live ONNX model (EmbeddingService.embed) is exercised end-to-end by
// the seed + the pgvector retrieval check, not here — transformers.js/onnxruntime
// trips Jest's sandboxed Float32Array realm. This suite covers the pure ranking
// math the retrieval layer depends on.
describe('cosineSimilarity', () => {
  it('is 1 for identical unit vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it('is 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('is -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it('ranks a closer vector above a farther one', () => {
    const q = [0.8, 0.6];
    const near = [0.79, 0.61];
    const far = [-0.6, 0.8];
    expect(cosineSimilarity(q, near)).toBeGreaterThan(cosineSimilarity(q, far));
  });
});
