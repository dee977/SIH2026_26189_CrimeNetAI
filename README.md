# CrimeNet AI

**SIH 2026 Problem Statement: 26189 — AI-Powered Criminal Network Analysis System**  
**Organization:** Ministry of Home Affairs | **Department:** NCRB, Women Safety Division  
**Theme:** Blockchain & Cybersecurity

CrimeNet AI is an investigative intelligence platform that helps authorized law-enforcement users analyze FIRs, communication records, financial transactions, documents, and entity relationships. It builds a case-scoped knowledge graph, surfaces investigative leads, verifies evidence integrity, and generates explainable investigation reports.

> **Important:** CrimeNet AI does not declare any person guilty and does not generate criminal-probability or “guilt scores.” All AI-assisted findings are investigative leads that must be reviewed by authorized investigators.

---

## 🚨 Problem Statement

Modern criminal activity is often organized through networks of individuals, intermediaries, financial channels, communication links, locations, and events. Investigators must manually connect fragmented data from FIRs, CDRs, transaction records, documents, and field reports.

CrimeNet AI addresses this by:

- Ingesting structured and unstructured investigation data.
- Extracting entities such as persons, phone numbers, organizations, locations, and financial accounts.
- Building relationship maps across cases and evidence.
- Identifying influential entities, communities, hidden paths, and unusual patterns.
- Providing a secure, case-isolated investigation workspace.
- Producing evidence-aware and explainable reports.

The official SIH26189 objective focuses on uncovering hidden networks, identifying key influencers, detecting suspicious patterns, and providing actionable intelligence to investigators. [49]

---

## ✨ Key Features

### Case Management
- Create and manage investigation cases.
- Assign investigators, analysts, auditors, and administrators.
- Role-based access control.
- Strict case-level authorization.
- Case-specific dashboards, notes, alerts, evidence, and reports.

### Investigation Workspace
- Case dossier with metadata, team, metrics, and activity.
- Entity Explorer for persons, organizations, accounts, phones, and locations.
- Network Graph for visual relationship analysis.
- Timeline for events across FIRs, communications, transactions, and evidence.
- Alerts and watchlists.
- Investigation notes and activity history.

### Data Ingestion
- CSV ingestion for persons, financial transactions, communication records, and criminal relationships.
- FIR/document upload with OCR and NLP-based extraction.
- Ingestion-job tracking: uploaded, validating, extracting, processing, indexing, completed, failed.
- Source-record traceability for imported data.

### Knowledge Graph
- Neo4j-powered graph of persons, FIRs, transactions, communications, and relationships.
- Multi-hop path analysis.
- Shortest-path and hidden-relationship discovery.
- Community detection.
- Centrality analysis.
- Case-scoped graph visualization.

### AI-Assisted Investigation
- Grounded AI assistant over case data.
- Answers include retrieved records, evidence references, and source IDs.
- Explicit `INSUFFICIENT EVIDENCE` or `DATA NOT FOUND` response when supporting data is unavailable.
- Entity extraction and candidate entity-resolution suggestions.
- Human-in-the-loop review before records are merged.

### Evidence Integrity
- SHA-256 hashing of uploaded evidence.
- Evidence metadata and verification status.
- Chain-of-custody events.
- Private Supabase Storage bucket.
- Short-lived signed URLs for authorized access.
- Audit trail for uploads, access, verification, and report generation.

### Analytics
- Degree, betweenness, PageRank, and closeness centrality.
- Louvain community detection.
- Transaction and communication pattern analysis.
- Circular-transfer and burst-activity indicators.
- Cross-verification between communication, location, transaction, and FIR data.
- Explainable investigative leads with source-record references.

### GIS
- Case-scoped location intelligence.
- FIR locations, transaction locations, communication locations, and entity addresses.
- Honest handling of unavailable or low-precision location data.
- No fabricated coordinates.

---

## 🧠 Responsible AI Principles

CrimeNet AI is designed as a **decision-support system**, not an automated decision-making system.

- AI outputs are always linked to source records.
- The system does not automatically merge entities.
- The system does not assign guilt, criminal probability, or risk scores to individuals.
- Suspicious patterns are shown as investigative leads.
- Investigators can accept, reject, annotate, or escalate AI findings.
- If evidence is missing, the assistant states that evidence is insufficient rather than generating an unsupported answer.

This aligns with responsible-AI expectations around human oversight and managing generative-AI confabulation risks. [31][32]

---

## 🏗️ Architecture

```text
                    CRIMENET AI
                         |
              React + Vite Frontend
                         |
                  FastAPI Backend
                         |
        +----------------+----------------+
        |                |                |
   PostgreSQL          Neo4j          Supabase
   / Supabase         Graph DB        Storage/Auth
        |                |                |
  Cases              Persons         FIR PDFs
  Users              FIRs            CDR files
  Memberships        Transactions    Evidence
  Evidence           Communications  Reports
  Notes              Relationships
  Alerts             Communities
  Watchlist          Paths
  Audit
                         |
              AI / NLP / Graph Analytics
                         |
       +----------------+----------------+
       |                |                |
      OCR              NLP           Analytics
      NER        Entity Resolution    Centrality
      RAG        Relationship Extraction  Communities
                                       Anomalies
```

### Data Responsibility

| Concern | System |
|---|---|
| Users, cases, memberships, evidence metadata, audit, workflow | PostgreSQL / Supabase |
| Original evidence files | Supabase Storage |
| Relationship traversal, paths, graph analytics | Neo4j |
| Raw structured records | PostgreSQL staging/canonical tables |
| OCR text, extracted entities, embeddings | Derived artifacts linked to evidence |

Neo4j is used for relationship intelligence and graph traversal. PostgreSQL/Supabase remains the source of truth for application state, authorization, evidence metadata, and audit records.

---

## 🛠️ Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router
- Cytoscape.js
- Recharts
- Leaflet
- Lucide Icons

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy
- PostgreSQL
- Neo4j Python Driver
- Supabase Client
- JWT / JWKS Authentication
- ReportLab
- Celery / Redis for asynchronous processing where required

### AI / ML
- spaCy
- Transformer-based NLP models
- scikit-learn
- NetworkX
- TF-IDF
- Jaro-Winkler
- Soundex / Double Metaphone
- Isolation Forest
- Louvain community detection
- PyTorch where model training or inference is required

### Data / Infrastructure
- PostgreSQL / Supabase
- Neo4j
- Supabase Storage
- Redis
- Render

---

## 📁 Repository Structure

```text
SIH2026_26189_CrimeNetAI/
│
├── member1_frontend/
│   ├── src/
│   ├── components/
│   ├── services/
│   ├── store/
│   ├── App.tsx
│   ├── main.tsx
│   └── vite.config.ts
│
├── member2_backend/
│   ├── app/
│   │   ├── api/v1/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── models.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
│
├── member3_data_graph/
│   ├── datasets/
│   │   ├── persons.csv
│   │   ├── financial_transactions.csv
│   │   ├── communication_links.csv
│   │   └── criminal_relationships.csv
│   ├── ingestion.py
│   └── config.py
│
├── member4_ai_nlp/
│   └── ...
│
├── member5_graph_ml/
│   └── ...
│
├── member6_security_evidence_deployment/
│   └── ...
│
├── docs/
├── LOCAL_SETUP.md
└── README.md
```

---

## 📊 Dataset Overview

The repository includes development/demo datasets for validating ingestion, graph construction, analytics, and AI workflows.

| Dataset | Approx. Records | Purpose |
|---|---:|---|
| `persons.csv` | 10,000 | Person/entity records |
| `financial_transactions.csv` | 200,000 | Financial-flow analysis |
| `communication_links.csv` | 250,000 | CDR/communication analysis |
| `criminal_relationships.csv` | 30,000 | FIR and co-accused relationships |

### Graph Scale

```text
Person nodes:          ~10,000
FIR nodes:             ~30,000
Transaction nodes:    ~200,000
Communication nodes:  ~250,000
---------------------------------
Total nodes:          ~490,000

CO_ACCUSED_WITH:       ~30,000
NAMED_IN_FIR:          ~60,000
TRANSFERRED_FUNDS:    ~200,000
COMMUNICATED_WITH:    ~250,000
---------------------------------
Total relationships:  ~540,000
```

Synthetic or sample datasets are used only for development and demonstration. They are clearly separated from real production data.

---

## 🔐 Security and Access Control

CrimeNet AI follows a backend-first authorization model:

```text
Frontend permission
        ↓
Backend authorization
        ↓
Case membership check
        ↓
PostgreSQL / Neo4j case-scoped query
        ↓
Authorized result
```

### Roles

| Role | Capability |
|---|---|
| `ADMIN` | User and role administration, system configuration |
| `INVESTIGATOR` | Case investigation, evidence review, graph analysis, reports |
| `ANALYST` | Data analysis, graph exploration, pattern review |
| `AUDITOR` | Evidence verification, audit review, compliance-oriented access |

### Security Principles

- JWT signature, expiration, issuer, audience, and claims are validated on the backend.
- Frontend UI restrictions are not treated as security controls.
- Every case-scoped API request validates case membership.
- Neo4j queries are scoped by `caseId`.
- Supabase Storage buckets are private.
- Files are accessed through short-lived signed URLs.
- Service-role credentials are never exposed to the frontend.
- Audit logs record actor, action, object, case, timestamp, and outcome.

Supabase recommends validating JWT signatures before trusting claims and keeping service-role credentials server-side because they bypass Row Level Security. [3][5][6] OWASP also identifies Broken Object Level Authorization as a critical API risk when object IDs are accepted without server-side authorization checks. [34]

---

## 🧾 Evidence Integrity

Every uploaded evidence item follows this lifecycle:

```text
Original File
     ↓
SHA-256 Hash
     ↓
Evidence Metadata
     ↓
Supabase Storage
     ↓
Evidence Record in PostgreSQL
     ↓
OCR / NLP / Derived Artifacts
     ↓
Investigator Review
     ↓
Report / Audit Trail
```

Evidence records include:

- Evidence ID and case ID
- Original filename and MIME type
- SHA-256 hash
- Hash verification status and timestamp
- Storage bucket and object path
- Uploader and upload timestamp
- Collection source and collection time
- Chain-of-custody events
- OCR/extraction job references
- Legal-hold and disclosure status
- Audit history

SHA-256 is used to detect modification after hashing. The platform also maintains custody, provenance, and verification records to support investigative and audit workflows.

---

## 🚀 Local Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL or Supabase project
- Neo4j 5.x
- Redis, if using asynchronous ingestion
- Supabase Storage bucket

### 1. Clone the repository

```bash
git clone [https://github.com/](https://github.com/)<your-username>/SIH2026_26189_CrimeNetAI.git
cd SIH2026_26189_CrimeNetAI
```

### 2. Frontend setup

```bash
cd member1_frontend
npm install
cp .env.example .env
npm run dev
```

Example frontend environment:

```env
VITE_API_BASE_URL=/api/v1
```

### 3. Backend setup

```bash
cd ../member2_backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 4. Environment variables

Create `.env` inside `member2_backend/`:

```env
# Application
APP_ENV=development
SECRET_KEY=change-this-in-production
FRONTEND_ORIGIN=http://localhost:5173

# PostgreSQL / Supabase
DATABASE_URL=postgresql://user:password@host:5432/crimenet

# Supabase
SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-secret
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_STORAGE_BUCKET=case-documents

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# Redis
REDIS_URL=redis://localhost:6379/0
```

> Never commit `.env`, service-role keys, database credentials, or Supabase secrets to GitHub.

### 5. Run ingestion

```bash
cd ../member3_data_graph
pip install -r requirements.txt
python ingestion.py
```

---

## ☁️ Deployment

The project is designed for deployment on Render as a single web service.

### Build Command

```bash
cd member1_frontend && npm install && npm run build
```

### Start Command

```bash
cd member2_backend && pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

FastAPI serves:

- `/api/v1/*` backend APIs
- `/ws` WebSocket endpoints
- Compiled React/Vite frontend

The frontend uses relative API paths such as `/api/v1` in production instead of hardcoded localhost URLs.

External services:

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Remote Neo4j

---

## 📈 Current Implementation Status

| Module | Status |
|---|---|
| Case management | Implemented / In progress |
| Authentication and RBAC | Implemented / In progress |
| Case isolation | Implemented / Under verification |
| CSV ingestion | Implemented |
| Neo4j graph ingestion | Implemented |
| Network graph visualization | Implemented |
| Graph analytics | Implemented / In progress |
| Timeline | Implemented / In progress |
| Evidence upload and hashing | Implemented |
| OCR and document processing | In progress |
| Entity resolution | In progress |
| AI assistant | In progress |
| GIS map | In progress |
| Investigation reports | In progress |
| Audit trail | In progress |

Update this table before final submission so it accurately reflects the working prototype.

---

## 🧪 Testing

Run backend tests:

```bash
cd member2_backend
pytest
```

Recommended test coverage:

- Authentication and JWT validation.
- Role-based access control.
- Case-membership authorization.
- Cross-case access denial.
- Neo4j case-scoped queries.
- Evidence upload and SHA-256 verification.
- CSV ingestion validation.
- AI response grounding and insufficient-evidence handling.

---

## 📚 Documentation

- `LOCAL_SETUP.md` — local development instructions.
- `docs/architecture.md` — system architecture and data flow.
- `docs/database-schema.md` — PostgreSQL schema.
- `docs/neo4j-model.md` — graph model and Cypher queries.
- `docs/security.md` — authentication, RBAC, and authorization model.
- `docs/evidence-integrity.md` — evidence lifecycle and chain of custody.
- `docs/api.md` — API reference.
- `docs/demo-script.md` — SIH demonstration flow.

---

## 👥 Team

| Member | Module |
|---|---|
| Member 1 | React frontend and investigation workspace |
| Member 2 | FastAPI backend, APIs, authentication, PostgreSQL |
| Member 3 | Data ingestion, PostgreSQL modeling, Neo4j graph |
| Member 4 | OCR, NLP, entity extraction, AI assistant |
| Member 5 | Graph analytics, graph ML, anomaly detection |
| Member 6 | Security, evidence integrity, deployment, audit |

Replace with actual team member names, roles, and GitHub profiles before submission.

---

## 🏁 SIH Demo Flow

1. Create a case and assign team members.
2. Upload FIR/CDR/transaction evidence and show SHA-256 evidence integrity.
3. Ingest structured data and show ingestion-job progress.
4. Open the case graph and demonstrate case-scoped relationships.
5. Run a multi-hop path analysis to identify an investigative lead.
6. Show timeline correlation between communication, transaction, and FIR events.
7. Ask the AI assistant a grounded question and show source-record citations.
8. Ask about unavailable data and demonstrate the `INSUFFICIENT EVIDENCE` response.
9. Generate an investigation report with evidence references and limitations.

---

## ⚠️ Limitations

- The current datasets are development/demo datasets and may not represent real operational crime data.
- OCR accuracy depends on document quality and language.
- Entity resolution requires investigator review; automatic merging is not enabled.
- GIS precision depends on available source-location data.
- AI findings are investigative leads and require human verification.
- The platform supports evidence documentation and auditability but does not guarantee legal admissibility in any specific proceeding.

---

## 📄 License

This project is developed for Smart India Hackathon 2026.  
Add your preferred license before making the repository public, for example:

```text
MIT License
```
