# DocuMind — Requerimientos y Arquitectura

> Asistente de IA para documentos (**RAG**): sube PDFs/texto y pregunta en lenguaje natural; la IA responde **citando el documento**. Proyecto #11 del portfolio (🟡 Wildcard — IA / Generative AI).
> Stack: **Angular 20** (standalone + signals, SCSS propio) · **NestJS** (Node 24, TS estricto) · **Postgres + pgvector** (Neon) · embeddings **locales ONNX** (all-MiniLM-L6-v2) · **Claude API listo** (claude-opus-4-8 / claude-haiku-4-5) con generador extractivo determinista por defecto · JWT + refresh + RBAC.
> Diseño: `../../docs/portfolio-designs/11-documind.html` (canvas #F7F8FA, ink scale, gradiente aiblue→aiviolet, Inter + Source Serif 4, cita resaltada #FFF3C4).

---

## 0. Decisiones clave (por qué)

| Decisión | Elección | Por qué |
|----------|----------|---------|
| **LLM** | Interfaz `AnswerGenerator` con `ClaudeAnswerGenerator` (real, se activa si hay `ANTHROPIC_API_KEY`) + `ExtractiveAnswerGenerator` (default determinista) | El demo en vivo **nunca** depende de una key ni de costo/cold-start. El camino Claude queda real y listo (mismo patrón que el stub de Stripe en ShopForge). Enchufar Claude = poner la key. |
| **Embeddings** | Local ONNX `Xenova/all-MiniLM-L6-v2` (384 dims) vía transformers.js | Sin API key, sin costo, semántica **real**, reproducible para el seed, corre en el propio backend. |
| **Vector store** | Postgres + **pgvector** en **Neon** (serverless free) | pgvector real (operador `<=>` cosine, índice HNSW). Neon escala a cero y tiene free tier generoso. |
| **ORM** | **Prisma** para el modelo relacional; columna `vector(384)` vía `Unsupported` + **SQL crudo** para insert/retrieval de embeddings | Prisma = DX reconocible; el retrieval `ORDER BY embedding <=> $1` es SQL crudo a propósito (talking point técnico). |
| **Visor de documento** | Render del **texto extraído** paginado (no overlay sobre PDF.js) | Las citas mapean al **chunk exacto**; resaltado por match de texto, sin coordenadas frágiles. PDF.js queda como "qué construiría después". |
| **Deploy** | API en **Azure App Service** (Node, free) · DB en **Neon** · Front en **GitHub Pages** | Consistencia con el portfolio (Azure+Pages) + Postgres gestionado donde pgvector vive cómodo. |

---

## 1. Requerimientos funcionales

### RF-01 Autenticación y seguridad
- Registro email + contraseña (hash **argon2**). Login → access JWT (15 min) + refresh rotativo (7 días, persistido y revocable).
- **Lockout** tras 5 intentos fallidos (15 min). `/auth/me`.
- Errores de formulario legibles (ProblemDetails por campo + detail), validación client-side espejo.

### RF-02 Workspaces y RBAC
- Un **workspace** agrupa documentos (ej. "Legal & Contracts"). Cada usuario es miembro con rol **Owner** o **Viewer**.
- **Owner**: subir, reprocesar y eliminar documentos; preguntar. **Viewer**: solo preguntar e historial (no sube ni borra).
- RBAC aplicado en endpoints (guards). El diferenciador que brilla en la Demo Guiada (badge de rol + hint cross-rol "abre como Viewer en otra pestaña: ve la misma biblioteca indexada, sin poder modificarla").

### RF-03 Biblioteca de documentos
- Listado (grid) por workspace: nombre, tipo (PDF/TXT/MD), páginas, estado, nº de conversaciones, fecha.
- Contadores del workspace: nº documentos + páginas indexadas.
- Estado por documento: `Queued | Processing | Indexed | Failed` con detalle/progreso.

### RF-04 Ingesta y procesamiento (pipeline RAG)
- Subida de **PDF / TXT / MD** (límite de tamaño). Extracción de texto por página (PDF vía `pdf-parse`/pdfjs; TXT/MD directo).
- **Chunking** por tokens con solape (≈ 500 tokens, overlap 80), preservando `page`.
- **Embedding** de cada chunk (ONNX, 384 dims) → guardado en `DocumentChunk.embedding`.
- Procesamiento **asíncrono** con transiciones de estado y progreso (págs procesadas / total) consultable. Reprocesar (Owner).
- Estado vacío que enseña y pantalla de progreso fiel al mockup (uno listo / uno en curso con % / uno en cola).

### RF-05 Chat RAG con citas
- Pregunta en NL → embed → **retrieval top-k** (cosine `<=>`, k≈6) sobre los chunks del documento → construcción de contexto → **respuesta fundamentada con citas inline** (`§ pág. N`) → **streaming SSE** (efecto typing).
- Cada cita enlaza al **chunk/página** exacto; al hacer hover se resalta en el visor.
- Respuestas con **fuentes** (lista de chunks citados). Sin contexto suficiente → lo dice honestamente (no alucina).
- Preguntas sugeridas por documento.

### RF-06 Conversaciones
- Historial de conversaciones **por documento y usuario** (lista + detalle con mensajes y citas). Crear/continuar/renombrar.

### RF-07 Resumen automático
- Resumen del documento (generado en la ingesta vía `AnswerGenerator`), bilingüe cuando aplique, mostrado en el detalle.

### RF-08 Bilingüe e i18n
- App completa EN/ES (toggle persistido, auto-detección `navigator.language`); copy a mano tipado EN/ES + mapas de display para enums (estado, rol, tipo de archivo).

### RF-09 Demo Guiada (onboarding role-aware) — OBLIGATORIO
- Login/landing orientador · badge de rol persistente (qué puede/no puede) · tour de primer ingreso (coach-marks) · panel "Cómo explorar" con escenario cross-rol primero · estados vacíos que enseñan · hint del "aha" (cita que enlaza al texto + abrir como Viewer).

---

## 2. Modelo de datos (Postgres + pgvector)

```
User          (id uuid pk, email uq, passwordHash, fullName, failedLoginCount, lockoutUntil?, createdAt)
RefreshToken  (id, userId fk, tokenHash uq, expiresAt, revokedAt?, replacedByHash?, createdAt)
Workspace     (id, slug uq, name, nameEs?, description, descriptionEs?, createdAt)
Membership    (id, workspaceId fk, userId fk, role[Owner|Viewer], createdAt, uq(workspaceId,userId))
Document      (id, workspaceId fk, filename, mimeType, sizeBytes, pageCount, status[Queued|Processing|Indexed|Failed],
               statusDetail?, progressPages, chunkCount, summary?, summaryEs?, uploadedById fk, createdAt, indexedAt?)
DocumentChunk (id, documentId fk, idx, page, content, tokenCount, embedding vector(384))   -- HNSW index (vector_cosine_ops)
Conversation  (id, documentId fk, userId fk, title, createdAt, updatedAt)
ChatMessage   (id, conversationId fk, role[user|assistant], content, citations jsonb?, createdAt)
```

- `citations` jsonb = `[{ chunkId, page, quote }]` — snapshot de lo citado.
- `DocumentChunk.embedding` = `vector(384)`; insert y retrieval por SQL crudo (`<=>`), índice HNSW `vector_cosine_ops`.
- Snapshots de texto en chunks → el visor renderiza el mismo texto que se indexó (las citas mapean 1:1).

## 3. Arquitectura backend (NestJS, modular + capas)

```
src/
  config/                 env tipado (DATABASE_URL, JWT secrets, ANTHROPIC_API_KEY?, límites)
  prisma/                 PrismaService + migraciones (schema.prisma)
  auth/                   JWT (access+refresh), argon2, lockout, guards (JwtAuthGuard, RolesGuard), /me
  workspaces/             membresía, RBAC Owner/Viewer
  documents/              upload, listado, detalle, delete, estado/progreso, reprocesar
  ingestion/              IngestionService (extract → chunk → embed → store), cola in-process
    extractors/           pdf, text
    chunker.ts
  embeddings/             EmbeddingService (ONNX all-MiniLM, singleton; cosine helper)
  rag/                    RetrievalService (pgvector top-k), AnswerGenerator (interface)
    claude-answer.generator.ts      (real, @anthropic-ai/sdk, streaming; activo si hay key)
    extractive-answer.generator.ts  (default determinista, citas reales, stream por palabras)
    rag.controller.ts     SSE /rag/chat
  conversations/          historial por documento/usuario
  common/                 ProblemDetails filter, DTOs/validación, paginación
  seed/                   corpus realista (contratos: MSA, DPA, NDA, pricing…) + usuarios/workspace demo
```

- **AnswerGenerator** elegido por DI según `ANTHROPIC_API_KEY`. Ambos emiten un stream de tokens; el controller los reenvía como SSE para el efecto typing tanto con Claude como con el extractivo.
- **Ingesta asíncrona**: cola in-process (sin Redis para el demo); estado/progreso persistido y consultable por polling.
- Tests del dominio crítico: chunker (solape/límites), retrieval (orden por similitud), extractive generator (citas correctas, sin contexto → honesto), auth (lockout/rotación), RBAC (Viewer no sube/borra).

## 4. Frontend (Angular 20)

- Sistema de diseño **DocuMind** del mockup (canvas/ink/aiblue/aiviolet, Inter + Source Serif 4, gradiente IA, cita #FFF3C4, caret typing con `prefers-reduced-motion`).
- Core: config (API base inyectable), modelos TS, `ApiService`, `AuthService` (signals + refresh), interceptor auto-refresh, guards, `LanguageService` + i18n, `api-error`.
- Features: login/registro · biblioteca (grid) · upload + procesamiento (progreso) · **split-view** visor + chat (streaming, citas con hover→resaltado) · conversaciones · resumen · /about.
- Streaming vía `fetch` + `ReadableStream` (SSE) en el chat.

## 5. Fases — ver `PHASES.md`.

## 6. Deploy
- **DB**: Neon (free), extensión `vector` habilitada, migración Prisma + seed.
- **API**: Azure App Service (Node, free F1), app settings (DATABASE_URL Neon, JWT secrets, sin ANTHROPIC key → modo extractivo). Nota: embeddings ONNX en F1 → modelo cuantizado + embeddings del seed precomputados para no castigar el arranque.
- **Front**: GitHub Pages (`--base-href /DocuMind/`, 404 SPA, API base inyectada en build).
- CI: lint + build + test (backend y frontend). Keep-warm de la API.
