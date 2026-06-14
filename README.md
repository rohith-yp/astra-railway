# ASTRA Rail

ASTRA Rail is a React/Vite dashboard backed by FastAPI, deployed as one Vercel project and one origin.

## Deployment Architecture

- Vercel builds the frontend from `frontend/` into static assets.
- `api/index.py` exposes the FastAPI application as one Python Function.
- `vercel.json` sends `/api/*` to FastAPI and all other paths to the React app.
- The frontend uses relative URLs only. No backend base URL is required.

Primary routes:

```text
/api/health
/api/predict
/api/analyze
```

The dashboard also uses relative `/api/data/*` routes for its datasets. No request uses an absolute backend origin.

## Deploy To Vercel

1. Import the repository as a single Vercel project.
2. Keep the project Root Directory set to the repository root.
3. Add these Environment Variables for Production, Preview, and Development as needed:

```text
GROQ_API_KEY
MISTRAL_API_KEY
```

4. Deploy. The committed `vercel.json` supplies the install command, frontend build command, output directory, API rewrite, and SPA fallback.

Do not create a second backend project or configure a frontend backend URL.

## Local Development

For the closest match to production routing, use Vercel CLI from the repository root:

```bash
vercel dev
```

Alternatively, run FastAPI directly for backend work:

```bash
python -m uvicorn backend.main:app --reload --port 8000
```

The Vite frontend always calls relative `/api/*` paths.

## Environment Variables

Local `.env` files are ignored by Git. Copy `backend/.env.example` and provide local values when needed. In Vercel, configure the variables in Project Settings. API keys are read from the server process environment and are never persisted from browser input.

Without valid keys, the application uses its deterministic demo responses.

`GET /api/health` confirms database availability and reports whether each provider key is configured without exposing its value or making a billable AI request.

## Serverless Storage

Vercel Functions expose writable temporary storage under `/tmp`. The demo SQLite database is initialized there on each cold function instance. It is intentionally ephemeral; durable production state would require an external database.

An optional `DATABASE_URL` overrides the default SQLite location. Ensure the matching SQLAlchemy database driver is included before using a non-SQLite URL.

## Verification

```bash
npm --prefix frontend run build
python -m pip install -r backend/requirements-dev.txt
python -m pytest backend/test_endpoints.py
```
