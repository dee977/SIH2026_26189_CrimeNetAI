# CrimeNet AI — Deployment Guide

CrimeNet AI is deployed as a single Render web service. FastAPI serves both the backend API and the compiled React/Vite frontend.

---

## Deployment Architecture

```text
Render
   |
   +-- FastAPI Backend
   +-- React/Vite Static Build
   |
   +-- Supabase PostgreSQL
   +-- Supabase Auth
   +-- Supabase Storage
   +-- Remote Neo4j
   +-- Redis
```

---

## Repository Structure

```text
SIH2026_26189_CrimeNetAI/
│
├── member1_frontend/
├── member2_backend/
├── docs/
├── scripts/
├── render.yaml
└── requirements.txt
```

---

## Render Configuration

### Service Type

```text
Web Service
```

### Root Directory

```text
/
```

### Build Command

```bash
cd member1_frontend && npm install && npm run build && cd ../member2_backend && pip install -r requirements.txt
```

### Start Command

```bash
cd member2_backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Health Check Path

```text
/api/v1/health
```

---

## Environment Variables

Set these in Render → Environment:

```env
APP_ENV=production
APP_NAME=CrimeNet AI
SECRET_KEY=strong-production-secret
FRONTEND_ORIGIN=[https://your-app.onrender.com](https://your-app.onrender.com)

DATABASE_URL=postgresql://...

SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_STORAGE_BUCKET=case-documents

NEO4J_URI=neo4j+s://your-neo4j-host
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-neo4j-password
NEO4J_DATABASE=neo4j

REDIS_URL=redis://...
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

---

## Frontend Configuration

The frontend must use a relative API base URL in production:

```env
VITE_API_BASE_URL=/api/v1
```

Do not use:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## FastAPI Static File Serving

In production, FastAPI should serve the compiled frontend from:

```text
member1_frontend/dist
```

Example:

```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="../member1_frontend/dist", html=True), name="frontend")
```

API routes must be registered before the SPA catch-all route.

---

## Supabase Setup

1. Create a Supabase project.
2. Enable Email Auth.
3. Create a private Storage bucket:

```text
case-documents
```

4. Configure Storage access policies.
5. Copy project URL, anon key, service-role key, and JWT secret into Render environment variables.

---

## Neo4j Setup

Use Neo4j Aura or a managed Neo4j instance.

Recommended:

- Neo4j 5.x
- Strong password
- Restricted network access
- Regular backups
- Query timeout configuration
- Indexes on `case_id`, `person_id`, `fir_id`, `transaction_id`, and `call_id`

---

## Redis Setup

Redis is used for asynchronous jobs such as:

- CSV ingestion
- OCR
- NLP extraction
- Graph projection
- Embedding generation
- Report generation

Use managed Redis or Render Redis.

---

## Deployment Checklist

- [ ] Frontend builds successfully.
- [ ] Backend starts successfully.
- [ ] `/api/v1/health` returns `200 OK`.
- [ ] Frontend loads from FastAPI.
- [ ] Login works using Supabase Auth.
- [ ] Case creation works.
- [ ] Case membership authorization works.
- [ ] Neo4j connection works.
- [ ] Graph queries are case-scoped.
- [ ] Evidence upload works.
- [ ] SHA-256 verification works.
- [ ] Signed URL access works.
- [ ] Audit logs are created.
- [ ] No `.env` or secret is committed to GitHub.

---

## Post-Deployment Verification

Open:

```text
[https://your-app.onrender.com/api/v1/health](https://your-app.onrender.com/api/v1/health)
```

Expected response:

```json
{
  "status": "ok",
  "service": "crimenet-ai"
}
```

Then open:

```text
[https://your-app.onrender.com/](https://your-app.onrender.com/)
```

The React application should load successfully.
