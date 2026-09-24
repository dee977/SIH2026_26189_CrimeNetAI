# CrimeNet AI — Frontend (Member 1)
**SIH Problem ID:** SIH26189  
**System Title:** AI-Powered Criminal Network Analysis System  
**Owner:** Member 1 (M1) — Frontend Engineer  
**Dedicated Folder:** `member1_frontend/`  

---

## 1. Absolute Ownership & Architectural Boundary

Under the CrimeNet AI team separation rules, Member 1 owns **only** the presentation, user experience, visual analytics, and client state orchestration layers.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CRIMENET AI ARCHITECTURE                        │
├───────────────────┬────────────────────────────────────────────────────┤
│ Member / Folder   │ Domain & Ownership Responsibility                  │
├───────────────────┼────────────────────────────────────────────────────┤
│ M1: Frontend      │ UI/UX, Cytoscape Network, GIS, Timeline, Workflows │
│ M2: Backend       │ RESTful API Gateway, Routers & Orchestration       │
│ M3: Data Graph    │ Neo4j Graph DB, Cypher schemas, CCTNS/CDR Ingest   │
│ M4: AI / NLP      │ OCR, FIR Document Parsing, NER & Translation       │
│ M5: Graph ML      │ Centrality, Louvain Communities, Cross-Verification│
│ M6: Security      │ Supabase Auth, Hierarchical RBAC, SHA-256 Ledger   │
└───────────────────┴────────────────────────────────────────────────────┘
```

### Critical Boundaries Followed by M1:
* **No Backend Engine:** M1 does not implement database drivers or server business logic; it consumes M2 REST APIs.
* **No Graph Algorithms:** M1 does not calculate Betweenness, Degree Centrality, PageRank, or Louvain partitions; it renders data computed by M3/M5.
* **No OCR / NLP Engine:** Text extraction and entity resolution are consumed from M4.
* **No SHA-256 Calculation Engine:** Cryptographic checksum validation is executed by M6 daemons.
* **No Arbitrary Risk Scoring:** As an investigator-support system, CrimeNet AI **strictly forbids** `risk_score`, `risk_label`, and automated criminal probability.

---

## 2. Technology Stack

* **Framework:** React 18 with TypeScript 5
* **Build Tool:** Vite 6 (Lightning HMR & optimized production bundle)
* **Styling:** Vanilla Tailwind CSS with custom investigative cyber-theme variables, dark mode glassmorphism
* **Graph Engine:** Cytoscape.js with CoSE physics layout & multi-hop edge highlighting
* **Charts & Bursts:** Recharts (Area burst charts & Centrality distribution bars)
* **State Management:** Zustand 5 (Auth & RBAC session, Demo Walkthrough, Navigation, Notifications)
* **Icons:** Lucide React (High-density security & law-enforcement icons)

---

## 3. Implemented Pages & Workstations

### A. Public Website
1. **Landing Page (`/landing`):** Hero section, system overview, SIH26189 hackathon credentials, core pillars, and quick demo launcher.
2. **About Project (`/about`):** Detailed architectural overview, ethical AI guardrails, team ownership breakdown (M1–M6), and legal standards compliance.
3. **Login Station (`/login`):** Dual authentication (Email/Phone + password), evaluator persona shortcuts (Senior Investigator, Authority, Administrator), session expiration handling, and link to credential recovery.
4. **Officer Enrolment Form (`/register`):** Full officer registration capturing Name, Official Email, Phone, Employee/Officer ID, Police Unit / Agency, and Requested Role. Displays **PENDING APPROVAL** status screen and explicitly enforces:
   $$\text{Requested Role} \neq \text{Granted Role} \neq \text{Actual Permissions}$$
5. **Credential Recovery (`/forgot-password`):** Simulated 6-digit OTP verification token and password re-encryption flow.

### B. Authenticated Investigator Application
1. **Investigator Command Center (`/dashboard`):** 12 operational indicators (Persons, Phones, Bank Accounts, Vehicles, Locations, FIRs, Crimes, Shell Orgs, Communications, Transactions, Active Cases, Evidence Items), temporal intercept burst charts, recent case dossiers, and live alerts.
2. **Global Search (`/search`):** Multi-criteria search across all 11 entity types + aliases + cases with filters for Entity Type, Source Document, Date, and Free Text.
3. **Entity Explorer (`/entity`):** Reusable tabbed profile browser for 11 entity types:
   * **Person Profile:** Name, aliases, national ID, registered phones, subpoenaed bank accounts, FASTag-tracked vehicles, shell corporate directorships, associated FIRs, known associates, and factual anomaly indicators. (**Zero risk scores**).
   * **Generic Entity Profiles:** Specialized attribute viewers for Phone, Bank Account, Vehicle, Location, Organization, FIR, Crime, Transaction, Communication, and Evidence.
4. **Interactive Network Graph (`/graph`):** Full-screen Cytoscape.js canvas with node categorizations, neighbor expansion, zoom/pan controls, degree metrics, edge inspector, and multi-hop path tracing.
5. **Hidden Relationship Discovery (`/hidden-discovery`):** Multi-hop indirect link tracer (e.g. Vikram Malhotra $\to$ Phone $\to$ Call $\to$ Rajesh Sharma $\to$ Bank $\to$ TXN $\to$ BlueSea Logistics) with step-by-step documentary evidence cards.
6. **Graph Analytics Station (`/analytics`):** Renders M5 centrality metrics (Degree, Betweenness, PageRank, Bridge nodes) with explicit disclaimers: *High Centrality is an analytical lead, not criminal guilt.*
7. **Community Clusters (`/community`):** Louvain modularity sub-graph clusters separating maritime port operations from financial hawala conduits.
8. **Timeline Explorer (`/timeline`):** Multi-track timeline (Calls, Remittances, FASTag pings, Seizures, FIR registrations) with interactive temporal playback simulation and burst analysis.
9. **GIS Tactical Map (`/gis`):** Tactical coordinate map displaying crime scenes, cell tower azimuth radiation sectors, shell offices, and suspect coordinates.
10. **Cross-Verification Engine (`/verification`):** Side-by-side contradiction detector displaying **DATA DISCREPANCY DETECTED** banners, comparing conflicting records (e.g. Accused alibi statement vs. cell tower carrier dump) without automated adjudication.
11. **Evidence & SHA-256 Ledger (`/evidence`):** Evidence catalog, evidence upload modal, chain of custody logs, and live SHA-256 integrity verifier (comparing original genesis hash against current hash: MATCH vs. MISMATCH alerts) under the Bharatiya Sakshya Adhiniyam (BSA §63).
12. **Target Watchlist (`/watchlist`):** Add/Remove monitored persons, phones, bank accounts, aliases, and corporate fronts with real-time match trigger logs.
13. **Investigative Alerts (`/alerts`):** Live audit feed of system anomalies, watchlist matches, cross-source contradictions, and evidence integrity mismatches.
14. **Grounded AI Assistant (`/assistant`):** Zero-hallucination chat workstation displaying answers grounded in specific source documents, graph path steps, relevant entities, and supporting evidence references.
15. **Case Management & Workspace (`/cases`, `/case-workspace`):** Master case dossiers and unified investigation workstations integrating Overview, Graph, Timeline, Map, Entities, Evidence, Alerts, AI Assistant, Reports, and Audit History.
16. **Authority Console (`/authority`):** Screen for Senior Authorities to inspect pending officer applications, designate granted roles, and assign cryptographic permission keys.
17. **Admin Control Room (`/admin`):** System administrator view for service gateway status, cluster health, and runtime fallback mode toggles.
18. **Investigation Reports (`/reports`):** Formal judicial dossier compiler with print view and PDF export dispatch to the M2 backend.

---

## 4. Continuous Synthetic Demo Story (13 Steps)

To facilitate evaluation, a floating demo ribbon orchestrates the complete synthetic hackathon narrative:

$$\text{FIR-2024-8841} \to \text{Vikram Malhotra (Person A)} \to \text{+91-98201-99412 (Phone)} \to \text{Rajesh K. Sharma (Person B)}$$
$$\downarrow$$
$$\text{HDFC-9921-4820 (Bank)} \to \text{TXN-90214 ₹15,00,000} \to \text{BlueSea Logistics (Shell Co.)} \to \text{Nhava Sheva Yard 4B (Location)} \to \text{CR-2024-0912 (Crime)}$$

### Step-by-Step Flow:
1. **Login:** Authenticate as Senior Investigator.
2. **Dashboard:** Inspect operational counters, recent activity, and active cases.
3. **Search Person A:** Query global search for "Vikram Malhotra".
4. **Open Profile:** Inspect Vikram Malhotra's dossier (Strictly free of risk scores).
5. **Open Graph:** Explore Cytoscape network connectivity and degree centrality.
6. **Discover Indirect Relationship:** Trace 6-hop path to BlueSea Logistics Shell Co.
7. **Open Timeline:** Inspect the 01:04 AM call and 01:18 AM transfer burst.
8. **Check Transaction:** Review ₹15,00,000 NEFT relay debit TXN-90214.
9. **Check Location:** Verify Nhava Sheva Yard 4B and cell tower coverage sector on GIS Map.
10. **Ask AI Assistant:** Query: *"How is Vikram Malhotra connected to BlueSea Logistics?"* for grounded citations.
11. **Open Supporting Evidence:** Review mobile physical image EVD-2024-0812.
12. **Verify SHA-256:** Run cryptographic checksum verification (MATCH on EVD-001, contrast with MISMATCH on EVD-003).
13. **Generate Report:** Compile formal investigation dossier and dispatch export job.

---

## 5. State Management Structure

```
src/store/
├── authStore.ts         # User session, RBAC roles, pending registrations, permission toggles
├── demoStore.ts         # 13-step continuous synthetic demo story orchestrator
├── navigationStore.ts   # Active view routing, selected entity ID, selected case ID, live/fallback toggle
└── notificationStore.ts # Global toast notification feed and alert counters
```

---

## 6. Integration Contracts & Consumed APIs

```typescript
// M2 Backend Gateway (Default: http://localhost:8000/api/v1)
GET  /entities?type=:type           // Fetch entities
GET  /entities/:id                  // Fetch single entity profile
GET  /search?q=:query               // Global multi-criteria search
GET  /cases                         // List case dossiers
POST /cases                         // Create case dossier
POST /reports/export                // Dispatch formal PDF report job

// M3 Neo4j Graph Service
GET  /graph?case_id=:caseId         // Full network graph topology (Nodes & Edges)
GET  /graph/hidden-path?source=&target= // Multi-hop path traversal

// M4 AI / NLP Grounded Assistant
POST /assistant/query               // Grounded RAG Q&A with mandatory source citations

// M5 Graph ML & Analytics
GET  /graph/analytics?case_id=      // Centrality metrics (Betweenness, Degree, PageRank)
GET  /graph/communities?case_id=    // Louvain modularity clusters
GET  /verification/discrepancies    // Cross-source contradiction feed

// M6 Security & Evidence Ledger
POST /auth/login                    // Officer authentication
POST /auth/register                 // Officer enrolment application
POST /evidence/:id/verify-hash      // Cryptographic SHA-256 verification
GET  /ledger/audit                  // Immutable ledger transaction audit log
```

*Resilience Guarantee:* If any backend service is temporarily offline, the frontend's API client gracefully falls back to the verified synthetic hackathon dataset without crashing.

---

## 7. Environment Variables

Create `.env` in `member1_frontend/`:

```env
# Backend API Gateway (M2)
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Security & Node Identifier (M1)
VITE_NODE_IDENTITY=CRIMENET-M1-FRONTEND
```

---

## 8. Development & Build Instructions

```bash
# Navigate to Member 1 workspace
cd member1_frontend

# Install dependencies
npm install

# Start local investigative development server
npm run dev

# Compile TypeScript and build production bundle
npm run build

# Preview production build locally
npm run preview
```
