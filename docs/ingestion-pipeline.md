# CrimeNet AI — Ingestion Pipeline

The ingestion pipeline converts uploaded CSV files and documents into validated, case-scoped investigation data.

---

## Pipeline Overview

```text
File Upload
     ↓
Supabase Storage
     ↓
Ingestion Job Created
     ↓
Validation
     ↓
Parsing / OCR
     ↓
Entity Extraction
     ↓
Entity Resolution Candidates
     ↓
PostgreSQL Canonical Records
     ↓
Neo4j Graph Projection
     ↓
Indexing / Embeddings
     ↓
Job Completed
```

---

## Supported Inputs

| Input | Output |
|---|---|
| `persons.csv` | Person entities |
| `financial_transactions.csv` | Transaction entities and transfer relationships |
| `communication_links.csv` | Communication entities and communication relationships |
| `criminal_relationships.csv` | FIR entities and criminal relationships |
| FIR PDF/document | OCR text, entities, evidence-derived artifacts |

---

## CSV Formats

### `persons.csv`

```csv
person_id,name,age,city,role
P00001,Rahul Sharma,34,Ahmedabad,Suspect
```

### `financial_transactions.csv`

```csv
transaction_id,amount_inr,date,method,location,risk_label,sender_id,receiver_id
TXN-1001,25000,2026-01-12,UPI,Ahmedabad,HIGH,P00001,P00002
```

### `communication_links.csv`

```csv
call_id,timestamp,duration_sec,call_type,status,caller_id,receiver_id
CALL-1001,2026-01-12T10:15:00Z,180,VOICE,CONNECTED,P00001,P00002
```

### `criminal_relationships.csv`

```csv
fir_id,crime_type,date,location,case_status,person_a,person_b
FIR-1001,FRAUD,2026-01-10,Ahmedabad,OPEN,P00001,P00002
```

---

## Ingestion Job States

| State | Description |
|---|---|
| `QUEUED` | Job accepted and waiting for processing |
| `VALIDATING` | File format and required columns are being checked |
| `EXTRACTING` | Records and entities are being extracted |
| `PROCESSING` | Records are normalized and saved |
| `INDEXING` | Graph projection and search indexing |
| `COMPLETED` | Ingestion finished successfully |
| `FAILED` | Ingestion stopped due to an error |

---

## Validation Rules

- Required columns must exist.
- IDs must be unique where required.
- Dates must be valid.
- Amounts must be numeric.
- Person references must exist or be resolvable.
- File size must be within allowed limits.
- Duplicate records must be detected.
- Invalid rows must be recorded in `error_summary`.

---

## Entity Extraction

For documents, the pipeline performs:

1. File upload.
2. SHA-256 hashing.
3. OCR/text extraction.
4. Named-entity recognition.
5. Person, phone, organization, location, and account extraction.
6. Relationship extraction.
7. Entity-resolution candidate creation.
8. Investigator review.

---

## Entity Resolution

The system creates candidate matches using:

- Name similarity
- Phone number
- Address
- Bank account
- Organization
- Location
- Shared relationships
- Transliteration
- Jaro-Winkler similarity
- Phonetic matching

Entity resolution is human-in-the-loop:

```text
Potential Match
     ↓
Investigator Review
     ↓
Accept / Reject / Keep Separate
```

The system does not automatically merge entities.

---

## Neo4j Projection

After PostgreSQL records are created, the system projects investigation data into Neo4j.

Example:

```cypher
MERGE (p:Person {person_id: $personId})
SET p.name = $name,
    p.city = $city,
    p.case_id = $caseId

MERGE (c:Case {case_id: $caseId})
MERGE (c)-[:HAS_ENTITY]->(p)
```

---

## Idempotency

Ingestion should be idempotent.

If the same file is uploaded again:

- Do not create duplicate entities.
- Do not create duplicate relationships.
- Use source-record IDs and unique keys.
- Update only changed fields.
- Record the ingestion job result.

---

## Failure Handling

For each failed ingestion job, store:

- Failed row number
- Error type
- Error message
- Raw field values
- Timestamp
- Ingestion job ID

The UI should show:

- Total records
- Valid records
- Failed records
- Error samples
- Retry option
