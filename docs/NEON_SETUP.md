# Lo que tienes que hacer — Neon (Postgres para el deploy) ⏱️ ~3 min

DocuMind necesita un Postgres con la extensión **pgvector** en producción. Azure no lo ofrece gratis, así que usamos **Neon** (Postgres serverless, plan free, sin tarjeta). Tú solo creas el proyecto y me pasas la **connection string**. Yo hago todo lo demás.

---

## Paso 1 — Crea la cuenta

1. Entra a **https://neon.tech** y haz clic en **Sign up**.
2. Inicia sesión con **GitHub** (lo más rápido) o Google. No pide tarjeta.

## Paso 2 — Crea el proyecto

1. Te llevará a **Create your first project** (o botón **New Project**).
2. Rellena:
   - **Project name**: `documind` (o lo que quieras).
   - **Postgres version**: **17** (la que venga por defecto está bien).
   - **Region (Cloud)**: elige **AWS · US East (Ohio)** `us-east-2` si está disponible — es la más cercana a la API en Azure (Central US). Si no, cualquiera de **US East** sirve.
3. Clic en **Create project**.

## Paso 3 — Copia la connection string

Al crear el proyecto, Neon muestra un panel **"Connection string"** (o ve a **Dashboard → Connect**).

1. Verás un dropdown que dice algo como **Pooled connection** / **Direct connection**.
   👉 Elige **Direct connection** (sin "-pooler" en el host). Si solo te da la pooled, también sirve — pásamela igual y yo la ajusto.
2. Asegúrate de que la cadena incluya la contraseña (hay un toggle **Show password** / un icono de ojo). Si ves `:********` en vez de la contraseña, actívalo.
3. Copia la cadena completa. Se ve así:

   ```
   postgresql://documind_owner:npg_XXXXXXXX@ep-cool-name-12345678.us-east-2.aws.neon.tech/documind?sslmode=require
   ```

## Paso 4 — Pégamela aquí

Pega esa línea en el chat y yo me encargo de:

- Guardarla como `DATABASE_URL` en Azure (y en `.azure-secrets.local`, nunca en el repo).
- Correr la migración (`prisma migrate deploy`) → crea el esquema, la extensión `vector` y el índice HNSW.
- Sembrar el corpus demo (workspace + usuarios + 6 contratos con embeddings ya calculados).
- Desplegar la API a Azure y verificar `/health` + un E2E en vivo (login + chat con citas).
- Poner la card de DocuMind en el portfolio.

---

### Notas

- **No tienes que habilitar pgvector a mano** — la migración hace `CREATE EXTENSION vector` (Neon lo permite en free).
- **Seguridad**: la string lleva la contraseña de la DB. Solo se guarda en Azure y en un archivo local gitignored. Si prefieres, después de que termine puedes **rotar la contraseña** en Neon (Dashboard → Roles → Reset password) y me pasas la nueva; tarda 1 min en reconfigurar.
- **Free tier**: 0.5 GB de almacenamiento y se "duerme" tras inactividad — más que suficiente para el demo; el primer request tras dormir tarda ~1 s en despertar.

> ¿Atascado en algún paso? Dime en qué pantalla estás y te guío.
