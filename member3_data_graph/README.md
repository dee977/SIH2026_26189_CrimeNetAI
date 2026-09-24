# Member 3: Data Engineering & Neo4j Integration (CrimeNet AI)

## Absolute Ownership
- Dataset processing (cleaning, normalization, schema validation)
- Dataset ingestion
- Data provenance
- Neo4j schema (nodes, relationships, indexes, constraints)
- Graph data retrieval helpers

## CSV Schemas & Data Types
The system expects the following CSV files:
- `persons.csv`: id (str), name (str), aliases (str), dob (date), gender (str)
- `phone_numbers.csv`: id (str), number (str), provider (str)
- `bank_accounts.csv`: id (str), account_number (str), bank_name (str)
- `vehicles.csv`: id (str), license_plate (str), model (str)
- `locations.csv`: id (str), address (str), coordinates (str)
- `firs.csv`: id (str), fir_number (str), date (date)
- `crimes.csv`: id (str), crime_type (str), description (str)
- `organizations.csv`: id (str), name (str), org_type (str)
- `communications.csv`: id (str), type (str), timestamp (datetime)
- `transactions.csv`: id (str), amount (float), currency (str), timestamp (datetime)
- `relationships.csv`: source_id, target_id, source_label, target_label, rel_type, source, timestamp, case_id, evidence_id, confidence

## Normalization & Data Provenance
- All entities and relationships retain their original source provenance metadata (`source`, `timestamp`, `case_id`, `evidence_id`, `confidence`).
- No source data is destroyed.
- Unique IDs are preserved.

## Neo4j Schema
### Node Types
`Person`, `Phone`, `BankAccount`, `Vehicle`, `Location`, `Organization`, `FIR`, `Crime`, `Transaction`, `Communication`, `Evidence`, `Case`, `Event`

### Relationship Types
`CALLS`, `OWNS`, `TRANSFERRED`, `VISITED`, `LOCATED_AT`, `ASSOCIATED_WITH`, `INVOLVED_IN`, `COMMUNICATED_WITH`, `CONNECTED_TO`, `RELATED_TO`, `SUPPORTED_BY`, `OCCURRED_AT`

### Indexes & Constraints
- Unique ID constraints exist for all Node Types (e.g., `REQUIRE p.id IS UNIQUE` for `Person`).
- Additional indexes are created on frequently queried fields like `Person.name`, `Phone.number`, `Transaction.timestamp`.

## Import Strategy & Batching
- Data is processed using `pandas` for reading CSV files.
- Pydantic models validate and normalize data types and handle missing values.
- Neo4j's `UNWIND` operation is used with a configurable `BATCH_SIZE` (default 10,000) to prevent large transaction failures and manage memory efficiently.
- `MERGE` statements ensure idempotent ingestion (safe repeated ingestion).

## Demo IDs
A stable demo graph is available via specific identifiers:
- FIR: `FIR-DEMO-001`
- Person A: `P-DEMO-A`
- Phone: `PH-DEMO-001`
- Person B: `P-DEMO-B`
- Bank Account: `BA-DEMO-001`
- Transaction: `TX-DEMO-001`
- Organization: `ORG-DEMO-001`
- Location: `LOC-DEMO-001`
- Crime: `CR-DEMO-001`

## Integration Contracts (M2/M5)
The `retrieval.py` module exposes the following safe graph-data functions:
- `get_entity(tx, entity_id, label)`
- `get_neighbors(tx, entity_id, label, max_depth)`
- `get_relationships(tx, entity_id, label)`
- `get_case_subgraph(tx, case_id)`
- `get_raw_paths(tx, source_id, target_id, max_depth)`
- `get_entity_timeline(tx, entity_id, label)`
- `filter_by_source(tx, source_name)`
- `filter_by_date(tx, start_date, end_date)`
- `get_evidence_linked_relationships(tx, evidence_id)`
