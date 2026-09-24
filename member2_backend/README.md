# MEMBER 2 — BACKEND ORCHESTRATION ENGINE
**CrimeNet AI — AI-Powered Criminal Network Analysis System**
**SIH Problem ID:** SIH26189 | **Role:** M2 — Backend Engineer | **Exclusive Directory:** member2_backend/

---

## 1. Executive Architecture Overview

The CrimeNet AI Backend service acts as the **central unified API and orchestration gateway** connecting the investigator user interface (member1_frontend) with specialized downstream microservices:
* **M3 (Data Engineering & Neo4j Graph):** Knowledge graph storage, Cypher queries, entities & relationships.
* **M4 (AI / NLP / OCR):** Document OCR, Named Entity Recognition, entity resolution, and grounded AI assistant.
* **M5 (Graph Intelligence & ML):** Shortest paths, multi-hop expansions, community detection, and temporal graph algorithms.
* **M6 (Security, Evidence & Ledger):** Supabase Auth, RBAC permissions, SHA-256 evidence integrity ledger, and Bharatiya Sakshya Adhiniyam (BSA) Section 65B electronic compliance certificates.

`
   ┌──────────────────────────────────────────────────────────────────┐
   │             M1: Investigator UI (Next.js / Cytoscape)             │
   └────────────────────────────────┬─────────────────────────────────┘
                                    │ HTTP / REST / WebSockets
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   M2: FastAPI Backend Engine (Port 8000)               │
│  - API Orchestration Gateway         - Pydantic v2 Request/Response    │
│  - Normalized Entity Schemas (11)    - Celery/Redis Job Orchestration  │
│  - Real-Time WebSocket Hub           - Tamper-Evident Structured Errors│
└───────┬─────────────────┬──────────────────┬───────────────────┬───────┘
        │                 │                  │                   │
        ▼                 ▼                  ▼                   ▼
 ┌─────────────┐   ┌─────────────┐    ┌─────────────┐    ┌───────────────┐
 │ M3: Neo4j   │   │ M4: OCR/NLP │    │ M5: Graph ML│    │ M6: Security  │
 │ Graph Data  │   │ Grounded AI │    │ Analytics   │    │ & BSA Ledger  │
 └─────────────┘   └─────────────┘    └─────────────┘    └───────────────┘
`

---

## 2. Tech Stack & Dependencies

* **Framework:** FastAPI >= 0.110.0 (Asynchronous ASGI)
* **Runtime:** Python >= 3.11 / 3.14
* **Validation & Schemas:** Pydantic v2 & Pydantic-Settings
* **Background Queue:** Celery with Redis broker and result backend
* **Real-time Engine:** WebSockets for alerts, dataset progress, and graph updates
* **Security & Auth:** Integration with M6 Supabase Auth & JWT verification
* **Testing:** Pytest & FastAPI TestClient

---

## 3. SIH Demo Story Walkthrough

The backend orchestrates the canonical multi-hop criminal syndicate investigation chain:

\text{FIR} \xrightarrow{} \text{Person A} \xrightarrow{} \text{Phone} \xrightarrow{} \text{Person B} \xrightarrow{} \text{Bank Account} \xrightarrow{} \text{Transaction} \xrightarrow{} \text{Organization} \xrightarrow{} \text{Location} \xrightarrow{} \text{Crime}

1. **FIR No. 8841/2024 (FIR-2024-8841):** Registered at Nhava Sheva Port Police Station.
2. **Person A (PER-001 - Vikram Malhotra):** Accused customs clearing agent.
3. **Phone (PHO-001 - +91-9876543210):** Registered to Vikram Malhotra.
4. **Person B (PER-002 - Rajesh Sharma):** Logistics coordinator communicating via 46 calls.
5. **Bank Account (ACC-001 - HDFC-99214430):** Current account of Shadow Logistics Ltd.
6. **Transaction (TXN-2024-8812):** RTGS remittance of INR 45,00,000 without trade invoices.
7. **Organization (ORG-001 - Shadow Logistics Ltd):** Shell freight forwarding company.
8. **Location (LOC-001 - Godown #4, JNPT):** Offloading facility for illicit cargo.
9. **Crime (CRM-001):** Gold & Narcotics Contraband Smuggling Syndicate.

---

## 4. API Endpoints Catalog

### Authentication & RBAC (/api/v1/auth)
* POST /api/v1/auth/login — Authenticate investigator and issue JWT.
* GET /api/v1/auth/me — Return authenticated user profile and permissions.
* POST /api/v1/auth/check-permission — Evaluate fine-grained RBAC permissions.

### Case Management (/api/v1/cases)
* POST /api/v1/cases — Create new investigation case.
* GET /api/v1/cases — List cases with status and priority filtering.
* GET /api/v1/cases/{id} — Get case detail with entities, graph edges, timeline, and audit metadata.
* PUT /api/v1/cases/{id} & PATCH /api/v1/cases/{id} — Update case properties and notes.

### Normalized Entities (/api/v1/entities)
Normalized query endpoints across all 11 canonical types:
* GET /api/v1/entities/persons
* GET /api/v1/entities/phones
* GET /api/v1/entities/bank-accounts
* GET /api/v1/entities/vehicles
* GET /api/v1/entities/locations
* GET /api/v1/entities/organizations
* GET /api/v1/entities/firs
* GET /api/v1/entities/crimes
* GET /api/v1/entities/transactions
* GET /api/v1/entities/communications
* GET /api/v1/entities/evidence
* GET /api/v1/entities/{id} — Retrieve any normalized entity by canonical ID.

### Graph Orchestration (/api/v1/graph)
* POST /api/v1/graph/expand — Multi-hop neighborhood expansion ($-hop traversal).
* POST /api/v1/graph/relationships — Query relationships between source and target nodes.
* POST /api/v1/graph/subgraph — Extract induced subgraph for given entity IDs.
* POST /api/v1/graph/shortest-path — Find shortest connection path between 2 entities (via M5).
* POST /api/v1/graph/multi-hop — Discover target entity types within $ hops (via M5).
* POST /api/v1/graph/filter — Filter graph by entity types, relationship types, dates, and sources.

### Universal Search Engine (/api/v1/search)
* POST /api/v1/search — Search across Person, Phone, Account, Vehicle, Location, Org, FIR, Crime, Transaction, Communication, Case, Evidence, Alias. Supports ID, name, date, location, and source filters.

### Timeline & Temporal Playback (/api/v1/timeline)
* GET /api/v1/timeline — Query chronological case events.
* GET /api/v1/timeline/playback — Generate chronological animation frames with cumulative active nodes and active edges.

### Data Ingestion Orchestration (/api/v1/ingest)
* POST /api/v1/ingest/upload — Upload CSV, PDF, Scanned Document, FIR, CDR, Bank Transactions, Police Reports, Evidence Documents. Returns processing states (Uploaded, Validating, Processing, Completed, Failed) and record summaries.
* GET /api/v1/ingest/jobs/{jobId} — Poll ingestion and extraction job status.

### Background Job Status (/api/v1/jobs)
* GET /api/v1/jobs/{jobId} — Query background job execution progress, start time, completion time, and error logs.

### Evidence-Grounded AI Assistant (/api/v1/ai)
* POST /api/v1/ai/query — Natural language Q&A communicating with M4. Preserves:
  * nswer: Grounded factual summary.
  * supportingEntities: Identified entities with roles.
  * supportingEvidence: Evidence items with SHA-256 hashes.
  * graphPath: Explanatory multi-hop traversal hops.
  * confidenceContext: Source provenance metadata.

### Alerts & Anomaly Feed (/api/v1/alerts)
* GET /api/v1/alerts — Stream alerts: Watchlist Match, Anomaly, Contradiction, New Relationship, Evidence Integrity Mismatch, Communication Pattern, Transaction Pattern, Relevant Case Connection.
* POST /api/v1/alerts/{alertId}/acknowledge — Resolve/acknowledge active alert.

### Target Watchlist (/api/v1/watchlist)
* POST /api/v1/watchlist — Add person, phone, bank account, vehicle, or org to real-time watchlist.
* GET /api/v1/watchlist — List monitored targets.
* DELETE /api/v1/watchlist/{watchId} — Deactivate monitored target.

### Comprehensive Reports (/api/v1/reports)
* POST /api/v1/reports/generate — Multi-section report generator (Case summary, Key entities, Network findings, Timeline, Evidence integrity, BSA Section 65B Electronic Certificate).

### Executive Dashboard (/api/v1/dashboard)
* GET /api/v1/dashboard/stats — Aggregated counts across 10 entity types, active cases, alerts, watchlists, evidence, and network statistics.

### Tamper-Evident Audit (/api/v1/audit)
* GET /api/v1/audit/logs — Query immutable system audit trails.

### Real-Time WebSockets (/ws)
* WebSocket endpoint supporting client subscriptions to: lerts, jobs, graph, cases, 
otifications.

---

## 5. Environment Variables & Configuration

Configure via .env file or environment variables:

| Variable | Default | Description |
|---|---|---|
| BACKEND_PORT | 8000 | FastAPI server port |
| API_V1_STR | /api/v1 | API version prefix |
| REDIS_URL | 
edis://localhost:6379/0 | Redis caching & WebSocket pub/sub |
| CELERY_BROKER_URL | 
edis://localhost:6379/1 | Celery task queue broker |
| CELERY_RESULT_BACKEND | 
edis://localhost:6379/2 | Celery task result backend |
| M3_DATA_GRAPH_SERVICE_URL | http://localhost:8003 | M3 Neo4j & Data microservice |
| M4_AI_NLP_SERVICE_URL | http://localhost:8004 | M4 OCR, NLP & Grounded AI service |
| M5_GRAPH_ML_SERVICE_URL | http://localhost:8005 | M5 Graph Intelligence service |
| M6_SECURITY_SERVICE_URL | http://localhost:8006 | M6 Security & Evidence Ledger service |
| DOWNSTREAM_FALLBACK_MODE | True | Standalone high-fidelity demo mode |

---

## 6. How to Run & Test

### Run FastAPI Locally:
`ash
# From member2_backend/
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
`

### Run Celery Background Worker:
`ash
celery -A app.celery_app.worker.celery_app worker --loglevel=info
`

### Run Test Suite:
`ash
pytest tests/test_api.py -v
`

### Run via Docker Compose:
`ash
docker-compose up --build
`

---

## 7. Compliance & Anti-Hallucination Guarantees

* **Zero Risk-Score Policy:** No 
isk_score, 
isk_label, criminal probability, or fake threat score is generated or stored.
* **BSA Section 65B Electronic Admissibility:** Cryptographic SHA-256 evidence integrity certificates anchored with M6 ledger.
* **Strict Evidence Grounding:** AI queries require concrete evidence and entity provenance.
* **Never Leak Secrets:** Error responses strip database credentials, API tokens, and internal stack traces.
