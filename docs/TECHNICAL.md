# DocuMind — technical write-up

A deeper look at how the RAG pipeline, the generation layer, and the security model are built. For the product overview and how to run it, see the [README](../README.md).

---

## 1. The RAG pipeline

```
upload ─▶ extract (per page) ─▶ chunk (overlap, page-preserving) ─▶ embed (ONNX) ─▶ store vector(384)
                                                                                          │
question ─▶ embed (same model) ─▶ top-k cosine (pgvector <=>, HNSW) ─▶ AnswerGenerator ─▶ SSE tokens + citations
```

### Ingestion (`ingestion/`)

- **Extraction** is per page: PDFs via `pdf-parse` (page by page), text/markdown split on form-feeds so page numbers survive.
- **Chunking** (`chunker.ts`) splits on sentence boundaries with a sliding overlap window, **never crossing a page boundary**. That invariant is what keeps citations page-accurate: every chunk maps to exactly one source page.
- **Embedding** uses `EmbeddingService` — a lazy singleton wrapping `transformers.js` (`Xenova/all-MiniLM-L6-v2`, 384-dim, L2-normalized so cosine reduces to a dot product).
- Vectors are written with **raw SQL** because Prisma can't express the `vector` type:
  ```sql
  INSERT INTO "DocumentChunk" (..., embedding) VALUES (..., $7::vector)
  ```
- The whole thing runs **asynchronously** off an in-process queue; the document moves `Queued → Processing → Indexed` with `progressPages`/`pageCount` polled by the client.

### Retrieval (`rag/retrieval.service.ts`)

The query is embedded with the same model, then ranked by cosine distance in raw SQL over an HNSW index:

```sql
SELECT id, idx, page, content, 1 - (embedding <=> $1::vector) AS score
FROM "DocumentChunk"
WHERE "documentId" = $2::uuid AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT $3
```

The HNSW index (`vector_cosine_ops`) is created in the migration SQL by hand — Prisma's migration is patched to add it, since the ORM doesn't know about pgvector indexes.

---

## 2. The generation layer (`generation/`)

A single interface, two implementations, chosen at boot by `AppConfig.claudeEnabled`:

```ts
interface AnswerGenerator {
  readonly mode: 'claude' | 'extractive';
  generate(input: AnswerInput): AsyncIterable<AnswerEvent>;   // token* then a sources event
  summarize(input: SummaryInput): Promise<DocumentSummary>;
}
```

`GenerationModule` is a standalone module (depending on nothing app-specific) so both the ingestion pipeline (summaries) and the RAG chat can consume it without a circular import.

### Extractive generator (default — key-free, deterministic)

`compose()` is a pure, unit-tested function:

1. Drop chunks below a **cosine floor** (`0.25`). If none clear it → an honest "not in this document" answer with **no citations**. The model never hallucinates a source.
2. Extract question keywords (stopwords removed, matched on a stemmed prefix).
3. Pick the best sentence per top chunk (`keywordOverlap·10 + similarity`), keeping up to three.
4. Stitch the answer from those exact sentences, each tagged `(§ p. N)`, and emit a `Citation { chunkId, page, quote }` per passage.

`generate()` wraps `compose()` and streams it word-by-word for the typing effect.

### Claude generator (real, dormant without a key)

`@anthropic-ai/sdk` `messages.stream` with `thinking: { type: 'adaptive' }`. A system prompt constrains it to answer **only** from the provided excerpts and cite pages as `(§ p. N)`; citations are recovered from those markers and mapped back to the highest-scoring retrieved chunk on each page. Summaries use a `json_schema` structured output for EN + ES.

> The live demo runs the extractive path. The Claude path is the same pipeline (retrieval, citations, streaming) — only the final wording differs. Enabling it is one env var.

### Streaming to the browser

The controller writes `text/event-stream` frames manually (`@Res()`), forwarding `meta → token* → sources → done`. The Angular `ChatService` reads them with `fetch` + `ReadableStream` (the HttpClient can't surface a token stream), attaching the bearer token directly and transparently refreshing once on a 401.

---

## 3. Security & access

- **JWT** access (15 min) + **rotating refresh** (7 days). Refresh tokens are stored as **sha256** only; rotation marks the old token replaced, and **reuse detection** revokes the whole token family.
- **argon2** password hashing; **lockout** after 5 failed attempts (15 min); login errors are **non-enumerating** (unknown email and wrong password return the same message).
- **RBAC** via guards: `WorkspaceAccessGuard` and `DocumentAccessGuard` resolve the caller's membership from the route and enforce `@RequireRole(...)`. Owners upload/reprocess/delete; Viewers read and ask. The same role drives the UI (hidden actions) — but the server is the source of truth.
- Errors are returned as **RFC 7807 ProblemDetails** with per-field `errors`, so the client renders *why* a request failed.

---

## 4. Frontend notes

- Angular 20, standalone components, **signals** for all state; a small SCSS design system mirrors the mockup tokens (canvas/ink scale, aiblue→aiviolet gradient, `#FFF3C4` citation highlight).
- The **reader** renders the extracted text paginated; citations highlight by **text match** against the indexed chunk content (tolerating a clamped `…`), with auto-scroll to the active passage — no fragile PDF pixel coordinates.
- The **chat** emits the hovered citation's `chunkId` up to the reader, which highlights the exact passage live.
- A first-run **guided tour** and a role-aware "how to explore" panel make the RBAC story legible (RF-09).

---

## 5. Deliberate trade-offs

| Trade-off | Why it's fine |
|-----------|---------------|
| Extractive generation at demo time | The pipeline that matters (retrieval, citations, streaming) is identical; Claude is a one-env-var swap. |
| Text-page reader, not a PDF.js overlay | Citations stay exact and robust; pixel-perfect PDF is the obvious next step. |
| In-process ingestion queue (no Redis) | Simpler to run; ample for demo scale. |
| Local ONNX embeddings | No key, reproducible, real semantics — at the cost of a cold-start model load on the first query (mitigated by keep-warm). |

---

## 6. Deploy

- **DB** — Neon (serverless Postgres) with the `vector` extension; `prisma migrate deploy` + seed.
- **API** — Azure App Service (Linux, free tier), Oryx build (`npm install` → `prisma generate` via `postinstall` → `nest build`), started with `node dist/main`. App settings carry `DATABASE_URL`, JWT secrets, and `CORS_ORIGINS` (the Pages origin). No `ANTHROPIC_API_KEY` → extractive mode.
- **Front** — GitHub Pages, built with `--base-href /DocuMind/`, a `404.html` SPA fallback, and `window.DOCUMIND_API_BASE` injected to point at the Azure API.
- **CI** — GitHub Actions builds and tests the backend and builds the frontend on every push; a scheduled workflow keeps the free-tier API warm.
