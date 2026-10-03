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

The official SIH26189 objective focuses on uncovering hidden networks, identifying key influencers, detecting suspicious patterns, and providing actionable intelligence to investigators.

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
PostgreSQL     Neo4j           Supabase
/ Supabase     Graph DB        Storage/Auth
|              |               |
Cases          Persons         FIR PDFs
Users          FIRs            CDR files
Memberships    Transactions    Evidence
Evidence       Communications  Reports
Notes          Relationships
Alerts         Communities
Watchlist      Paths
Audit
|
AI / NLP / Graph Analytics
|
+----------------+----------------+
|                |                |
OCR             NLP            Analytics
NER             Entity Resolution Centrality
RAG             Relationship Extraction Communities
Anomalies
Data Responsibility





























ConcernSystemUsers, cases, memberships, evidence metadata, audit, workflowPostgreSQL / SupabaseOriginal evidence filesSupabase StorageRelationship traversal, paths, graph analyticsNeo4jRaw structured recordsPostgreSQL staging/canonical tablesOCR text, extracted entities, embeddingsDerived artifacts linked to evidence
Neo4j is used for relationship intelligence and graph traversal. PostgreSQL/Supabase remains the source of truth for application state, authorization, evidence metadata, and audit records.

🛠️ Technology Stack
Frontend

React
TypeScript
Vite
Tailwind CSS
Zustand
React Router
Cytoscape.js
Recharts
Leaflet
Lucide Icons

Backend

Python
FastAPI
Uvicorn
Pydantic
SQLAlchemy
PostgreSQL
Neo4j Python Driver
Supabase Client
JWT / JWKS Authentication
ReportLab
Celery / Redis for asynchronous processing where required

AI / ML

spaCy
Transformer-based NLP models
scikit-learn
NetworkX
TF-IDF
Jaro-Winkler
Soundex / Double Metaphone
Isolation Forest
Louvain community detection
PyTorch where model training or inference is required

Data / Infrastructure

PostgreSQL / Supabase
Neo4j
Supabase Storage
Redis
Render


📁 Repository Structure
textSIH2026_26189_CrimeNetAI/
│
├── docs/
│   ├── DOCKER_REMOVAL_REPORT.md
│   ├── INTEGRATION_TEST_REPORT.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── neo4j-graph-model.md
│   ├── security-and-rbac.md
│   ├── api-reference.md
│   ├── ingestion-pipeline.md
│   ├── deployment.md
│   ├── demo-script.md
│   └── evidence-integrity.md
│
├── member1_frontend/
│   ├── src/
│   ├── components/
│   ├── services/
│   ├── store/
│   ├── public/
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
│
├── member2_backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── models.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
│
├── member3_data_graph/
│   ├── datasets/
│   │   ├── persons.csv
│   │   ├── financial_transactions.csv
│   │   ├── communication_links.csv
│   │   └── criminal_relationships.csv
│   ├── ingestion.py
│   ├── config.py
│   └── requirements.txt
│
├── member4_ai_nlp/
│   ├── ocr/
│   ├── nlp/
│   ├── entity_resolution/
│   ├── ai_assistant/
│   └── requirements.txt
│
├── member5_graph_ml/
│   ├── analytics/
│   ├── community_detection/
│   ├── anomaly_detection/
│   └── requirements.txt
│
├── member6_security_evidence_deployment/
│   ├── security/
│   ├── evidence/
│   ├── audit/
│   ├── deployment/
│   └── requirements.txt
│
├── scripts/
│   ├── setup_db.py
│   ├── seed_data.py
│   └── create_indexes.py
│
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── LOCAL_SETUP.md
├── README.md
├── SECURITY.md
├── render.yaml
└── requirements.txt

📊 Dataset Overview
The repository includes development/demo datasets for validating ingestion, graph construction, analytics, and AI workflows.






























DatasetApprox. RecordsPurposepersons.csv10,000Person/entity recordsfinancial_transactions.csv200,000Financial-flow analysiscommunication_links.csv250,000CDR/communication analysiscriminal_relationships.csv30,000FIR and co-accused relationships
Graph Scale
textPerson nodes: ~10,000
FIR nodes: ~30,000
Transaction nodes: ~200,000
Communication nodes: ~250,000
---------------------------------
Total nodes: ~490,000

CO_ACCUSED_WITH: ~30,000
NAMED_IN_FIR: ~60,000
TRANSFERRED_FUNDS: ~200,000
COMMUNICATED_WITH: ~250,000
---------------------------------
Total relationships: ~540,000
Synthetic or sample datasets are used only for development and demonstration. They are clearly separated from real production data.

🔐 Security and Access Control
CrimeNet AI follows a backend-first authorization model:
textFrontend permission
↓
Backend authorization
↓
Case membership check
↓
PostgreSQL / Neo4j case-scoped query
↓
Authorized result
Roles

























RoleCapabilityADMINUser and role administration, system configurationINVESTIGATORCase investigation, evidence review, graph analysis, reportsANALYSTData analysis, graph exploration, pattern reviewAUDITOREvidence verification, audit review, compliance-oriented access
Security Principles

JWT signature, expiration, issuer, audience, and claims are validated on the backend.
Frontend UI restrictions are not treated as security controls.
Every case-scoped API request validates case membership.
Neo4j queries are scoped by caseId.
Supabase Storage buckets are private.
Files are accessed through short-lived signed URLs.
Service-role credentials are never exposed to the frontend.
Audit logs record actor, action, object, case, timestamp, and outcome.


🧾 Evidence Integrity
Every uploaded evidence item follows this lifecycle:
textOriginal File
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
Evidence records include:

Evidence ID and case ID
Original filename and MIME type
SHA-256 hash
Hash verification status and timestamp
Storage bucket and object path
Uploader and upload timestamp
Collection source and collection time
Chain-of-custody events
OCR/extraction job references
Legal-hold and disclosure status
Audit history

SHA-256 is used to detect modification after hashing. The platform also maintains custody, provenance, and verification records to support investigative and audit workflows.

🚀 Local Setup
Prerequisites

Node.js 18+
Python 3.11+
PostgreSQL or Supabase project
Neo4j 5.x
Redis, if using asynchronous ingestion
Supabase Storage bucket

1. Clone the repository
Bashgit clone https://github.com/dee977/SIH2026_26189_CrimeNetAI.git
cd SIH2026_26189_CrimeNetAI
2. Frontend setup
Bashcd member1_frontend
npm install
cp .env.example .env
npm run dev
Example frontend environment:
envVITE_API_BASE_URL=/api/v1
3. Backend setup
Bashcd ../member2_backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
4. Environment variables
Create .env inside member2_backend/ using .env.example:
env# Application
APP_ENV=development
SECRET_KEY=change-this-in-production
FRONTEND_ORIGIN=http://localhost:5173

# PostgreSQL / Supabase
DATABASE_URL=postgresql://user:password@host:5432/crimenet

# Supabase
SUPABASE_URL=https://your-project.supabase.co
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
Never commit .env, service-role keys, database credentials, or Supabase secrets to GitHub.
5. Run ingestion
Bashcd ../member3_data_graph
pip install -r requirements.txt
python ingestion.py

☁️ Deployment
The project is fully deployed on Render as a single web service and uses Supabase for authentication, PostgreSQL, and private evidence storage.
Build Command
Bashcd member1_frontend && npm install && npm run build
Start Command
Bashcd member2_backend && pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port $PORT
FastAPI serves:

/api/v1/* backend APIs
/ws WebSocket endpoints
Compiled React/Vite frontend

The frontend uses relative API paths such as /api/v1 in production instead of hardcoded localhost URLs.
External services:

Supabase PostgreSQL
Supabase Auth
Supabase Storage
Remote Neo4j


📈 Current Implementation Status
CrimeNet AI is a fully functional and deployed prototype.

























































































ModuleStatusCase management✅ ImplementedAuthentication and RBAC✅ ImplementedCase isolation✅ ImplementedCSV ingestion✅ ImplementedNeo4j graph ingestion✅ ImplementedNetwork graph visualization✅ ImplementedGraph analytics✅ ImplementedTimeline✅ ImplementedEvidence upload and hashing✅ ImplementedOCR and document processing✅ ImplementedEntity resolution✅ ImplementedAI assistant✅ ImplementedGIS map✅ ImplementedInvestigation reports✅ ImplementedAudit trail✅ ImplementedSupabase Auth✅ IntegratedSupabase PostgreSQL✅ IntegratedSupabase Storage✅ IntegratedNeo4j Graph Database✅ IntegratedRender Deployment✅ Deployed

🧪 Testing
Run backend tests:
Bashcd member2_backend
pytest
Recommended test coverage:

Authentication and JWT validation
Role-based access control
Case-membership authorization
Cross-case access denial
Neo4j case-scoped queries
Evidence upload and SHA-256 verification
CSV ingestion validation
AI response grounding and insufficient-evidence handling


📚 Documentation

docs/architecture.md [blocked] — System architecture and data flow
docs/database-schema.md [blocked] — PostgreSQL schema
docs/neo4j-graph-model.md [blocked] — Neo4j graph model and Cypher queries
docs/security-and-rbac.md [blocked] — Authentication, RBAC, and authorization model
docs/evidence-integrity.md [blocked] — Evidence lifecycle and chain of custody
docs/api-reference.md [blocked] — API reference
docs/ingestion-pipeline.md [blocked] — Data ingestion workflow
docs/deployment.md [blocked] — Render deployment guide
docs/demo-script.md [blocked] — SIH demonstration flow
docs/DOCKER_REMOVAL_REPORT.md [blocked] — Docker removal decision report
docs/INTEGRATION_TEST_REPORT.md [blocked] — Integration testing report


👥 Team

































MemberModuleMember 1React frontend and investigation workspaceMember 2FastAPI backend, APIs, authentication, PostgreSQLMember 3Data ingestion, PostgreSQL modeling, Neo4j graphMember 4OCR, NLP, entity extraction, AI assistantMember 5Graph analytics, graph ML, anomaly detectionMember 6Security, evidence integrity, deployment, audit

🏁 SIH Demo Flow

Create a case and assign team members.
Upload FIR/CDR/transaction evidence and show SHA-256 evidence integrity.
Ingest structured data and show ingestion-job progress.
Open the case graph and demonstrate case-scoped relationships.
Run a multi-hop path analysis to identify an investigative lead.
Show timeline correlation between communication, transaction, and FIR events.
Ask the AI assistant a grounded question and show source-record citations.
Ask about unavailable data and demonstrate the INSUFFICIENT EVIDENCE response.
Generate an investigation report with evidence references and limitations.


⚠️ Limitations

Demo datasets are used for development and demonstration purposes only.
OCR accuracy depends on document quality and language mix.
Entity resolution requires investigator review; automatic merging is deliberately disabled.
GIS precision depends on the quality of available source-location data.
All AI findings are investigative leads and require human verification.
The platform provides strong evidence documentation and auditability but does not claim legal admissibility in any specific court proceeding.


📄 License
This project is licensed under the MIT License. See LICENSE [blocked] for details.
