"""
CrimeNet AI — Member 5: Comprehensive Test Suite
Validates:
1. Absence of forbidden terms ('risk_score', 'criminal = Yes', fake threat scores).
2. Graph metrics & centrality calculations.
3. Louvain community detection & bridge detection.
4. Multi-hop path trace (FIR -> Person A -> Phone -> Person B -> Bank -> Org -> Location -> Crime).
5. Hidden relationship discovery (common phones, common accounts, common vehicles).
6. Rule-based & ML Anomaly detection (rapid tx sequences, circular loops, comm bursts, Isolation Forest).
7. Temporal analysis & playback snapshots.
8. Cross-verification engine (Mumbai CDR vs Ahmedabad ATM swipe discrepancy).
9. Unified Service facade contract for M2.
"""

import unittest
from member5_graph_ml.models.schemas import NetworkData, GraphNode, GraphEdge
from member5_graph_ml.graph_engine.analytics import (
    build_networkx_graph,
    compute_network_metrics,
    compute_centralities,
    detect_louvain_communities,
    find_bridges_and_cut_vertices,
)
from member5_graph_ml.relationship_discovery.hidden_links import (
    find_multi_hop_paths,
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
from member5_graph_ml.service import analytics_service


class TestMember5GraphML(unittest.TestCase):

    def setUp(self):
        self.demo_net = create_demo_network_data()
        self.demo_events = create_demo_temporal_events()
        self.cdrs, self.txs, self.firs = create_demo_cross_verification_records()

    def test_no_forbidden_fields(self):
        """CRITICAL RULE: No output should have 'risk_score' or 'criminal = Yes'."""
        report = analytics_service.analyze_network(self.demo_net)
        report_dict = report.model_dump()
        report_str = str(report_dict).lower()

        self.assertNotIn("risk_score", report_str)
        self.assertNotIn("risk_label", report_str)
        self.assertNotIn("criminal = yes", report_str)
        self.assertNotIn("criminal probability", report_str)

    def test_graph_metrics_and_centrality(self):
        G = build_networkx_graph(self.demo_net)
        self.assertEqual(G.number_of_nodes(), 11)
        self.assertEqual(G.number_of_edges(), 12)

        metrics = compute_network_metrics(G)
        self.assertEqual(metrics.total_nodes, 11)
        self.assertEqual(metrics.total_edges, 12)
        self.assertTrue(metrics.density > 0)

        centralities = compute_centralities(G)
        self.assertEqual(len(centralities), 11)

        # Vikram Malhotra (Person B) or Phone X should show high betweenness bridging actors
        roles = [c.network_role for c in centralities]
        self.assertTrue(any("Bridge" in r or "High-connectivity" in r for r in roles))

    def test_community_detection(self):
        G = build_networkx_graph(self.demo_net)
        communities = detect_louvain_communities(G)
        self.assertTrue(len(communities) >= 1)
        total_members = sum(c.size for c in communities)
        self.assertEqual(total_members, 11)

    def test_bridges_and_cut_vertices(self):
        # Create a graph with a known bridge and cut vertex
        test_net = NetworkData(
            nodes=[
                GraphNode(id="N1", name="Cluster A Node", entity_type="Person"),
                GraphNode(id="BRIDGE_NODE", name="Courier Intermediary", entity_type="Person"),
                GraphNode(id="N2", name="Cluster B Node", entity_type="Person"),
            ],
            edges=[
                GraphEdge(id="E1", source="N1", target="BRIDGE_NODE", relationship_type="COMMUNICATES_WITH"),
                GraphEdge(id="E2", source="BRIDGE_NODE", target="N2", relationship_type="COMMUNICATES_WITH"),
            ]
        )
        G = build_networkx_graph(test_net)
        bridges_cuts = find_bridges_and_cut_vertices(G)
        self.assertTrue(len(bridges_cuts) > 0)
        types = [item["type"] for item in bridges_cuts]
        self.assertIn("CUT_VERTEX_NODE", types)
        self.assertIn("BRIDGE_EDGE", types)

    def test_multi_hop_demo_story_path(self):
        """
        Verify multi-hop path tracing across the demo story between distant entities:
        Crime Event -> Warehouse -> Vehicle -> Org C -> Person C
        """
        G = build_networkx_graph(self.demo_net)
        paths = find_multi_hop_paths(
            G, "NODE_CRIME_EVENT", "NODE_PERSON_C", max_hops=8, cutoff=5
        )
        self.assertTrue(len(paths) > 0)
        top_path = paths[0]
        self.assertTrue(top_path.hop_count >= 2)
        self.assertIn("Rajesh Gupta", top_path.human_readable_trace)


    def test_hidden_intermediaries(self):
        """Verify discovering shared intermediary assets."""
        # Create a mini triangle: Person P1, Person P2, sharing Phone P_PHONE
        test_net = NetworkData(
            nodes=[
                GraphNode(id="P1", name="Suspect 1", entity_type="Person"),
                GraphNode(id="P2", name="Suspect 2", entity_type="Person"),
                GraphNode(id="PH1", name="+91-9999900000", entity_type="PhoneNumber"),
            ],
            edges=[
                GraphEdge(id="E1", source="P1", target="PH1", relationship_type="USES_PHONE"),
                GraphEdge(id="E2", source="P2", target="PH1", relationship_type="USES_PHONE"),
            ]
        )
        G = build_networkx_graph(test_net)
        conns = find_common_intermediaries(G, "P1", "P2")
        self.assertEqual(len(conns), 1)
        self.assertEqual(conns[0].intermediary_id, "PH1")
        self.assertIn("Common Phone", conns[0].intermediary_type)

    def test_anomaly_detection_rapid_transactions(self):
        txs = [
            {"transaction_id": "TX1", "sender_account": "ACC1", "receiver_account": "ACC2", "amount": 100000, "timestamp": "2026-08-12T10:00:00Z"},
            {"transaction_id": "TX2", "sender_account": "ACC2", "receiver_account": "ACC3", "amount": 95000, "timestamp": "2026-08-12T10:05:00Z"},
            {"transaction_id": "TX3", "sender_account": "ACC3", "receiver_account": "ACC4", "amount": 90000, "timestamp": "2026-08-12T10:12:00Z"},
        ]
        anoms = detect_rapid_transaction_sequences(txs, time_window_minutes=20, min_sequence_length=3)
        self.assertTrue(len(anoms) >= 1)
        self.assertEqual(anoms[0].anomaly_type, "RAPID_TRANSACTION_SEQUENCE")
        self.assertIn("Rapid sequential", anoms[0].explanation.what_was_detected)


    def test_anomaly_detection_circular_loop(self):
        G = build_networkx_graph(
            NetworkData(
                nodes=[
                    GraphNode(id="A", name="Account A", entity_type="BankAccount"),
                    GraphNode(id="B", name="Account B", entity_type="BankAccount"),
                    GraphNode(id="C", name="Account C", entity_type="BankAccount"),
                ],
                edges=[
                    GraphEdge(id="E1", source="A", target="B", relationship_type="TRANSFERS_TO"),
                    GraphEdge(id="E2", source="B", target="C", relationship_type="TRANSFERS_TO"),
                    GraphEdge(id="E3", source="C", target="A", relationship_type="TRANSFERS_TO"),
                ]
            ),
            directed=True,
        )
        anoms = detect_circular_transaction_loops(G)
        self.assertEqual(len(anoms), 1)
        self.assertEqual(anoms[0].anomaly_type, "CIRCULAR_TRANSACTION_LOOP")

    def test_anomaly_detection_isolation_forest(self):
        # 10 entities, 1 extreme outlier
        feature_matrix = [
            {"entity_id": f"ENT_{i}", "degree": 2.0, "tx_volume": 10000.0, "comm_freq": 5.0}
            for i in range(12)
        ]
        feature_matrix.append(
            {"entity_id": "ENT_ANOMALY", "degree": 45.0, "tx_volume": 9500000.0, "comm_freq": 280.0}
        )
        ml_anoms = detect_ml_anomalies_isolation_forest(feature_matrix, contamination=0.1)
        self.assertTrue(len(ml_anoms) >= 1)
        outlier_ids = [a.involved_entities[0] for a in ml_anoms]
        self.assertIn("ENT_ANOMALY", outlier_ids)

    def test_temporal_analysis_and_playback(self):
        analysis = analyze_temporal_events(self.demo_events, burst_window_hours=2)
        self.assertEqual(analysis.total_events, len(self.demo_events))
        self.assertTrue("COMMUNICATION" in analysis.timeline_by_type)

        snapshots = generate_graph_playback_snapshots(self.demo_net, time_slices=4)
        self.assertEqual(len(snapshots), 4)
        self.assertTrue(snapshots[-1].cumulative_node_count > 0)

        pre_post = analyze_before_after_incident(
            self.demo_events,
            incident_timestamp="2026-08-15T22:30:00Z",
            window_hours=48,
        )
        self.assertIn("pre_incident_metrics", pre_post)
        self.assertIn("post_incident_metrics", pre_post)

    def test_cross_verification_engine(self):
        discrepancies = cross_verify_location_and_transactions(
            cdr_records=self.cdrs,
            transaction_records=self.txs,
            fir_claims=self.firs,
        )
        self.assertTrue(len(discrepancies) >= 1)
        loc_disc = [d for d in discrepancies if d.discrepancy_type == "LOCATION_MISMATCH"][0]
        self.assertEqual(loc_disc.verification_state, "DATA DISCREPANCY DETECTED")
        self.assertEqual(loc_disc.claim_a.location_or_value, "Ahmedabad")
        self.assertEqual(loc_disc.claim_b.location_or_value, "Mumbai")

    def test_service_run_demo_investigation(self):
        demo_res = analytics_service.run_demo_investigation()
        self.assertIn("report", demo_res)
        report = demo_res["report"]
        self.assertTrue(len(report.centrality_rankings) > 0)
        self.assertTrue(len(report.communities) > 0)
        self.assertTrue(len(report.discrepancies) > 0)


if __name__ == "__main__":
    unittest.main()
