# CrimeNet AI — Architecture

## Overview

CrimeNet AI is a case-scoped investigative intelligence platform built to analyze relationships across FIRs, persons, communications, financial transactions, documents, and locations.

The system follows a modular architecture:

```text
React + Vite Frontend
          |
      FastAPI Backend
          |
+----------------+----------------+
|                |                |
PostgreSQL       Neo4j         Supabase
/ Supabase      Graph DB       Storage/Auth
```

## Core Principles

- Case-first design
- Backend-enforced authorization
- Source-record traceability
- Evidence integrity
- Explainable AI
- Human-in-the-loop decision-making
- No guilt or criminal-probability scoring

## System Components

### Frontend

The React frontend provides the investigator workspace:

- Case dashboard
- Case dossier
- Entity Explorer
- Network Graph
- Timeline
- Analytics
- Evidence Vault
- Document Processing
- GIS map
- AI Assistant
- Reports

### Backend

FastAPI provides:

- REST APIs
- WebSocket endpoints
- Authentication
- Authorization
- Case isolation
- Ingestion workflows
- Graph query services
- Evidence services
- AI retrieval services
- Report generation

### PostgreSQL / Supabase

PostgreSQL is the system of record for:

- Users
- Cases
- Case memberships
- Evidence metadata
- Notes
- Alerts
- Watchlists
- Ingestion jobs
- Audit logs
- Source records

### Neo4j

Neo4j stores the investigation graph:

- Person nodes
- FIR nodes
- Transaction nodes
- Communication nodes
- Organization nodes
- Location nodes
- Relationship edges

It supports:

- Multi-hop traversal
- Shortest paths
- Hidden relationships
- Community detection
- Centrality analysis
- Graph visualization

### Supabase Storage

Supabase Storage stores original evidence files in a private bucket:

```text
case-documents/
    CASE-ID/
        FIR/
        CDR/
        Transactions/
        Evidence/
        Reports/
```

## Case Isolation Flow

```text
Frontend selects caseId
        ↓
API request with JWT
        ↓
FastAPI validates user
        ↓
Backend validates case membership
        ↓
PostgreSQL query is case-scoped
        ↓
Neo4j query is case-scoped
        ↓
Authorized case-specific result
```

## Evidence Lifecycle

```text
Original File
     ↓
SHA-256 Hash
     ↓
Evidence Metadata
     ↓
Supabase Storage
     ↓
PostgreSQL Evidence Record
     ↓
OCR / NLP Processing
     ↓
Derived Artifacts
     ↓
Investigator Review
     ↓
Report / Audit Trail
```

## AI Flow

```text
Investigator Question
        ↓
Intent Classification
        ↓
Case-Authorized Retrieval
        ↓
PostgreSQL + Neo4j + Evidence Retrieval
        ↓
Grounded Answer Generation
        ↓
Answer with Source Records
```

If no relevant data is found, the AI returns:

```text
INSUFFICIENT EVIDENCE / DATA NOT FOUND
```
