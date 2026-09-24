"""
CrimeNet AI — Member 5: Analytical Service Contract
Exposes high-level analytical endpoints to be consumed by M2 (Backend) and presented by M1.
Does not build duplicate HTTP server routing; provides pure, robust Python service facades.

Exported Services:
- analyze_network()
- calculate_centrality()
- find_shortest_path()
- find_multi_hop_paths()
- find_indirect_connections()
- detect_communities()
- find_bridges()
- detect_anomalies()
- analyze_temporal_patterns()
- cross_verify_sources()
- run_demo_investigation()
"""

from typing import List, Dict, Any, Optional
import networkx as nx

from member5_graph_ml.models.schemas import (
    NetworkData,
    CentralityScore,
    NetworkMetrics,
    Community,
    MultiHopPath,
    IndirectConnection,
    AnomalyResult,
    TemporalAnalysisResult,
    TemporalEvent,
    TemporalGraphSnapshot,
    CrossVerificationResult,
    NetworkAnalysisReport,
)
from member5_graph_ml.graph_engine.analytics import (
    build_networkx_graph,
    compute_network_metrics,
    compute_centralities,
    detect_louvain_communities,
    find_bridges_and_cut_vertices,
)
from member5_graph_ml.relationship_discovery.hidden_links import (
    find_multi_hop_paths as engine_find_multi_hop,
    find_common_intermediaries,
    discover_all_hidden_triangles_and_intermediaries,
)
from member5_graph_ml.anomaly_detection.detector import (
    detect_rapid_transaction_sequences,
    detect_circular_transaction_loops,
    detect_sudden_communication_bursts,
    detect_ml_anomalies_isolation_forest,
)
from member5_graph_ml.temporal.timeline import (
    analyze_temporal_events,
    generate_graph_playback_snapshots,
    analyze_before_after_incident,
)
from member5_graph_ml.cross_verification.verifier import (
    cross_verify_location_and_transactions,
)
from member5_graph_ml.demo_data import (
    create_demo_network_data,
    create_demo_temporal_events,
    create_demo_cross_verification_records,
)


class GraphMLAnalyticsService:
    """
    Unified analytics service facade consumed directly by M2 Backend.
    Guarantees explainability and strictly eliminates subjective risk scores.
    """

    def __init__(self):
        pass

    def calculate_centrality(
        self,
        network_data: NetworkData,
    ) -> List[CentralityScore]:
        """Calculates degree, betweenness, pagerank, closeness, and role assignment."""
        G = build_networkx_graph(network_data)
        return compute_centralities(G)

    def find_shortest_path(
        self,
        network_data: NetworkData,
        source_id: str,
        target_id: str,
    ) -> Optional[MultiHopPath]:
        """Finds shortest path between two entities with explainable evidence trace."""
        G = build_networkx_graph(network_data)
        paths = engine_find_multi_hop(G, source_id, target_id, max_hops=10, cutoff=1)
        return paths[0] if paths else None

    def find_multi_hop_paths(
        self,
        network_data: NetworkData,
        source_id: str,
        target_id: str,
        max_hops: int = 5,
        cutoff: int = 10,
    ) -> List[MultiHopPath]:
        """Finds all multi-hop paths between two entities up to max_hops."""
        G = build_networkx_graph(network_data)
        return engine_find_multi_hop(G, source_id, target_id, max_hops=max_hops, cutoff=cutoff)

    def find_indirect_connections(
        self,
        network_data: NetworkData,
        entity_a_id: str,
        entity_b_id: str,
    ) -> List[IndirectConnection]:
        """Discovers shared intermediaries (Phones, Accounts, Locations, Vehicles, Orgs)."""
        G = build_networkx_graph(network_data)
        return find_common_intermediaries(G, entity_a_id, entity_b_id)

    def detect_communities(
        self,
        network_data: NetworkData,
    ) -> List[Community]:
        """Partitions network using Louvain algorithm and calculates boundary interactions."""
        G = build_networkx_graph(network_data)
        return detect_louvain_communities(G)

    def find_bridges(
        self,
        network_data: NetworkData,
    ) -> List[Dict[str, Any]]:
        """Identifies critical bridge edges and cut vertices (articulation points)."""
        G = build_networkx_graph(network_data)
        return find_bridges_and_cut_vertices(G)

    def detect_anomalies(
        self,
        network_data: Optional[NetworkData] = None,
        transactions: Optional[List[Dict[str, Any]]] = None,
        communications: Optional[List[Dict[str, Any]]] = None,
        feature_matrix: Optional[List[Dict[str, Any]]] = None,
    ) -> List[AnomalyResult]:
        """
        Runs comprehensive multi-modal anomaly detection:
        - Rapid transaction sequences (layering / structuring)
        - Circular transaction loops (round tripping)
        - Sudden communication bursts
        - Unsupervised Isolation Forest outliers
        """
        anomalies: List[AnomalyResult] = []

        if transactions:
            anomalies.extend(detect_rapid_transaction_sequences(transactions))

        if network_data:
            G = build_networkx_graph(network_data, directed=True)
            anomalies.extend(detect_circular_transaction_loops(G))

        if communications:
            anomalies.extend(detect_sudden_communication_bursts(communications))

        if feature_matrix and len(feature_matrix) >= 8:
            anomalies.extend(detect_ml_anomalies_isolation_forest(feature_matrix))

        return anomalies

    def analyze_temporal_patterns(
        self,
        events: List[TemporalEvent],
        network_data: Optional[NetworkData] = None,
        incident_timestamp: Optional[str] = None,
        time_slices: int = 5,
    ) -> TemporalAnalysisResult:
        """
        Executes timeline aggregation, burst detection, before/after incident slicing,
        and temporal graph playback snapshot creation.
        """
        analysis = analyze_temporal_events(events)

        if incident_timestamp:
            analysis.before_after_crime_analysis = analyze_before_after_incident(
                events, incident_timestamp=incident_timestamp
            )

        if network_data:
            analysis.playback_snapshots = generate_graph_playback_snapshots(
                network_data, time_slices=time_slices
            )

        return analysis

    def cross_verify_sources(
        self,
        cdr_records: List[Dict[str, Any]],
        transaction_records: List[Dict[str, Any]],
        fir_claims: Optional[List[Dict[str, Any]]] = None,
    ) -> List[CrossVerificationResult]:
        """Cross-checks CDRs, bank records, and FIR witness claims for discrepancies."""
        return cross_verify_location_and_transactions(
            cdr_records=cdr_records,
            transaction_records=transaction_records,
            fir_claims=fir_claims,
        )

    def analyze_network(
        self,
        network_data: NetworkData,
        transactions: Optional[List[Dict[str, Any]]] = None,
        communications: Optional[List[Dict[str, Any]]] = None,
        temporal_events: Optional[List[TemporalEvent]] = None,
        cdr_records: Optional[List[Dict[str, Any]]] = None,
        fir_claims: Optional[List[Dict[str, Any]]] = None,
    ) -> NetworkAnalysisReport:
        """
        Master analytics execution method returning an integrated analytical intelligence report.
        """
        G = build_networkx_graph(network_data)
        metrics = compute_network_metrics(G)
        centralities = compute_centralities(G)
        communities = detect_louvain_communities(G)
        hidden_rels = discover_all_hidden_triangles_and_intermediaries(G)

        top_intermediaries = [
            c for c in centralities if "Bridge" in c.network_role or "Chokepoint" in c.network_role
        ]

        anomalies = self.detect_anomalies(
            network_data=network_data,
            transactions=transactions,
            communications=communications,
        )

        discrepancies: List[CrossVerificationResult] = []
        if cdr_records and transactions:
            discrepancies = self.cross_verify_sources(
                cdr_records=cdr_records,
                transaction_records=transactions,
                fir_claims=fir_claims,
            )

        temporal_res = None
        if temporal_events:
            temporal_res = self.analyze_temporal_patterns(
                events=temporal_events,
                network_data=network_data,
            )

        summary = [
            f"Analyzed {metrics.total_nodes} nodes and {metrics.total_edges} edges across {metrics.number_of_connected_components} component(s).",
            f"Detected {len(communities)} distinct structural communities.",
            f"Identified {len(top_intermediaries)} high-betweenness bridge entities facilitating cross-cluster flow.",
            f"Discovered {len(hidden_rels)} indirect connections via shared non-person intermediaries.",
            f"Flagged {len(anomalies)} analytical anomalies requiring investigative review.",
            f"Identified {len(discrepancies)} cross-source data discrepancies.",
        ]

        return NetworkAnalysisReport(
            network_metrics=metrics,
            centrality_rankings=centralities,
            top_intermediaries=top_intermediaries,
            communities=communities,
            hidden_relationships=hidden_rels,
            anomalies=anomalies,
            discrepancies=discrepancies,
            temporal_summary=temporal_res,
            analytical_summary=summary,
        )

    def run_demo_investigation(self) -> Dict[str, Any]:
        """
        Runs the end-to-end continuous CrimeNet AI demo story:
        FIR -> Person A -> Phone X -> Person B -> Bank Y -> Trans Z -> Org C -> Location -> Crime
        """
        demo_net = create_demo_network_data()
        demo_events = create_demo_temporal_events()
        cdrs, txs, firs = create_demo_cross_verification_records()

        # Execute full path finding from Crime to FIR suspect
        G = build_networkx_graph(demo_net)
        crime_to_suspect_path = engine_find_multi_hop(
            G, "NODE_CRIME_EVENT", "NODE_ORG_C", max_hops=6
        )

        report = self.analyze_network(
            network_data=demo_net,
            transactions=txs,
            communications=[
                {"caller": "NODE_PERSON_A", "callee": "NODE_PERSON_B", "timestamp": e.timestamp}
                for e in demo_events if e.event_type == "COMMUNICATION"
            ],
            temporal_events=demo_events,
            cdr_records=cdrs,
            fir_claims=firs,
        )

        return {
            "demo_story_headline": "FIR 261/2026 Syndicate Network Analysis",
            "report": report,
            "highlighted_multi_hop_path": crime_to_suspect_path[0] if crime_to_suspect_path else None,
        }


# Singleton service instance ready for M2
analytics_service = GraphMLAnalyticsService()
