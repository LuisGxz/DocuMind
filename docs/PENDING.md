# DocuMind — Pendientes (hacer después)

> Cosas conscientemente diferidas durante el build. Revisar antes de F7 (entrega) o cuando se indique.

## Infraestructura / deploy (F7)
- [ ] **Provisionar Neon** (Postgres serverless free) + habilitar `vector` y correr `prisma migrate deploy` + seed. La connection string la pone el usuario en `.azure-secrets.local` (no tengo acceso a Neon).
- [ ] **Deploy API en Azure App Service** (Node, free) con app settings (DATABASE_URL Neon, JWT secrets, sin ANTHROPIC key → modo extractivo, CORS).
- [ ] **Front en GitHub Pages** (`--base-href /DocuMind/`, 404 SPA, API base inyectada en build).
- [ ] **CI** (lint + build + test backend y frontend) + workflow keep-warm de la API.
- [ ] **Embeddings ONNX en free-tier (F1)**: precomputar embeddings del seed o cachear el modelo en el build para no castigar el cold start de App Service F1.

## LLM
- [ ] **Wirear el adapter Claude real** (`@anthropic-ai/sdk`, claude-opus-4-8 / claude-haiku-4-5, streaming) detrás de `AnswerGenerator`; activarlo solo si `ANTHROPIC_API_KEY` está presente. Por defecto sigue el extractivo determinista (F4 construye ambos).

## Documentos (F3 — diferido dentro de la fase)
- [ ] **Persistir el archivo original** (bytea / blob store) para: (a) re-extracción fiel en *reprocess* y (b) botón de **descarga** del documento. Por ahora el visor y el reprocess reconstruyen el texto desde los chunks (suficiente para el demo, pero no es el binario original).
- [ ] **Resumen automático del documento** (RF-07): se genera en F4 con `AnswerGenerator` (extractivo/Claude). En F3 el campo `summary` queda nulo hasta entonces.
- [ ] Probar la ruta de **PDF real** (subir un PDF de verdad): el extractor pdf-parse v2 está implementado pero el seed usa texto; falta un test con un PDF binario.

## Visor
- [ ] **Visor PDF real (PDF.js)** como mejora futura. Hoy se renderiza el **texto extraído** paginado (citas mapean al chunk exacto, sin coordenadas frágiles) — decisión consciente, documentada en TECHNICAL.

## Tests
- [ ] Test de integración del **modelo de embeddings real** fuera de jest (jest rompe el realm de `Float32Array` de onnxruntime). Hoy se valida vía seed + retrieval pgvector.
