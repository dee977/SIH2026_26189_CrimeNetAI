"""
CrimeNet AI — Member 5: Anomaly Detection Engine
Combines Rule-Based pattern detection and ML-based anomaly models (IsolationForest).
Generates explainable findings detailing What, Why, Records, Period, Sources, Evidence.
Strictly NO risk scores, NO risk labels.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import IsolationForest
import networkx as nx

from member5_graph_ml.models.schemas import (
    AnomalyResult,
    AnomalyExplanation,
    EvidenceReference,
)


def detect_rapid_transaction_sequences(
    transactions: List[Dict[str, Any]],
    time_window_minutes: int = 30,
    min_sequence_length: int = 3,
) -> List[AnomalyResult]:
    """
    Detects rapid successive transfers between accounts or through a central entity
    within a short time window (layering / structuring pattern).
    """
    results: List[AnomalyResult] = []
    if not transactions or len(transactions) < min_sequence_length:
        return results

    # Check 1: Individual entity structuring (repeated transactions through same sender/receiver)
    by_entity: Dict[str, List[Dict[str, Any]]] = {}
    valid_txs = []
    for tx in transactions:
        snd = tx.get("source_id") or tx.get("sender_account")
        rec = tx.get("target_id") or tx.get("receiver_account")
        ts_str = tx.get("timestamp")
        if not ts_str:
            continue
        try:
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        except Exception:
            continue

        item = {**tx, "dt": ts, "snd": snd, "rec": rec}
        valid_txs.append(item)
        if snd:
            by_entity.setdefault(snd, []).append(item)
        if rec:
            by_entity.setdefault(rec, []).append(item)

    for entity_id, tx_list in by_entity.items():
        if len(tx_list) < min_sequence_length:
            continue
        tx_list.sort(key=lambda x: x["dt"])
        # Sliding window check
        for i in range(len(tx_list) - min_sequence_length + 1):
            window = tx_list[i : i + min_sequence_length]
            delta = (window[-1]["dt"] - window[0]["dt"]).total_seconds() / 60.0
            if delta <= time_window_minutes:
                tx_ids = [tx.get("transaction_id", f"TX_{idx}") for idx, tx in enumerate(window)]
                amounts = [float(tx.get("amount", 0)) for tx in window]
                sources = list(set([tx.get("source", "BANKING_LEDGER") for tx in window]))
                ev_ids = [tx.get("evidence_id") for tx in window if tx.get("evidence_id")]

                explanation = AnomalyExplanation(
                    what_was_detected=(
                        f"Rapid sequence of {len(window)} transactions totaling ₹{sum(amounts):,.2f} "
                        f"executed through entity '{entity_id}' within {delta:.1f} minutes."
                    ),
                    why_unusual=(
                        f"High-frequency velocity: {len(window)} transactions completed within "
                        f"{delta:.1f} minutes (threshold: {time_window_minutes} mins). Indicates structuring or rapid funneling."
                    ),
                    contributing_records=tx_ids,
                    time_period=f"{window[0]['dt'].isoformat()} to {window[-1]['dt'].isoformat()}",
                    sources=sources,
                    supporting_relationships=[
                        f"{tx.get('sender_account', 'N/A')} -> {tx.get('receiver_account', 'N/A')} (₹{tx.get('amount', 0)})"
                        for tx in window
                    ],
                    supporting_evidence=[
                        EvidenceReference(
                            evidence_id=eid,
                            source_type="BANKING_RECORD",
                            document_ref=f"Transaction batch {entity_id}",
                        )
                        for eid in ev_ids
                    ],
                )

                results.append(
                    AnomalyResult(
                        anomaly_id=f"ANOM_RAPID_TX_{entity_id[:8]}_{i}",
                        anomaly_type="RAPID_TRANSACTION_SEQUENCE",
                        detection_method="RULE_BASED",
                        anomaly_indicator="PATTERN_MATCH",
                        involved_entities=[entity_id],
                        explanation=explanation,
                    )
                )
                break

    # Check 2: Sequential chain layering across accounts (e.g. A -> B -> C -> D in short order)
    if not results and len(valid_txs) >= min_sequence_length:
        valid_txs.sort(key=lambda x: x["dt"])
        for i in range(len(valid_txs) - min_sequence_length + 1):
            window = valid_txs[i : i + min_sequence_length]
            delta = (window[-1]["dt"] - window[0]["dt"]).total_seconds() / 60.0
            if delta <= time_window_minutes:
                # Check if accounts link sequentially (hop chain)
                is_chain = all(
                    window[k]["rec"] == window[k + 1]["snd"]
                    for k in range(len(window) - 1)
                )
                if is_chain:
                    involved = [window[0]["snd"]] + [w["rec"] for w in window]
                    tx_ids = [tx.get("transaction_id", f"TX_{idx}") for idx, tx in enumerate(window)]
                    amounts = [float(tx.get("amount", 0)) for tx in window]
                    ev_ids = [tx.get("evidence_id") for tx in window if tx.get("evidence_id")]

                    explanation = AnomalyExplanation(
                        what_was_detected=(
                            f"Rapid sequential multi-hop fund layering chain: "
                            f"{' -> '.join(involved)} ({len(window)} hops) within {delta:.1f} minutes."
                        ),
                        why_unusual=(
                            f"Capital relocated across {len(window)} distinct accounts within {delta:.1f} minutes, "
                            f"characteristic of high-speed electronic money laundering layering."
                        ),
                        contributing_records=tx_ids,
                        time_period=f"{window[0]['dt'].isoformat()} to {window[-1]['dt'].isoformat()}",
                        sources=list(set([tx.get("source", "BANKING_LEDGER") for tx in window])),
                        supporting_relationships=[
                            f"{w['snd']} -> {w['rec']} (₹{w.get('amount', 0)})"
                            for w in window
                        ],
                        supporting_evidence=[
                            EvidenceReference(evidence_id=eid, source_type="BANKING_RECORD")
                            for eid in ev_ids
                        ],
                    )

                    results.append(
                        AnomalyResult(
                            anomaly_id=f"ANOM_CHAIN_LAYERING_{i}",
                            anomaly_type="RAPID_TRANSACTION_SEQUENCE",
                            detection_method="RULE_BASED",
                            anomaly_indicator="PATTERN_MATCH",
                            involved_entities=involved,
                            explanation=explanation,
                        )
                    )
                    break

    return results



def detect_circular_transaction_loops(
    G: nx.DiGraph,
    min_cycle_length: int = 3,
    max_cycle_length: int = 6,
) -> List[AnomalyResult]:
    """
    Detects circular fund-routing loops (e.g. A -> B -> C -> A) in transaction directed graph.
    Commonly used in round-tripping, trade-based money laundering, or phantom invoicing.
    """
    results: List[AnomalyResult] = []
    if not G.is_directed() or G.number_of_nodes() < min_cycle_length:
        return results

    try:
        cycles = list(nx.simple_cycles(G))
    except Exception:
        cycles = []

    for idx, cycle in enumerate(cycles):
        if min_cycle_length <= len(cycle) <= max_cycle_length:
            involved_names = [G.nodes[n].get("name", n) for n in cycle]
            cycle_edges = []
            ev_list = []
            for i in range(len(cycle)):
                u = cycle[i]
                v = cycle[(i + 1) % len(cycle)]
                edata = G.get_edge_data(u, v) or {}
                rel = edata.get("relationship_type", "TRANSFERS_TO")
                amt = edata.get("properties", {}).get("amount", "unspecified")
                cycle_edges.append(f"{G.nodes[u].get('name', u)} -[{rel} (amt: {amt})]-> {G.nodes[v].get('name', v)}")
                for eid in edata.get("evidence_ids", []):
                    ev_list.append(EvidenceReference(evidence_id=eid, source_type="BANK_LEDGER"))

            explanation = AnomalyExplanation(
                what_was_detected=(
                    f"Closed circular transaction loop detected comprising {len(cycle)} entities: "
                    f"{' -> '.join(involved_names)} -> {involved_names[0]}."
                ),
                why_unusual=(
                    "Legitimate commercial payments rarely return capital to the origin entity "
                    "via intermediate hops without net economic justification. Characteristic of circular fund routing."
                ),
                contributing_records=[f"Cycle nodes: {', '.join(cycle)}"],
                time_period="Observed graph historical period",
                sources=["BANKING_GRAPH"],
                supporting_relationships=cycle_edges,
                supporting_evidence=ev_list[:10],
            )

            results.append(
                AnomalyResult(
                    anomaly_id=f"ANOM_CIRCULAR_LOOP_{idx + 1:03d}",
                    anomaly_type="CIRCULAR_TRANSACTION_LOOP",
                    detection_method="RULE_BASED",
                    anomaly_indicator="PATTERN_MATCH",
                    involved_entities=cycle,
                    explanation=explanation,
                )
            )

    return results


def detect_sudden_communication_bursts(
    communications: List[Dict[str, Any]],
    burst_threshold_multiplier: float = 3.0,
    min_call_count: int = 5,
) -> List[AnomalyResult]:
    """
    Detects sudden spikes in communication frequency between entity pairs compared to baseline.
    """
    results: List[AnomalyResult] = []
    if not communications:
        return results

    # Pair communications
    pair_comms: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
    for c in communications:
        caller = c.get("caller") or c.get("source_id")
        callee = c.get("callee") or c.get("target_id")
        if not caller or not callee:
            continue
        pair_key = tuple(sorted([caller, callee]))
        ts_str = c.get("timestamp")
        if ts_str:
            try:
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                pair_comms.setdefault(pair_key, []).append({**c, "dt": dt})
            except Exception:
                continue

    for (p1, p2), call_list in pair_comms.items():
        if len(call_list) < min_call_count:
            continue

        call_list.sort(key=lambda x: x["dt"])
        total_span_hours = max((call_list[-1]["dt"] - call_list[0]["dt"]).total_seconds() / 3600.0, 1.0)
        avg_rate_per_hour = len(call_list) / total_span_hours

        # Detect peak 1-hour window
        for i in range(len(call_list)):
            win_start = call_list[i]["dt"]
            win_end = win_start + timedelta(hours=1)
            sub_window = [c for c in call_list if win_start <= c["dt"] <= win_end]
            if len(sub_window) >= min_call_count and len(sub_window) >= avg_rate_per_hour * burst_threshold_multiplier:
                cdr_records = [c.get("cdr_id", f"CDR_{idx}") for idx, c in enumerate(sub_window)]
                ev_ids = [c.get("evidence_id") for c in sub_window if c.get("evidence_id")]

                explanation = AnomalyExplanation(
                    what_was_detected=(
                        f"Communication surge: {len(sub_window)} calls/messages exchanged between {p1} and {p2} "
                        f"within a single 1-hour window ({win_start.strftime('%Y-%m-%d %H:%M')} to {win_end.strftime('%H:%M')})."
                    ),
                    why_unusual=(
                        f"Hourly rate surged to {len(sub_window)} events/hour, representing a "
                        f"{len(sub_window)/max(avg_rate_per_hour, 0.1):.1f}x deviation over baseline historical interaction."
                    ),
                    contributing_records=cdr_records,
                    time_period=f"{win_start.isoformat()} to {win_end.isoformat()}",
                    sources=["CDR_LOGS", "TELECOM_PROVIDER"],
                    supporting_relationships=[f"{p1} <-> {p2} (Burst: {len(sub_window)} contacts)"],
                    supporting_evidence=[
                        EvidenceReference(evidence_id=eid, source_type="CDR")
                        for eid in set(ev_ids)
                    ],
                )

                results.append(
                    AnomalyResult(
                        anomaly_id=f"ANOM_COMM_BURST_{p1[:6]}_{p2[:6]}",
                        anomaly_type="SUDDEN_COMMUNICATION_BURST",
                        detection_method="RULE_BASED",
                        anomaly_indicator="HIGH_DEVIATION",
                        involved_entities=[p1, p2],
                        explanation=explanation,
                    )
                )
                break

    return results


def detect_ml_anomalies_isolation_forest(
    feature_matrix: List[Dict[str, Any]],
    entity_key: str = "entity_id",
    contamination: float = 0.08,
) -> List[AnomalyResult]:
    """
    Unsupervised ML Anomaly Detection using scikit-learn IsolationForest on multidimensional entity behaviors.
    Feature matrix expects numeric features such as:
    - [degree, tx_volume, comm_frequency, off_hour_ratio, unique_contacts]
    Explains the mathematical deviation without generating subjective risk scores.
    """
    if len(feature_matrix) < 8:
        # Insufficient statistical sample for robust Isolation Forest
        return []

    # Extract numerical features
    entity_ids = [item[entity_key] for item in feature_matrix]
    feature_keys = [k for k in feature_matrix[0].keys() if k != entity_key and isinstance(feature_matrix[0][k], (int, float))]

    if not feature_keys:
        return []

    X = np.array([[item.get(k, 0.0) for k in feature_keys] for item in feature_matrix])

    # Fit Isolation Forest
    iso_forest = IsolationForest(contamination=contamination, random_state=42)
    predictions = iso_forest.fit_predict(X)
    scores = iso_forest.decision_function(X)  # Lower score = more anomalous

    means = np.mean(X, axis=0)
    stds = np.std(X, axis=0) + 1e-6

    results: List[AnomalyResult] = []

    for idx, pred in enumerate(predictions):
        if pred == -1:  # Outlier detected
            ent_id = entity_ids[idx]
            raw_vals = X[idx]
            score_val = scores[idx]

            # Identify which dimensions contributed the largest z-score
            z_scores = np.abs((raw_vals - means) / stds)
            top_outlier_dim_idx = np.argmax(z_scores)
            top_metric_name = feature_keys[top_outlier_dim_idx]
            top_metric_val = raw_vals[top_outlier_dim_idx]
            mean_val = means[top_outlier_dim_idx]

            explanation = AnomalyExplanation(
                what_was_detected=(
                    f"Multivariate behavioral anomaly detected for '{ent_id}' via Isolation Forest "
                    f"(Anomaly separation score: {score_val:.3f})."
                ),
                why_unusual=(
                    f"Primary driver '{top_metric_name}' registered {top_metric_val:.2f} "
                    f"(Cohort baseline mean: {mean_val:.2f}, z-score: {z_scores[top_outlier_dim_idx]:.2f}). "
                    f"Behavior departs significantly from the global network distribution."
                ),
                contributing_records=[f"Feature breakdown: {dict(zip(feature_keys, raw_vals))}"],
                time_period="Aggregate analytical observation window",
                sources=["GRAPH_ML_FEATURE_STORE"],
                supporting_relationships=[f"Entity exhibits outlier profile across features: {feature_keys}"],
                supporting_evidence=[],
            )

            results.append(
                AnomalyResult(
                    anomaly_id=f"ANOM_ML_IFOREST_{ent_id[:8]}",
                    anomaly_type="BEHAVIORAL_OUTLIER",
                    detection_method="ML_UNSUPERVISED",
                    anomaly_indicator="HIGH_DEVIATION",
                    involved_entities=[ent_id],
                    explanation=explanation,
                )
            )

    return results
