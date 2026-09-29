# CrimeNet AI — Local Development & Dynamic Execution Guide (SIH 2026 – SIH26189)

This guide documents how to run CrimeNet AI in **Fully Dynamic Mode** connected directly to the real Supabase PostgreSQL database on port 5432.

---

## 1. Architecture & Dynamic Pipeline

CrimeNet AI no longer relies on hardcoded static files (`syntheticData.ts`, `caseGraphs.ts`). All core modules query live backend APIs backed by Supabase PostgreSQL:

```
┌─────────────────────────────────────────────────────────────┐
│                    CrimeNet AI Frontend                     │
│    (Vite + React + Tailwind + Cytoscape.js + Recharts)      │
│                 http://localhost:5173                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ API Requests / JWT Bearer
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    CrimeNet AI Backend                      │
│                (FastAPI / Uvicorn API Gateway)              │
│                 http://localhost:8000                       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼ DIRECT_URL (Port 5432)        ▼ JWT Verification
┌────────────────────────────────────────┐ ┌──────────────────┐
│         Supabase PostgreSQL            │ │  Supabase Auth   │
│  - cases                               │ │  (JWKS / Tokens) │
│  - entities (43+ seeded)               │ └──────────────────┘
│  - relationships (29+ graph edges)     │
│  - evidence_items (SHA-256 / BSA §65B) │
│  - alerts & watchlist                  │
└────────────────────────────────────────┘
```

---

## 2. Environment Configuration

### Backend: `member2_backend/.env`
```env
PROJECT_NAME=CrimeNet AI Backend
ENVIRONMENT=development
DEBUG=True
API_V1_STR=/api/v1
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Supabase Auth
SUPABASE_URL=https://jzdrpxsyuyuxkabpgfwr.supabase.co
SUPABASE_KEY=sb_publishable_Z2PmIQ6XiTe01Xijp_zyQA_C1nxJdKo

# PostgreSQL Connection (DIRECT_URL on port 5432 for SQLAlchemy)
DATABASE_URL=postgresql://postgres.jzdrpxsyuyuxkabpgfwr:VaghasiyaDeep%402008@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.jzdrpxsyuyuxkabpgfwr:VaghasiyaDeep%402008@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

# Safety net fallback if external microservices are offline
DOWNSTREAM_FALLBACK_MODE=True
UPLOAD_DIR=./uploads
```

### Frontend: `member1_frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://jzdrpxsyuyuxkabpgfwr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Z2PmIQ6XiTe01Xijp_zyQA_C1nxJdKo
```

> [!WARNING]
> **Key Rotation Advisory:** If database passwords or service role keys were committed to public repositories or shared in unencrypted channels, rotate them immediately in the [Supabase Project Dashboard](https://supabase.com/dashboard/project/jzdrpxsyuyuxkabpgfwr/settings/database).

---

## 3. Database Migration & Table Creation

To initialize all required relational tables (`cases`, `entities`, `relationships`, `evidence_items`, `alerts`, `watchlist_items`, `user_profiles`, `case_memberships`, `ingestion_jobs`) in Supabase:

```powershell
cd member2_backend
.\venv\Scripts\python.exe scripts\create_tables.py
```

---

## 4. Seeding Realistic Intelligence Data

To insert 6 active investigation cases, 40+ normalized multi-modal entities, graph relationships, cryptographic evidence records, and system alerts into Supabase:

```powershell
cd member2_backend
.\venv\Scripts\python.exe scripts\seed_data.py
```

---

## 5. Starting the Services

### Start Backend (Port 8000):
```powershell
cd member2_backend
.\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/v1/health`

### Start Frontend (Port 5173):
```powershell
cd member1_frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Web Application: `http://localhost:5173`

---

## 6. Creating / Authenticating Real Users in Supabase Auth

1. Go to your shared Supabase Dashboard: `https://supabase.com/dashboard/project/jzdrpxsyuyuxkabpgfwr/auth/users`
2. Click **Add User** -> **Create User**.
3. Enter email (e.g. `inspector.rajesh@crimenet.gov.in`) and a password.
4. Check **Auto Confirm User?** -> Click **Create User**.
5. On `http://localhost:5173/login`, log in with these credentials.
6. The backend automatically provisions the user in PostgreSQL with `role='INVESTIGATOR'` and full system permissions.

---

## 7. How to Go Fully Dynamic

1. **Dashboard:**
   - Navigating to `/dashboard` triggers `GET /api/v1/dashboard/stats`, querying live counts directly from PostgreSQL tables (`entities`, `relationships`, `cases`, `evidence_items`).
   - Active investigations list, real-time alerts, and evidence items render dynamically from `/cases`, `/alerts`, and `/evidence`.

2. **Network Graph:**
   - The graph view calls `GET /api/v1/graph?case_id=...` to load real entities and edges from Supabase.
   - You can toggle between **Live Database** (default) and **Demo Mode (Static)** in the graph view toolbar.

3. **Multi-Modal Evidence Ingestion:**
   - In the **Import Center** (`/ingest`), uploading a CSV, PDF, or image automatically parses text, extracts persons/phones/accounts/organizations, registers an immutable SHA-256 evidence record in PostgreSQL, and creates new nodes and relationships in the live network graph.
