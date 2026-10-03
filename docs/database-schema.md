# CrimeNet AI — PostgreSQL Database Schema

CrimeNet AI uses PostgreSQL/Supabase as the system of record for application state, users, cases, evidence metadata, workflow data, and audit logs.

Neo4j is used for relationship traversal and graph analytics. It does not replace PostgreSQL.

---

## Core Tables

### `user_profiles`

Stores application users and their global roles.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `auth_user_id` | UUID | Supabase Auth user ID |
| `full_name` | TEXT | User full name |
| `email` | TEXT | User email |
| `role` | TEXT | `ADMIN`, `INVESTIGATOR`, `ANALYST`, `AUDITOR` |
| `is_active` | BOOLEAN | Account active status |
| `created_at` | TIMESTAMPTZ | Account creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

---

### `cases`

Stores investigation cases.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `case_number` | TEXT | Unique case number |
| `title` | TEXT | Case title |
| `description` | TEXT | Case description |
| `case_type` | TEXT | Type of case |
| `priority` | TEXT | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | TEXT | `OPEN`, `IN_PROGRESS`, `CLOSED`, `ARCHIVED` |
| `jurisdiction` | TEXT | Legal jurisdiction |
| `police_station` | TEXT | Associated police station |
| `lead_investigator_id` | UUID | Lead investigator user ID |
| `created_by` | UUID | User who created the case |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |
| `closed_at` | TIMESTAMPTZ | Case closure time |
| `archived_at` | TIMESTAMPTZ | Archive time |

---

### `case_memberships`

Controls which users can access which cases.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `case_id` | UUID | Case reference |
| `user_id` | UUID | User reference |
| `role_in_case` | TEXT | Case-level role |
| `added_by` | UUID | User who added the member |
| `is_active` | BOOLEAN | Membership status |
| `created_at` | TIMESTAMPTZ | Membership creation time |

A user must have an active membership to access a case.

---

### `evidence_items`

Stores metadata for uploaded evidence files.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `case_id` | UUID | Case reference |
| `original_filename` | TEXT | Original uploaded filename |
| `mime_type` | TEXT | File MIME type |
| `file_size` | BIGINT | File size in bytes |
| `sha256` | TEXT | SHA-256 hash |
| `hash_verified_at` | TIMESTAMPTZ | Last hash verification time |
| `verification_status` | TEXT | `VERIFIED`, `FAILED`, `PENDING` |
| `storage_bucket` | TEXT | Supabase Storage bucket |
| `storage_path` | TEXT | Storage object path |
| `uploaded_by` | UUID | Uploader user ID |
| `collected_by` | TEXT | Evidence collector name/ID |
| `collected_at` | TIMESTAMPTZ | Evidence collection time |
| `source_system` | TEXT | Source of evidence |
| `legal_hold` | BOOLEAN | Legal hold status |
| `created_at` | TIMESTAMPTZ | Record creation time |

---

### `evidence_custody_events`

Tracks the chain of custody for evidence.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `evidence_id` | UUID | Evidence reference |
| `actor_id` | UUID | User performing the action |
| `action` | TEXT | `UPLOAD`, `ACCESS`, `VERIFY`, `TRANSFER`, `EXPORT` |
| `from_location` | TEXT | Previous custody location/state |
| `to_location` | TEXT | New custody location/state |
| `remarks` | TEXT | Additional notes |
| `occurred_at` | TIMESTAMPTZ | Event time |

---

### `ingestion_jobs`

Tracks CSV, OCR, document, and graph ingestion jobs.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `case_id` | UUID | Case reference |
| `job_type` | TEXT | `CSV`, `OCR`, `CDR`, `TRANSACTION`, `FIR` |
| `status` | TEXT | `QUEUED`, `VALIDATING`, `EXTRACTING`, `PROCESSING`, `INDEXING`, `COMPLETED`, `FAILED` |
| `file_name` | TEXT | Input file name |
| `total_records` | INTEGER | Total records processed |
| `valid_records` | INTEGER | Valid records |
| `failed_records` | INTEGER | Failed records |
| `error_summary` | JSONB | Error details |
| `created_by` | UUID | User who started ingestion |
| `created_at` | TIMESTAMPTZ | Job creation time |
| `completed_at` | TIMESTAMPTZ | Job completion time |

---

### `entities`

Stores normalized investigation entities.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `case_id` | UUID | Case reference |
| `entity_type` | TEXT | `PERSON`, `PHONE`, `ACCOUNT`, `ORGANIZATION`, `LOCATION` |
| `canonical_name` | TEXT | Primary display name |
| `attributes` | JSONB | Additional entity attributes |
| `source_record_ids` | JSONB | Source records linked to entity |
| `created_at` | TIMESTAMPTZ | Creation time |

---

### `entity_resolution_candidates`

Stores possible duplicate entities for investigator review.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `case_id` | UUID | Case reference |
| `entity_a_id` | UUID | First entity |
| `entity_b_id` | UUID | Second entity |
| `match_score` | NUMERIC | Similarity score |
| `match_reasons` | JSONB | Explanation of match signals |
| `status` | TEXT | `PENDING`, `ACCEPTED`, `REJECTED`, `KEEP_SEPARATE` |
| `reviewed_by` | UUID | Reviewing investigator |
| `reviewed_at` | TIMESTAMPTZ | Review time |

Entities are never automatically merged.

---

### `case_notes`

Stores investigator notes.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `case_id` | UUID | Case reference |
| `author_id` | UUID | Note author |
| `title` | TEXT | Note title |
| `content` | TEXT | Note content |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

---

### `alerts`

Stores case alerts and investigative notifications.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `case_id` | UUID | Case reference |
| `alert_type` | TEXT | Alert category |
| `severity` | TEXT | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `title` | TEXT | Alert title |
| `description` | TEXT | Alert details |
| `related_entity_id` | UUID | Related entity |
| `related_evidence_id` | UUID | Related evidence |
| `status` | TEXT | `OPEN`, `REVIEWED`, `DISMISSED`, `ESCALATED` |
| `created_at` | TIMESTAMPTZ | Creation time |

---

### `watchlist_items`

Stores watched entities.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `case_id` | UUID | Case reference |
| `entity_id` | UUID | Watched entity |
| `reason` | TEXT | Reason for watchlisting |
| `added_by` | UUID | User who added item |
| `created_at` | TIMESTAMPTZ | Creation time |

---

### `audit_logs`

Stores security and investigation activity.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `actor_id` | UUID | User performing action |
| `action` | TEXT | Action performed |
| `object_type` | TEXT | `CASE`, `EVIDENCE`, `USER`, `REPORT`, `GRAPH` |
| `object_id` | UUID | Object reference |
| `case_id` | UUID | Case reference |
| `ip_address` | INET | Request IP address |
| `metadata` | JSONB | Additional context |
| `status` | TEXT | `SUCCESS`, `FAILURE`, `DENIED` |
| `created_at` | TIMESTAMPTZ | Event time |

---

## Indexes

```sql
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);

CREATE INDEX idx_case_memberships_case_user
ON case_memberships(case_id, user_id);

CREATE INDEX idx_evidence_case_id ON evidence_items(case_id);
CREATE INDEX idx_evidence_sha256 ON evidence_items(sha256);

CREATE INDEX idx_ingestion_case_id ON ingestion_jobs(case_id);
CREATE INDEX idx_ingestion_status ON ingestion_jobs(status);

CREATE INDEX idx_entities_case_id ON entities(case_id);
CREATE INDEX idx_entities_type ON entities(entity_type);

CREATE INDEX idx_audit_case_id ON audit_logs(case_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
```

---

## Data Integrity Rules

- Every case-scoped record must include `case_id`.
- Evidence files must never be modified after upload.
- Original evidence and derived artifacts must be stored separately.
- Entity merges require investigator approval.
- Audit logs must be append-only.
- Every sensitive action should create an audit record.
