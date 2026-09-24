# MEMBER 5 — GRAPH INTELLIGENCE + MACHINE LEARNING
**CrimeNet AI — AI-Powered Criminal Network Analysis System (SIH Problem ID: SIH26189)**  
**Role:** M5 — Graph Analytics + Machine Learning Engineer  
**Exclusive Directory:** `member5_graph_ml/`

---

## 1. Absolute Ownership & Scope Boundaries

### Owned Exclusively by M5:
- **Graph Analytics & Network Intelligence**: Degree centrality, Betweenness centrality, PageRank, Closeness centrality, Eigenvector centrality, network density, diameter, and clustering coefficients.
- **Hidden Relationship Discovery**: Multi-hop path tracing, indirect link identification via shared intermediaries (common phones, bank accounts, vehicles, safehouses/locations, shell organizations).
- **Community Detection**: Louvain modularity clustering, connected component isolation, and inter-community border interactions.
- **Analytical & ML Anomaly Detection**: Rule-based detection (rapid transaction layering, circular transaction loops, sudden communication bursts) and Unsupervised ML detection (Isolation Forest multivariate outliers).
- **Temporal Analysis & Playback**: Timeline aggregation, event burst identification, before/after incident activity comparison windows, and discrete time-slice snapshots for UI graph playback.
- **Cross-Source Verification Engine**: Automated consistency checking between FIR records, CDR tower logs, and Banking transaction locations/timestamps.
- **Explainable Findings**: Generating human-readable analytical explanations with underlying record references and evidence links.
- **Integration Contract for M2**: Exposing a high-level analytical service contract (`GraphMLAnalyticsService`).

### Explicitly Excluded (Owned by Other Team Members):
- Frontend (M1)
- Core FastAPI Web Routing / HTTP Server (M2)
- Neo4j Data Ingestion & Storage Importer (M3)
- OCR & NLP Entity Extraction (M4)
- Entity Resolution (M4)
- Authentication, RBAC, SHA-256 Ledger, and Infrastructure Deployment (M6)

---

## 2. Critical Interpretation & Terminology Rule

> [!IMPORTANT]
> **NO RISK SCORES — NO CRIMINAL LABELS**  
> A high-centrality node is **not** automatically a criminal. M5 outputs **never** contain:
> - `risk_score`
> - `risk_label`
> - `criminal = Yes`
> - `criminal probability`
> - Fake threat percentage scores.
>
> All outputs employ verified law-enforcement analytical terminology:
> - **Analytical Finding**
> - **High-connectivity Entity**
> - **Bridge/Intermediary Candidate**
> - **Network Position**
> - **Investigator Lead**
> - **Anomaly Indicator**
> - **Explanatory Signal**
> - **Supporting Evidence**

---

## 3. Directory Layout

```
member5_graph_ml/
├── __init__.py                     # Package export of service and core models
├── README.md                       # Architecture, algorithm docs & integration contract
├── demo_data.py                    # Continuous SIH26189 demo story generator
├── service.py                      # Clean analytical facade for M2 consumption
├── models/
│   ├── __init__.py
│   └── schemas.py                  # Pydantic analytical data contracts (zero risk scores)
├── graph_engine/
│   ├── __init__.py
│   └── analytics.py                # NetworkX & GDS centrality, Louvain, topology
├── relationship_discovery/
│   ├── __init__.py
│   └── hidden_links.py             # Multi-hop paths & common asset intermediaries
├── anomaly_detection/
│   ├── __init__.py
│   └── detector.py                 # Rules (burst, cycle, rapid tx) & ML (Isolation Forest)
├── temporal/
│   ├── __init__.py
│   └── timeline.py                 # Timeline aggregation, burst analysis, playback snapshots
├── cross_verification/
│   ├── __init__.py
│   └── verifier.py                 # Multi-source contradiction detection (FIR vs CDR vs Bank)
└── tests/
    └── test_analytics.py           # 12 automated unit and integration tests (100% pass)
```

---

## 4. Algorithms & Graph Analytics

### Centrality Analysis
- **Degree Centrality**: Quantifies direct incident connections. Flags *High-connectivity Entities* operating as local communication or transaction hubs.
- **Betweenness Centrality**: Evaluates the fraction of all shortest paths passing through a node. Discovers *Bridge/Intermediary Candidates* and *Chokepoints* that connect otherwise disjoint criminal cells.
- **PageRank**: Computes eigenvector-based influence with damping factor 0.85, weighting incoming ties from influential entities.
- **Closeness & Eigenvector Centrality**: Measures propagation speed and recursive centrality.

### Community Detection
- **Louvain Modularity Algorithm**: Optimizes modularity $Q$ on the undirected projection to detect structural criminal sub-cells.
- Computes **Inter-Community Edge Matrices** to track border crossings and cross-cell liaisons.

### Topology & Structural Vulnerabilities
- **Articulation Points (Cut Vertices)**: Nodes whose incapacitation divides the network into disjoint components.
- **Bridges**: Edges representing single points of operational failure.

---

## 5. Hidden Relationship Discovery

Discovers multi-hop relationships and non-obvious associations:
1. **Multi-Hop Pathfinding**: Explores all simple paths up to $k$ hops between any arbitrary pair of entities, generating an explainable chronological trace:
   $$\text{Person A} \xrightarrow{\text{USES\_PHONE}} \text{Phone X} \xrightarrow{\text{CALLS}} \text{Phone Y} \xrightarrow{\text{USES\_PHONE}} \text{Person B} \xrightarrow{\text{SIGNATORY}} \text{Bank Y} \dots$$
2. **Shared Intermediaries**: Automatically surfaces common non-person conduits between suspect pairs:
   - **Common Phone Connections**: Multiple actors operating or dialing the same IMEI/SIM.
   - **Common Bank Accounts**: Shared signatories, mules, or cross-fund routing.
   - **Common Vehicles**: Shared transport assets identified in toll/ANPR logs.
   - **Common Locations / Safehouses**: Shared physical coordinate or warehouse pings.
   - **Common Organizations**: Shared shell corporations, directors, or registered agents.

---

## 6. Anomaly Detection (Rule-Based & Machine Learning)

Every anomaly produces an **`AnomalyExplanation`** answering:
- **What was detected**
- **Why it was unusual**
- **Contributing records**
- **Time period**
- **Sources**
- **Supporting relationships & evidence IDs**

### Detection Patterns:
1. **Rapid Transaction Sequences (Layering / Structuring)**: Flags high-velocity fund movements where money traverses multiple accounts or funnels through an entity within short time windows (e.g. $< 30$ mins).
2. **Circular Fund Loops (Round-Tripping)**: Employs cycle-finding algorithms on directed transaction graphs to detect circular paths ($A \to B \to C \to A$) without economic rationale.
3. **Sudden Communication Bursts**: Detects statistical surges where call/message rates exceed historical baselines by $> 3.0\times$ within 1-hour intervals.
4. **Unsupervised ML Outlier Detection**: Leverages `sklearn.ensemble.IsolationForest` on multidimensional behavioral vectors (degree, volume, off-hour frequency, diversity of contacts) and generates z-score breakdowns for the primary contributing dimension.

---

## 7. Temporal Analysis & Graph Playback

1. **Activity Burst Detection**: Slides a configurable temporal window across multi-modal events to detect statistical activity concentrations.
2. **Before / After Incident Windows**: Profiles behavioral shifts (e.g. communications spike preceding a crime followed by immediate "radio silence").
3. **Graph Playback Snapshots**: Generates chronologically ordered cumulative snapshots allowing M1 (Frontend) to scrub through the evolution of the syndicate network over time.

---

## 8. Cross-Source Verification Engine

Cross-checks multi-source intelligence across FIRs, CDRs, Bank Transactions, and Geolocation pings.

### Discrepancy Detection:
- **Physical Co-location Conflict**: Flags impossible velocities (e.g. ATM withdrawal in Ahmedabad at 15:05 UTC while CDR tower log places phone in Mumbai at 15:10 UTC).
- **Alibi Contradictions**: Reconciles FIR witness/suspect statements against electronic CDR evidence.

> [!NOTE]
> The engine **never** decides unilaterally which source is truth. It tags the record as `DATA DISCREPANCY DETECTED`, details `Claim A` vs `Claim B`, and supplies actionable investigative reconciliation guidance.

---

## 9. M2 Service Contract & Integration Guide

M2 imports and calls `analytics_service` directly:

```python
from member5_graph_ml.service import analytics_service
from member5_graph_ml.models.schemas import NetworkData

# 1. Full integrated network analysis report
report = analytics_service.analyze_network(
    network_data=network_data,
    transactions=transactions_list,
    communications=comms_list,
    temporal_events=temporal_events_list,
    cdr_records=cdr_list,
    fir_claims=fir_claims_list,
)

# 2. Centrality rankings
centralities = analytics_service.calculate_centrality(network_data)

# 3. Multi-hop path tracing
path = analytics_service.find_shortest_path(network_data, source_id="NODE_CRIME", target_id="NODE_SUSPECT")

# 4. Hidden intermediaries
connections = analytics_service.find_indirect_connections(network_data, entity_a_id="A", entity_b_id="B")

# 5. Community detection
communities = analytics_service.detect_communities(network_data)

# 6. Cross-source verification
discrepancies = analytics_service.cross_verify_sources(
    cdr_records=cdr_records,
    transaction_records=tx_records,
    fir_claims=fir_claims,
)

# 7. End-to-end Demo Story Runner
demo_output = analytics_service.run_demo_investigation()
```

---

## 10. Continuous Demo Story (SIH26189)

M5 provides `member5_graph_ml.demo_data.create_demo_network_data()` which implements the full continuous story:
$$\text{FIR \#261/2026} \to \text{Alok Sharma} \to \text{Phone } +91\text{-}9876543210 \to \text{Vikram Malhotra} \to \text{HDFC Bank} \to \text{Apex Global Logistics} \to \text{Warehouse Changodar} \to \text{Contraband Seizure}$$

---

## 11. Verification & Test Execution

Run the complete test suite:
```bash
python -m unittest member5_graph_ml/tests/test_analytics.py
```
**Test Coverage:**
- `test_no_forbidden_fields`: Asserts absence of risk score / criminal label fields.
- `test_graph_metrics_and_centrality`: Verifies Degree, Betweenness, PageRank, Closeness, Eigenvector calculations.
- `test_community_detection`: Verifies Louvain modularity partitioning.
- `test_bridges_and_cut_vertices`: Verifies identification of articulation points and bridges.
- `test_multi_hop_demo_story_path`: Verifies explainable path trace generation.
- `test_hidden_intermediaries`: Verifies detection of common phones, accounts, vehicles.
- `test_anomaly_detection_rapid_transactions`: Verifies rapid structuring & chain layering.
- `test_anomaly_detection_circular_loop`: Verifies circular fund transfer loops.
- `test_anomaly_detection_isolation_forest`: Verifies unsupervised ML multivariate outlier detection.
- `test_temporal_analysis_and_playback`: Verifies temporal burst detection and graph playback slicing.
- `test_cross_verification_engine`: Verifies physical co-location discrepancy detection.
- `test_service_run_demo_investigation`: Verifies M2 service facade contract end-to-end.
