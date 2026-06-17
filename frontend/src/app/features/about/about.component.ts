import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { BrandMarkComponent } from '../../shared/brand-mark.component';
import { IconComponent } from '../../shared/icon.component';
import { LangToggleComponent } from '../../shared/lang-toggle.component';

interface PatternRow {
  pattern: string;
  where: string;
  why: string;
}

interface AboutCopy {
  back: string;
  title: string;
  leadHtml: string;
  tryDemo: string;
  sourceCode: string;
  demoCreds: string;
  scopeTitle: string;
  scope: string[];
  archTitle: string;
  archIntro: string;
  archBullets: string[];
  decisionsTitle: string;
  decisionsHead: [string, string, string];
  decisions: PatternRow[];
  ragTitle: string;
  rag: string[];
  genTitle: string;
  gen: string[];
  authTitle: string;
  auth: string[];
  testTitle: string;
  test: string[];
  tradeTitle: string;
  trade: string[];
  footer: string;
}

const STACK = [
  'Angular 20',
  'NestJS',
  'Postgres + pgvector',
  'ONNX embeddings',
  'Claude-ready',
  'JWT + RBAC',
];

const EN: AboutCopy = {
  back: 'Back',
  title: 'DocuMind',
  leadHtml:
    'A <strong>RAG</strong> document assistant: upload contracts and ask in plain language — answers come back <strong>grounded in the text, with citations to the exact page</strong>. Built to show a real retrieval-augmented-generation pipeline end to end, without depending on any paid API at demo time.',
  tryDemo: 'Open the live demo',
  sourceCode: 'Source code',
  demoCreds: 'Demo accounts:',
  scopeTitle: 'What it does',
  scope: [
    'Upload PDF / TXT / Markdown → async ingestion with live progress',
    'Semantic search over the document (pgvector cosine, HNSW index)',
    'Streamed answers with inline citations that highlight the source passage',
    'Per-document conversations, history, and document summaries',
    'Owner / Viewer RBAC — Viewers read & ask, Owners also upload & manage',
    'Fully bilingual (EN/ES) with a role-aware guided tour',
  ],
  archTitle: 'Architecture',
  archIntro:
    'A NestJS API owns the RAG pipeline; an Angular SPA renders the split-view reader + chat. The vector store is Postgres with the pgvector extension.',
  archBullets: [
    '<strong>Ingestion</strong> — extract text per page → chunk with overlap (page-preserving) → embed each chunk → store as a <code>vector(384)</code>. Runs asynchronously with a polled status/progress.',
    '<strong>Retrieval</strong> — the question is embedded with the same local model, then ranked by cosine distance in raw SQL: <code>ORDER BY embedding &lt;=&gt; $1</code> over an HNSW index.',
    '<strong>Generation</strong> — an <code>AnswerGenerator</code> interface with two implementations, chosen at boot by whether an API key is present.',
    '<strong>Streaming</strong> — answers stream to the browser over SSE (fetch + ReadableStream), token by token, with the citation list emitted at the end.',
  ],
  decisionsTitle: 'Key decisions',
  decisionsHead: ['Decision', 'Choice', 'Why'],
  decisions: [
    {
      pattern: 'LLM',
      where: 'Extractive default + Claude adapter',
      why: 'The live demo never depends on a key, cost, or cold-start. The Claude path is real and activates by just setting ANTHROPIC_API_KEY.',
    },
    {
      pattern: 'Embeddings',
      where: 'Local ONNX all-MiniLM-L6-v2',
      why: 'Key-free, reproducible, real semantics — runs inside the API (transformers.js, 384-dim, normalized).',
    },
    {
      pattern: 'Vector store',
      where: 'Postgres + pgvector',
      why: 'Real cosine operator (<=>) and HNSW index; insert/retrieval via raw SQL — a deliberate talking point.',
    },
    {
      pattern: 'Viewer',
      where: 'Extracted-text pages',
      why: 'Citations map to the exact chunk and highlight by text match — no fragile PDF coordinates.',
    },
  ],
  ragTitle: 'Retrieval that grounds the answer',
  rag: [
    'Chunking preserves page boundaries, so every chunk maps to exactly one source page — citations stay page-accurate.',
    'The cosine similarity floor means a weak match is answered honestly ("not in this document") instead of hallucinated.',
    'Citations are a snapshot <code>{ chunkId, page, quote }</code> persisted with each message — hovering one highlights the exact passage in the reader.',
  ],
  genTitle: 'Generation — honest by default',
  gen: [
    'The <strong>extractive generator</strong> stitches the answer only from sentences that actually appear in the retrieved chunks, each tagged with a <code>(§ p. N)</code> citation. It never invents text.',
    'The <strong>Claude generator</strong> (real, dormant without a key) streams the Messages API with adaptive thinking and derives citations from the page markers it emits.',
    'Document summaries (RF-07) are generated the same way during ingestion.',
  ],
  authTitle: 'Auth & access',
  auth: [
    'JWT access (15 min) + rotating refresh (7 days, sha256-stored, reuse-detection revokes the family).',
    'argon2 password hashing, lockout after 5 failed attempts, non-enumerating login errors.',
    'RBAC via guards: <code>WorkspaceAccessGuard</code> / <code>DocumentAccessGuard</code> + <code>@RequireRole</code>.',
  ],
  testTitle: 'Tested where it matters',
  test: [
    '50 backend tests: chunker, cosine, auth (lockout/rotation/reuse), RBAC guards, document upload validation, and the extractive generator (citations, multi-page, honest-no-context).',
    'Frontend verified end-to-end with Playwright across three breakpoints — login, chat streaming with citations, RBAC, and a real upload→index→ask flow.',
  ],
  tradeTitle: 'Trade-offs I made on purpose',
  trade: [
    'Extractive generation over a paid LLM at demo time — the pipeline (retrieval, citations, streaming) is identical; only the final wording differs.',
    'Text-page reader over a full PDF.js overlay — citations are exact and robust; pixel-perfect PDF rendering is the obvious next step.',
    'In-process ingestion queue (no Redis) — simpler to run and plenty for the demo scale.',
  ],
  footer: 'DocuMind · a portfolio project by Luis Chiquito Vera',
};

const ES: AboutCopy = {
  back: 'Volver',
  title: 'DocuMind',
  leadHtml:
    'Un asistente de documentos <strong>RAG</strong>: sube contratos y pregunta en lenguaje natural — las respuestas vuelven <strong>fundamentadas en el texto, con citas a la página exacta</strong>. Hecho para mostrar un pipeline real de generación aumentada por recuperación, de punta a punta y sin depender de ninguna API de pago en el demo.',
  tryDemo: 'Abrir el demo en vivo',
  sourceCode: 'Código fuente',
  demoCreds: 'Cuentas de demo:',
  scopeTitle: 'Qué hace',
  scope: [
    'Sube PDF / TXT / Markdown → ingesta asíncrona con progreso en vivo',
    'Búsqueda semántica sobre el documento (coseno pgvector, índice HNSW)',
    'Respuestas en streaming con citas inline que resaltan el pasaje fuente',
    'Conversaciones por documento, historial y resúmenes de documento',
    'RBAC Propietario / Lector — el Lector lee y pregunta, el Propietario además sube y gestiona',
    'Totalmente bilingüe (EN/ES) con un tour guiado según el rol',
  ],
  archTitle: 'Arquitectura',
  archIntro:
    'Una API NestJS gestiona el pipeline RAG; un SPA Angular renderiza el lector split-view + chat. El vector store es Postgres con la extensión pgvector.',
  archBullets: [
    '<strong>Ingesta</strong> — extrae texto por página → trocea con solape (preservando página) → embebe cada chunk → guarda como <code>vector(384)</code>. Corre en segundo plano con estado/progreso consultable.',
    '<strong>Recuperación</strong> — la pregunta se embebe con el mismo modelo local y se ordena por distancia coseno en SQL crudo: <code>ORDER BY embedding &lt;=&gt; $1</code> sobre un índice HNSW.',
    '<strong>Generación</strong> — una interfaz <code>AnswerGenerator</code> con dos implementaciones, elegida al arrancar según si hay API key.',
    '<strong>Streaming</strong> — las respuestas llegan al navegador por SSE (fetch + ReadableStream), token a token, con la lista de citas al final.',
  ],
  decisionsTitle: 'Decisiones clave',
  decisionsHead: ['Decisión', 'Elección', 'Por qué'],
  decisions: [
    {
      pattern: 'LLM',
      where: 'Extractivo por defecto + adapter Claude',
      why: 'El demo en vivo nunca depende de una key, costo ni cold-start. El camino Claude es real y se activa con solo poner ANTHROPIC_API_KEY.',
    },
    {
      pattern: 'Embeddings',
      where: 'ONNX local all-MiniLM-L6-v2',
      why: 'Sin key, reproducible, semántica real — corre dentro de la API (transformers.js, 384-dim, normalizado).',
    },
    {
      pattern: 'Vector store',
      where: 'Postgres + pgvector',
      why: 'Operador coseno real (<=>) e índice HNSW; insert/retrieval en SQL crudo — un punto técnico a propósito.',
    },
    {
      pattern: 'Visor',
      where: 'Páginas de texto extraído',
      why: 'Las citas mapean al chunk exacto y resaltan por coincidencia de texto — sin coordenadas frágiles de PDF.',
    },
  ],
  ragTitle: 'Recuperación que fundamenta la respuesta',
  rag: [
    'El troceado preserva límites de página, así cada chunk mapea a una sola página — las citas quedan exactas a la página.',
    'El umbral de similitud coseno hace que una coincidencia débil se responda con honestidad ("no está en este documento") en lugar de alucinar.',
    'Las citas son un snapshot <code>{ chunkId, page, quote }</code> persistido con cada mensaje — al pasar el cursor resaltan el pasaje exacto en el lector.',
  ],
  genTitle: 'Generación — honesta por defecto',
  gen: [
    'El <strong>generador extractivo</strong> arma la respuesta solo con frases que realmente aparecen en los chunks recuperados, cada una con su cita <code>(§ p. N)</code>. Nunca inventa texto.',
    'El <strong>generador Claude</strong> (real, dormido sin key) streamea la Messages API con adaptive thinking y deriva las citas de los marcadores de página que emite.',
    'Los resúmenes de documento (RF-07) se generan igual durante la ingesta.',
  ],
  authTitle: 'Auth y acceso',
  auth: [
    'JWT access (15 min) + refresh rotativo (7 días, guardado como sha256, la detección de reuso revoca la familia).',
    'Hash de contraseñas con argon2, bloqueo tras 5 intentos fallidos, errores de login sin enumeración.',
    'RBAC por guards: <code>WorkspaceAccessGuard</code> / <code>DocumentAccessGuard</code> + <code>@RequireRole</code>.',
  ],
  testTitle: 'Probado donde importa',
  test: [
    '50 tests de backend: chunker, coseno, auth (bloqueo/rotación/reuso), guards de RBAC, validación de subida y el generador extractivo (citas, multi-página, honesto-sin-contexto).',
    'Frontend verificado end-to-end con Playwright en tres breakpoints — login, chat en streaming con citas, RBAC y un flujo real subir→indexar→preguntar.',
  ],
  tradeTitle: 'Trade-offs hechos a propósito',
  trade: [
    'Generación extractiva en vez de un LLM de pago en el demo — el pipeline (recuperación, citas, streaming) es idéntico; solo cambia la redacción final.',
    'Lector de texto paginado en vez de overlay PDF.js completo — las citas son exactas y robustas; el render pixel-perfect de PDF es el siguiente paso obvio.',
    'Cola de ingesta in-process (sin Redis) — más simple de correr y suficiente para la escala del demo.',
  ],
  footer: 'DocuMind · proyecto de portfolio de Luis Chiquito Vera',
};

@Component({
  selector: 'dm-about',
  imports: [RouterLink, BrandMarkComponent, IconComponent, LangToggleComponent],
  template: `
    <header class="abar">
      <div class="container abar-in">
        <a routerLink="/" class="brand-link"><dm-brand /></a>
        <dm-lang-toggle />
      </div>
    </header>

    <article class="about container">
      <a routerLink="/" class="back">
        <dm-icon name="arrow-left" [size]="16" /> {{ t().back }}
      </a>

      <header class="head">
        <span class="mark ai-grad"><dm-icon name="sparkles" [size]="26" /></span>
        <h1>{{ t().title }}</h1>
        <p class="lead" [innerHTML]="t().leadHtml"></p>

        <div class="chips">
          @for (s of stack; track s) {
            <span class="chip">{{ s }}</span>
          }
        </div>

        <div class="actions">
          <a [href]="liveUrl" target="_blank" rel="noreferrer" class="btn btn-primary">
            <dm-icon name="sparkles" [size]="16" /> {{ t().tryDemo }}
          </a>
          <a [href]="repoUrl" target="_blank" rel="noreferrer" class="btn btn-ghost">
            <dm-icon name="arrow-right" [size]="16" /> {{ t().sourceCode }}
          </a>
        </div>

        <p class="creds">
          <strong>{{ t().demoCreds }}</strong>
          <code>owner&#64;documind.dev / Owner1234!</code> ·
          <code>viewer&#64;documind.dev / Viewer1234!</code>
        </p>
      </header>

      <section class="block">
        <h2>{{ t().scopeTitle }}</h2>
        <ul class="ticks">
          @for (item of t().scope; track item) {
            <li><dm-icon name="check" [size]="15" /><span>{{ item }}</span></li>
          }
        </ul>
      </section>

      <section class="block">
        <h2>{{ t().archTitle }}</h2>
        <p class="muted">{{ t().archIntro }}</p>
        <ul class="prose">
          @for (b of t().archBullets; track b) {
            <li [innerHTML]="b"></li>
          }
        </ul>
      </section>

      <section class="block">
        <h2>{{ t().decisionsTitle }}</h2>
        <div class="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>{{ t().decisionsHead[0] }}</th>
                <th>{{ t().decisionsHead[1] }}</th>
                <th>{{ t().decisionsHead[2] }}</th>
              </tr>
            </thead>
            <tbody>
              @for (p of t().decisions; track p.pattern) {
                <tr>
                  <td><strong>{{ p.pattern }}</strong></td>
                  <td>{{ p.where }}</td>
                  <td class="muted">{{ p.why }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <div class="cols">
        <section class="block">
          <h2><dm-icon name="search" [size]="19" /> {{ t().ragTitle }}</h2>
          <ul class="prose">
            @for (x of t().rag; track x) {
              <li [innerHTML]="x"></li>
            }
          </ul>
        </section>
        <section class="block">
          <h2><dm-icon name="sparkles" [size]="19" /> {{ t().genTitle }}</h2>
          <ul class="prose">
            @for (x of t().gen; track x) {
              <li [innerHTML]="x"></li>
            }
          </ul>
        </section>
        <section class="block">
          <h2><dm-icon name="shield-check" [size]="19" /> {{ t().authTitle }}</h2>
          <ul class="prose">
            @for (x of t().auth; track x) {
              <li [innerHTML]="x"></li>
            }
          </ul>
        </section>
        <section class="block">
          <h2><dm-icon name="check-circle" [size]="19" /> {{ t().testTitle }}</h2>
          <ul class="prose">
            @for (x of t().test; track x) {
              <li [innerHTML]="x"></li>
            }
          </ul>
        </section>
      </div>

      <section class="block">
        <h2>{{ t().tradeTitle }}</h2>
        <ul class="prose">
          @for (x of t().trade; track x) {
            <li [innerHTML]="x"></li>
          }
        </ul>
      </section>

      <footer class="afoot">{{ t().footer }}</footer>
    </article>
  `,
  styles: `
    .abar {
      position: sticky;
      top: 0;
      z-index: 30;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
    }
    .abar-in {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--header-h);
    }
    .about {
      max-width: 56rem;
      padding-block: 1.5rem 4rem;
    }
    .back {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ink-500);
      margin-bottom: 1.5rem;
    }
    .back:hover {
      color: var(--ink-900);
    }
    .head {
      text-align: center;
      max-width: 42rem;
      margin: 0 auto 2.5rem;
    }
    .mark {
      width: 3.5rem;
      height: 3.5rem;
      display: inline-grid;
      place-items: center;
      border-radius: 1rem;
      color: #fff;
      margin-bottom: 1rem;
    }
    .head h1 {
      font-size: 2rem;
      letter-spacing: -0.02em;
    }
    .lead {
      margin-top: 0.85rem;
      font-size: 1.02rem;
      line-height: 1.65;
      color: var(--ink-700);
    }
    .lead ::ng-deep strong {
      color: var(--ink-900);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      justify-content: center;
      margin-top: 1.25rem;
    }
    .chip {
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--ink-700);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      padding: 0.25rem 0.7rem;
    }
    .actions {
      display: flex;
      gap: 0.6rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 1.5rem;
    }
    .creds {
      margin-top: 1.25rem;
      font-size: 0.82rem;
      color: var(--ink-500);
    }
    .creds code {
      font-size: 0.78rem;
      background: var(--ink-100);
      border-radius: 4px;
      padding: 0.1rem 0.4rem;
    }

    .block {
      margin-top: 2.25rem;
    }
    .block h2 {
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.85rem;
    }
    .muted {
      color: var(--ink-500);
      line-height: 1.65;
    }
    .ticks {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.55rem;
    }
    .ticks li {
      display: flex;
      gap: 0.6rem;
      align-items: flex-start;
      font-size: 0.92rem;
      line-height: 1.5;
    }
    .ticks dm-icon {
      color: var(--ok);
      margin-top: 0.18rem;
      flex-shrink: 0;
    }
    .prose {
      margin: 0.5rem 0 0;
      padding-left: 1.1rem;
      display: grid;
      gap: 0.6rem;
    }
    .prose li {
      font-size: 0.92rem;
      line-height: 1.6;
      color: var(--ink-700);
    }
    .prose ::ng-deep code,
    .lead ::ng-deep code {
      font-size: 0.82rem;
      background: var(--ink-100);
      border-radius: 4px;
      padding: 0.08rem 0.35rem;
      font-family: 'SFMono-Regular', ui-monospace, monospace;
    }
    .prose ::ng-deep strong {
      color: var(--ink-900);
    }

    .table-wrap {
      overflow-x: auto;
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    th,
    td {
      text-align: left;
      padding: 0.7rem 0.9rem;
      border-bottom: 1px solid var(--border-soft);
      vertical-align: top;
    }
    th {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ink-400);
      background: color-mix(in srgb, var(--ink-100) 40%, transparent);
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    td.muted {
      color: var(--ink-500);
      max-width: 22rem;
    }

    .cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 2.5rem;
    }
    .afoot {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 0.8rem;
      color: var(--ink-400);
      font-family: 'SFMono-Regular', ui-monospace, monospace;
    }

    @media (max-width: 720px) {
      .cols {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
  `,
})
export class AboutComponent {
  protected readonly lang = inject(LanguageService);
  protected readonly t = computed(() => (this.lang.isEs() ? ES : EN));
  protected readonly stack = STACK;
  protected readonly liveUrl = 'https://luisgxz.github.io/DocuMind';
  protected readonly repoUrl = 'https://github.com/LuisGxz/DocuMind';
}
