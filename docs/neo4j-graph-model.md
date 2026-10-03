# CrimeNet AI — Neo4j Graph Model

Neo4j stores the criminal-network graph used for relationship discovery, path analysis, community detection, centrality analysis, and graph visualization.

PostgreSQL remains the source of truth for cases, users, evidence metadata, and audit data.

---

## Graph Design Principle

Every investigation query must be scoped by `caseId`.

A query must never return the full national graph unless the user is explicitly authorized for a global analytical view.

```text
Case
 ↓
Authorized case entities
 ↓
Case-scoped relationships
 ↓
Investigation result
```

---

## Node Labels

### `Case`

```cypher
(:Case {
  case_id: string,
  case_number: string,
  title: string,
  status: string,
  created_at: datetime
})
```

### `Person`

```cypher
(:Person {
  person_id: string,
  name: string,
  age: integer,
  city: string,
  role: string,
  case_id: string
})
```

### `FIR`

```cypher
(:FIR {
  fir_id: string,
  crime_type: string,
  date: date,
  location: string,
  case_status: string,
  case_id: string
})
```

### `Transaction`

```cypher
(:Transaction {
  transaction_id: string,
  amount_inr: float,
  date: date,
  method: string,
  location: string,
  risk_label: string,
  case_id: string
})
```

### `Communication`

```cypher
(:Communication {
  call_id: string,
  timestamp: datetime,
  duration_sec: integer,
  call_type: string,
  status: string,
  case_id: string
})
```

### `Organization`

```cypher
(:Organization {
  organization_id: string,
  name: string,
  type: string,
  case_id: string
})
```

### `Location`

```cypher
(:Location {
  location_id: string,
  name: string,
  city: string,
  latitude: float,
  longitude: float,
  location_precision: string,
  case_id: string
})
```

`location_precision` can be:

- `GPS`
- `CELL_TOWER`
- `ADDRESS`
- `CITY`
- `UNKNOWN`

---

## Relationships

| Relationship | Direction | Meaning |
|---|---|---|
| `HAS_ENTITY` | `Case → Entity` | Case contains an entity |
| `NAMED_IN_FIR` | `Person → FIR` | Person is named in an FIR |
| `CO_ACCUSED_WITH` | `Person → Person` | Persons are co-accused |
| `TRANSFERRED_FUNDS` | `Person → Person` | Financial transfer relationship |
| `COMMUNICATED_WITH` | `Person → Person` | Communication relationship |
| `LOCATED_AT` | `Entity → Location` | Entity linked to a location |
| `ASSOCIATED_WITH` | `Entity → Entity` | General investigative association |
| `INVOLVES` | `FIR → Person` | FIR involves a person |

---

## Case Relationship Model

```cypher
(:Case)-[:HAS_ENTITY]->(:Person)
(:Case)-[:HAS_ENTITY]->(:FIR)
(:Case)-[:HAS_ENTITY]->(:Transaction)
(:Case)-[:HAS_ENTITY]->(:Communication)
```

This allows every graph query to begin from an authorized case.

---

## Safe Case-Scoped Query Pattern

### Get a person’s case-scoped relationships

```cypher
MATCH (c:Case {case_id: $caseId})-[:HAS_ENTITY]->(p:Person)
WHERE p.person_id = $personId
MATCH (p)-[r]-(related)
RETURN p, r, related
LIMIT 200
```

### Get case graph overview

```cypher
MATCH (c:Case {case_id: $caseId})-[:HAS_ENTITY]->(e)
OPTIONAL MATCH (e)-[r]-(related)
RETURN e, r, related
LIMIT 500
```

### Find hidden path between two persons

```cypher
MATCH path = shortestPath(
  (a:Person {person_id: $personA})-[*..4]-(b:Person {person_id: $personB})
)
WHERE all(node IN nodes(path) WHERE node.case_id = $caseId)
RETURN path
LIMIT 10
```

### Find financial transfers

```cypher
MATCH (c:Case {case_id: $caseId})-[:HAS_ENTITY]->(p1:Person)
MATCH (c)-[:HAS_ENTITY]->(p2:Person)
MATCH (p1)-[t:TRANSFERRED_FUNDS]-(p2)
RETURN p1, t, p2
ORDER BY t.amount_inr DESC
LIMIT 100
```

### Find communication links

```cypher
MATCH (c:Case {case_id: $caseId})-[:HAS_ENTITY]->(p1:Person)
MATCH (c)-[:HAS_ENTITY]->(p2:Person)
MATCH (p1)-[comm:COMMUNICATED_WITH]-(p2)
RETURN p1, comm, p2
ORDER BY comm.timestamp DESC
LIMIT 100
```

---

## Unsafe Query Pattern

Do **not** use this pattern for case-based investigation:

```cypher
MATCH (p:Person {person_id: $personId})-[r]-(related)
RETURN p, r, related
```

This can expose relationships from other cases.

---

## Recommended Indexes

```cypher
CREATE INDEX case_id_index IF NOT EXISTS
FOR (c:Case) ON (c.case_id);

CREATE INDEX person_id_index IF NOT EXISTS
FOR (p:Person) ON (p.person_id);

CREATE INDEX person_case_index IF NOT EXISTS
FOR (p:Person) ON (p.case_id, p.person_id);

CREATE INDEX fir_id_index IF NOT EXISTS
FOR (f:FIR) ON (f.fir_id);

CREATE INDEX transaction_id_index IF NOT EXISTS
FOR (t:Transaction) ON (t.transaction_id);

CREATE INDEX communication_id_index IF NOT EXISTS
FOR (c:Communication) ON (c.call_id);
```

---

## Query Performance Rules

- Always start from an indexed `case_id` or `person_id`.
- Use `LIMIT` on every visualization query.
- Avoid unbounded variable-length paths.
- Set a maximum path depth, such as `*..4`.
- Use `PROFILE` to inspect expensive queries.
- Precompute expensive analytics such as betweenness, PageRank, and communities.

Neo4j recommends `EXPLAIN` for inspecting query plans and `PROFILE` for measuring actual query execution. [16][20]

---

## Analytics

### Degree centrality

```cypher
MATCH (c:Case {case_id: $caseId})-[:HAS_ENTITY]->(p:Person)
MATCH (p)-[r]-()
RETURN p.person_id, p.name, count(r) AS degree
ORDER BY degree DESC
LIMIT 20
```

### Community detection

Community detection results should be precomputed and stored as:

```cypher
(:Person {community_id: integer, community_label: string})
```

### Circular transfer indicator

```cypher
MATCH path = (a:Person)-[:TRANSFERRED_FUNDS*3..5]->(a)
WHERE all(node IN nodes(path) WHERE node.case_id = $caseId)
RETURN path
LIMIT 20
```

This is an investigative indicator, not proof of wrongdoing.
