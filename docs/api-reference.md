# CrimeNet AI — API Reference

Base URL:

```text
/api/v1
```

All protected endpoints require a valid Supabase JWT in the Authorization header:

```text
Authorization: Bearer <access_token>
```

---

## Authentication

### `POST /auth/login`

Authenticates a user through Supabase Auth.

**Request**

```json
{
  "email": "investigator@example.com",
  "password": "secret-password"
}
```

**Response**

```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "investigator@example.com",
    "role": "INVESTIGATOR"
  }
}
```

---

## Health

### `GET /health`

Checks backend health.

**Response**

```json
{
  "status": "ok",
  "service": "crimenet-ai",
  "version": "1.0.0"
}
```

---

## Cases

### `GET /cases`

Returns cases accessible to the authenticated user.

**Response**

```json
{
  "items": [
    {
      "id": "uuid",
      "case_number": "CASE-2026-001",
      "title": "Financial Fraud Network",
      "status": "IN_PROGRESS",
      "priority": "HIGH"
    }
  ],
  "total": 1
}
```

### `POST /cases`

Creates a new case.

**Request**

```json
{
  "case_number": "CASE-2026-001",
  "title": "Financial Fraud Network",
  "description": "Investigation into suspected financial fraud network",
  "case_type": "FINANCIAL_FRAUD",
  "priority": "HIGH",
  "jurisdiction": "Gujarat",
  "police_station": "City Police Station"
}
```

### `GET /cases/{case_id}`

Returns case details.

### `PATCH /cases/{case_id}`

Updates case metadata.

### `GET /cases/{case_id}/members`

Returns case members.

### `POST /cases/{case_id}/members`

Adds a member to a case.

**Request**

```json
{
  "user_id": "uuid",
  "role_in_case": "INVESTIGATOR"
}
```

---

## Evidence

### `POST /cases/{case_id}/evidence`

Uploads an evidence file.

**Form data**

```text
file: evidence.pdf
source_system: FIR Portal
collected_by: Investigator Name
collected_at: 2026-10-04T10:00:00Z
```

**Response**

```json
{
  "id": "uuid",
  "case_id": "uuid",
  "original_filename": "evidence.pdf",
  "sha256": "hash-value",
  "verification_status": "PENDING",
  "storage_path": "CASE-ID/Evidence/evidence.pdf"
}
```

### `GET /cases/{case_id}/evidence`

Returns evidence items for a case.

### `GET /cases/{case_id}/evidence/{evidence_id}`

Returns evidence metadata.

### `GET /cases/{case_id}/evidence/{evidence_id}/download-url`

Returns a short-lived signed URL.

**Response**

```json
{
  "signed_url": "[https://](https://)...",
  "expires_in": 300
}
```

### `POST /cases/{case_id}/evidence/{evidence_id}/verify`

Reverifies the SHA-256 hash.

**Response**

```json
{
  "evidence_id": "uuid",
  "verification_status": "VERIFIED",
  "sha256": "hash-value",
  "verified_at": "2026-10-04T10:30:00Z"
}
```

---

## Ingestion

### `POST /cases/{case_id}/ingestion/csv`

Uploads and processes a CSV dataset.

**Form data**

```text
file: communication_links.csv
dataset_type: COMMUNICATION
```

### `GET /cases/{case_id}/ingestion/{job_id}`

Returns ingestion-job status.

**Response**

```json
{
  "id": "uuid",
  "status": "PROCESSING",
  "total_records": 250000,
  "valid_records": 249000,
  "failed_records": 1000,
  "progress": 85
}
```

---

## Graph

### `GET /cases/{case_id}/graph`

Returns a case-scoped graph.

**Query parameters**

```text
entity_id=optional
limit=200
relationship_types=TRANSFERRED_FUNDS,COMMUNICATED_WITH
```

**Response**

```json
{
  "nodes": [],
  "edges": [],
  "total_nodes": 120,
  "total_edges": 310
}
```

### `GET /cases/{case_id}/graph/path`

Finds a path between two entities.

**Query parameters**

```text
source_entity_id=uuid
target_entity_id=uuid
max_depth=4
```

### `GET /cases/{case_id}/graph/communities`

Returns precomputed community clusters.

### `GET /cases/{case_id}/graph/centrality`

Returns centrality metrics.

**Query parameters**

```text
metric=degree|betweenness|pagerank|closeness
limit=20
```

---

## Timeline

### `GET /cases/{case_id}/timeline`

Returns case events.

**Query parameters**

```text
from_date=2026-01-01
to_date=2026-12-31
entity_id=optional
event_types=FIR,TRANSACTION,COMMUNICATION
```

---

## AI Assistant

### `POST /cases/{case_id}/ai/query`

Ask a grounded investigation question.

**Request**

```json
{
  "question": "What financial relationships does P00001 have?"
}
```

**Response**

```json
{
  "answer": "P00001 has 14 financial relationships within the selected case scope.",
  "sources": [
    {
      "type": "TRANSACTION",
      "id": "TXN-1001",
      "reference": "transaction_id"
    }
  ],
  "confidence": "MEDIUM",
  "status": "SUPPORTED"
}
```

If no relevant data exists:

```json
{
  "answer": "INSUFFICIENT EVIDENCE / DATA NOT FOUND",
  "sources": [],
  "status": "INSUFFICIENT_EVIDENCE"
}
```

---

## Reports

### `POST /cases/{case_id}/reports`

Generates an investigation report.

### `GET /cases/{case_id}/reports`

Returns generated reports.

### `GET /cases/{case_id}/reports/{report_id}/download`

Downloads a report PDF.

---

## Audit

### `GET /cases/{case_id}/audit`

Returns audit logs for a case.

**Required role:** `ADMIN` or `AUDITOR`.

---

## Error Responses

| Status | Meaning |
|---|---|
| `400` | Invalid request |
| `401` | Missing or invalid authentication |
| `403` | Authorized user, but no case access or insufficient role |
| `404` | Resource not found |
| `409` | Conflict, such as duplicate case number |
| `422` | Validation error |
| `500` | Internal server error |
