# Evidence Integrity and Chain of Custody

## Objective

CrimeNet AI preserves the integrity and traceability of digital evidence uploaded to the platform.

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

## Hash Verification

On upload, the backend calculates:

```text
SHA-256(original_file_bytes)
```

The hash is stored in the evidence record and can be recalculated later to verify that the original file has not changed.

## Evidence Record

Each evidence item contains:

- Evidence ID
- Case ID
- Original filename
- MIME type
- File size
- SHA-256 hash
- Hash verification timestamp
- Storage bucket
- Storage path
- Uploader
- Upload timestamp
- Collection source
- Collection timestamp
- Legal-hold status
- Custody events
- OCR/extraction references

## Chain of Custody

Each custody event records:

| Field | Description |
|---|---|
| Evidence ID | Evidence being handled |
| Actor | User performing action |
| Action | Upload, Access, Verify, Transfer, Export |
| From Location | Previous custody state |
| To Location | New custody state |
| Timestamp | Event time |
| Remarks | Additional context |

## Derived Artifacts

The following are derived artifacts, not original evidence:

- OCR text
- Extracted entities
- Extracted relationships
- Embeddings
- AI summaries
- Generated reports

Each derived artifact must reference:

- Source evidence ID
- Extraction model/version
- Creation timestamp
- Creating user or system process

## Important Principle

CrimeNet AI supports evidence documentation, provenance, and auditability. It does not guarantee legal admissibility in any specific legal proceeding.
