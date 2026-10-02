# AI-Powered Criminal Network Analysis & Link Discovery
**Smart India Hackathon 2026** | **Problem ID: SIH26189** | **Platform License: MIT** | **Security Level: Law Enforcement / Confidential**

**Problem Statement:** Advanced AI-driven intelligence system for criminal network analysis, multi-hop link discovery, and secure evidence tracking for law enforcement agencies.

---

### 🛡️ CrimeNet AI: Investigative Intelligence Portal
An advanced, multi-tenant intelligence platform bridging modern web frameworks with heavy-duty Graph Machine Learning and Natural Language Processing (NLP) for real-time syndicate discovery and criminal network analysis.

### 🚀 Project Overview
**CrimeNet AI** is engineered for law enforcement investigators, intelligence analysts, and judicial liaison officers. It provides a highly secure, RBAC-protected Case Management Workspace that ingests multi-modal raw intelligence (FIRs, Call Data Records, Financial Ledgers) and routes them to a high-performance Python backend. The system evaluates the data, generates interactive network topologies, uncovers hidden multi-hop relationships, and guarantees evidence integrity under the strict guidelines of the **Bharatiya Sakshya Adhiniyam (BSA)**.

### ✨ Core Features
*   **Strict Multi-Tenant Role-Based Access Control (RBAC):** Secure authentication ensures that Admins, Investigators, Analysts, and Auditors only have access to their authorized case jurisdictions, maintaining strict legal and operational boundaries.
*   **Multi-Modal Intelligence Ingestion:** Built to seamlessly parse unstructured FIR PDFs, structured Call Data Records (CDRs), and financial transaction logs, converting them automatically into connected intelligence graphs.
*   **Interactive Tactical Canvas:** A bespoke visual interface powered by Cytoscape allowing investigators to inspect network topologies, drag-and-drop nodes, and filter multi-hop relationships (e.g., tracing illicit funds from a shell company to a cartel kingpin).
*   **Cryptographic Evidence Integrity (BSA Section 63):** A custom security middleware layer that implements continuous SHA-256 hash tracking for all uploaded documents, generating unalterable chain-of-custody certificates for courtroom admissibility.
*   **Zero-Bias AI & Explainable Centrality:** Robust algorithms that highlight highly-connected individuals (Betweenness/Degree Centrality) without generating arbitrary automated "guilt" scores, preserving critical investigator discretion.

### 🧠 AI & Intelligence Pipeline
The application relies on a robust, 6-module architecture executing complex machine learning and graph algorithms.

| Module | Core Technology | Investigative Function |
| :--- | :--- | :--- |
| **M1: Tactical Interface** | React, Vite, Cytoscape.js | Renders dynamic network canvases, timelines, and geospatial dashboards for investigators. |
| **M2: Core Backend** | Python, FastAPI | High-performance ASGI server handling RBAC routing, API logic, and secure data orchestration. |
| **M3: Graph Engine** | NetworkX, SQL | Maps complex, unstructured criminal relationships into high-speed relational and graph topologies. |
| **M4: NLP Intelligence** | spaCy, Transformers | Extracts precise entities (Names, Phones, Accounts, Locations) from raw, unstructured FIR text. |
| **M5: Graph ML** | PageRank, Louvain | Computes node centrality to find network hubs and detects hidden community syndicates. |
| **M6: Cyber Security** | SHA-256 Hashing | Locks down electronic records and monitors chain-of-custody for judicial compliance. |

### 📊 Investigative Metrics Evaluated
*   **Degree & Betweenness Centrality:** Identifies critical bridges between disconnected criminal cells.
*   **Community Clustering:** Groups seemingly unrelated suspects into distinct operational syndicates.
*   **Evidence Hash Verification:** Real-time Boolean validation (`Verified` / `Tampered`) for all ingested case files.
*   **Temporal Pattern Recognition:** Time-series analysis to predict synchronized syndicate movements.

### 🏗️ System Architecture
*   **Decoupled Client-Server Model:** The React presentation layer communicates with the heavy analytical backend strictly via RESTful HTTP and secure JWT authorization headers.
*   **FastAPI Engine:** A highly concurrent Python server acts as a central hub, orchestrating NLP pipelines, graph analytics, and database reads with minimal latency.
*   **Global State Machine:** Zustand serves as the frontend nervous system, tracking authenticated officer sessions, active case workspaces, and real-time notification alerts without prop-drilling.

### 🛠️ Technology Stack
**Frontend (Client & UI)**
*   **Framework:** React 18 & Vite
*   **Styling:** Tailwind CSS (Glassmorphism, responsive grids)
*   **Graphing:** Cytoscape.js
*   **State Management:** Zustand
*   **Icons:** Lucide React

**Backend (Core API)**
*   **Language:** Python 3.x
*   **Framework:** FastAPI & Uvicorn
*   **Security:** JWT, Passlib (Bcrypt), Pydantic validation

**AI, Graph & Deep Learning**
*   **Graph Processing:** NetworkX
*   **Natural Language Processing:** spaCy, HuggingFace
*   **Analytics Algorithms:** PageRank, Louvain Modularity

**Cloud & Infrastructure**
*   **Database & Auth:** Supabase (PostgreSQL & GoTrue Auth)
*   **Storage:** Supabase Storage (Case-scoped buckets)
*   **Hashing:** Cryptographic `hashlib`

### ✨ Smart India Hackathon Team
*   **Frontend & UI/UX Orchestration Lead:** Member 1
*   **Core API & Backend Systems Lead:** Member 2
*   **Graph Database & Topology Lead:** Member 3
*   **AI & Natural Language Processing Lead:** Member 4
*   **Graph Machine Learning & Analytics Lead:** Member 5
*   **Security & Cryptographic Evidence Lead:** Member 6

---
*Disclaimer: CrimeNet AI is an investigative intelligence aid and data-synthesis tool. It is not an autonomous judicial decision-maker and must be used alongside professional law enforcement evaluation.*
