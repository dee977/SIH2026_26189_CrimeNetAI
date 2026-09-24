"""
CrimeNet AI — Member 5: Graph Engine
Network construction, centrality, community detection, and topological analysis.
Uses NetworkX with support for Neo4j GDS integration patterns.
"""

from typing import Dict, List, Optional, Tuple, Any
import networkx as nx
from networkx.algorithms.community import louvain_communities

from member5_graph_ml.models.schemas import (
    NetworkData,
    CentralityScore,
    NetworkMetrics,
    Community,
    CommunityMember,
)


def build_networkx_graph(network_data: NetworkData, directed: bool = True) -> nx.DiGraph | nx.Graph:
    """
    Constructs a NetworkX graph from standard NetworkData schema.
    Attaches node and edge attributes including types, timestamps, and evidence links.
    """
    G = nx.DiGraph() if directed else nx.Graph()

    for node in network_data.nodes:
        G.add_node(
            node.id,
            name=node.name,
            entity_type=node.entity_type,
            properties=node.properties,
            evidence_ids=node.evidence_ids,
            first_seen=node.first_seen,
            last_seen=node.last_seen,
        )

    for edge in network_data.edges:
        G.add_edge(
            edge.source,
            edge.target,
            id=edge.id,
            relationship_type=edge.relationship_type,
            weight=edge.weight,
            timestamp=edge.timestamp,
            properties=edge.properties,
            evidence_ids=edge.evidence_ids,
        )

    return G


def compute_network_metrics(G: nx.DiGraph | nx.Graph) -> NetworkMetrics:
    """Computes global topological properties of the graph."""
    undirected_G = G.to_undirected() if G.is_directed() else G
    total_nodes = G.number_of_nodes()
    total_edges = G.number_of_edges()

    if total_nodes == 0:
        return NetworkMetrics(
            total_nodes=0,
            total_edges=0,
            density=0.0,
            is_connected=False,
            number_of_connected_components=0,
            average_clustering_coefficient=0.0,
            key_findings=["Graph is empty."],
        )

    density = nx.density(G)
    is_connected = nx.is_connected(undirected_G)
    num_components = nx.number_connected_components(undirected_G)
    avg_clustering = nx.average_clustering(undirected_G)

    diameter = None
    if is_connected and total_nodes > 1:
        try:
            diameter = nx.diameter(undirected_G)
        except Exception:
            diameter = None

    key_findings = []
    if density > 0.3:
        key_findings.append(f"Dense network fabric (density {density:.2f}), suggesting high internal coordination.")
    else:
        key_findings.append(f"Sparse network structure (density {density:.2f}), typical of clandestine or compartmentalized operations.")

    if num_components > 1:
        key_findings.append(f"Network is partitioned into {num_components} separate connected components.")
    else:
        key_findings.append("Network is fully connected across all observed entities.")

    return NetworkMetrics(
        total_nodes=total_nodes,
        total_edges=total_edges,
        density=round(density, 4),
        is_connected=is_connected,
        number_of_connected_components=num_components,
        average_clustering_coefficient=round(avg_clustering, 4),
        diameter=diameter,
        key_findings=key_findings,
    )


def compute_centralities(G: nx.DiGraph | nx.Graph) -> List[CentralityScore]:
    """
    Computes Degree, Betweenness, PageRank, Closeness, and Eigenvector centralities.
    Interprets findings strictly according to analytical investigative terminology.
    NEVER labels an entity as 'Criminal'.
    """
    if G.number_of_nodes() == 0:
        return []

    undirected_G = G.to_undirected() if G.is_directed() else G

    degree_dict = dict(G.degree()) if not G.is_directed() else dict(G.degree())
    in_degree_dict = dict(G.in_degree()) if G.is_directed() else degree_dict
    out_degree_dict = dict(G.out_degree()) if G.is_directed() else degree_dict

    # Normalized degree
    n = G.number_of_nodes()
    norm_factor = 1.0 / (n - 1) if n > 1 else 1.0
    deg_centrality = {k: v * norm_factor for k, v in degree_dict.items()}

    # Betweenness centrality
    betweenness = nx.betweenness_centrality(undirected_G, normalized=True)

    # PageRank
    try:
        pagerank = nx.pagerank(G, weight="weight")
    except Exception:
        pagerank = {node: 1.0 / n for node in G.nodes()}

    # Closeness
    try:
        closeness = nx.closeness_centrality(undirected_G)
    except Exception:
        closeness = {node: 0.0 for node in G.nodes()}

    # Eigenvector
    try:
        eigenvector = nx.eigenvector_centrality(undirected_G, max_iter=1000)
    except Exception:
        eigenvector = {node: 0.0 for node in G.nodes()}

    results: List[CentralityScore] = []

    # Calculate average betweenness and degree to assign analytical roles
    avg_betweenness = sum(betweenness.values()) / max(len(betweenness), 1)
    avg_degree = sum(deg_centrality.values()) / max(len(deg_centrality), 1)

    for node_id in G.nodes():
        node_data = G.nodes[node_id]
        name = node_data.get("name", node_id)
        etype = node_data.get("entity_type", "Entity")
        evidence = node_data.get("evidence_ids", [])

        bw = betweenness.get(node_id, 0.0)
        deg = deg_centrality.get(node_id, 0.0)
        pr = pagerank.get(node_id, 0.0)
        close = closeness.get(node_id, 0.0)
        eigen = eigenvector.get(node_id, 0.0)

        # Analytical Role and Investigative Lead
        if bw > avg_betweenness * 2.0 and deg > avg_degree:
            role = "Bridge/Intermediary Candidate"
            lead = f"{name} ({etype}) controls communication/flow between multiple disconnected network clusters (High Betweenness: {bw:.3f}). Recommended priority for wiretap, financial subpoena, or association analysis."
        elif deg > avg_degree * 2.0:
            role = "High-connectivity Entity"
            lead = f"{name} ({etype}) maintains direct ties to {degree_dict[node_id]} adjacent nodes. Functions as an operational hub or shared resource."
        elif bw > avg_betweenness * 2.0:
            role = "Chokepoint / Hidden Conduit"
            lead = f"{name} ({etype}) exhibits low direct degree ({degree_dict[node_id]}) but exceptionally high mediation capacity ({bw:.3f}), characteristic of operational couriers or stealth intermediaries."
        else:
            role = "Peripheral / Operational Node"
            lead = f"{name} ({etype}) maintains localized connections ({degree_dict[node_id]} ties) within immediate cluster."

        results.append(
            CentralityScore(
                entity_id=node_id,
                entity_name=name,
                entity_type=etype,
                degree_centrality=round(deg, 4),
                in_degree=in_degree_dict.get(node_id, 0),
                out_degree=out_degree_dict.get(node_id, 0),
                betweenness_centrality=round(bw, 4),
                pagerank=round(pr, 4),
                closeness_centrality=round(close, 4),
                eigenvector_centrality=round(eigen, 4),
                network_role=role,
                investigator_lead=lead,
                supporting_evidence_ids=evidence,
            )
        )

    # Sort primarily by betweenness + degree importance
    results.sort(key=lambda x: (x.betweenness_centrality, x.degree_centrality), reverse=True)
    return results


def detect_louvain_communities(G: nx.DiGraph | nx.Graph) -> List[Community]:
    """
    Performs Louvain community detection to isolate modular sub-networks.
    Calculates inter-community boundary crossings and timeline spans.
    """
    if G.number_of_nodes() == 0:
        return []

    undirected_G = G.to_undirected() if G.is_directed() else G

    try:
        raw_communities = louvain_communities(undirected_G, seed=42)
    except Exception:
        # Fallback to connected components if graph is small or degenerate
        raw_communities = [c for c in nx.connected_components(undirected_G)]

    # Assign node to community ID mapping
    node_to_comm: Dict[str, str] = {}
    for idx, comm_set in enumerate(raw_communities):
        comm_id = f"COMM_{idx + 1:02d}"
        for n in comm_set:
            node_to_comm[n] = comm_id

    # Compute inter-community connections
    inter_comm_edges: Dict[str, Dict[str, int]] = {f"COMM_{idx + 1:02d}": {} for idx in range(len(raw_communities))}
    for u, v in undirected_G.edges():
        comm_u = node_to_comm.get(u)
        comm_v = node_to_comm.get(v)
        if comm_u and comm_v and comm_u != comm_v:
            inter_comm_edges[comm_u][comm_v] = inter_comm_edges[comm_u].get(comm_v, 0) + 1
            inter_comm_edges[comm_v][comm_u] = inter_comm_edges[comm_v].get(comm_u, 0) + 1

    communities: List[Community] = []
    for idx, comm_set in enumerate(raw_communities):
        comm_id = f"COMM_{idx + 1:02d}"
        members: List[CommunityMember] = []
        entity_type_counts: Dict[str, int] = {}
        first_seen_list = []
        last_seen_list = []
        supporting_rels = []

        for node_id in comm_set:
            data = G.nodes[node_id]
            etype = data.get("entity_type", "Entity")
            name = data.get("name", node_id)
            entity_type_counts[etype] = entity_type_counts.get(etype, 0) + 1

            if data.get("first_seen"):
                first_seen_list.append(data["first_seen"])
            if data.get("last_seen"):
                last_seen_list.append(data["last_seen"])

            members.append(
                CommunityMember(
                    entity_id=node_id,
                    entity_name=name,
                    entity_type=etype,
                )
            )

        # Collect internal relationships
        subgraph = undirected_G.subgraph(comm_set)
        for u, v in subgraph.edges():
            edge_data = G.get_edge_data(u, v) or {}
            rel_type = edge_data.get("relationship_type", "CONNECTED")
            supporting_rels.append(f"{u} -[{rel_type}]-> {v}")

        dom_str = ", ".join([f"{k}: {v}" for k, v in entity_type_counts.items()])
        comm_label = f"Sub-Cell {idx + 1} ({len(comm_set)} entities)"
        summary = (
            f"Community {comm_id} comprises {len(comm_set)} entities ({dom_str}). "
            f"Internal cohesion is reinforced by {len(supporting_rels)} direct interactions. "
            f"Cross-community bridges: {sum(inter_comm_edges[comm_id].values())} external edges."
        )

        communities.append(
            Community(
                community_id=comm_id,
                label=comm_label,
                size=len(comm_set),
                members=members,
                dominant_entity_types=entity_type_counts,
                inter_community_connections=inter_comm_edges[comm_id],
                first_activity=min(first_seen_list) if first_seen_list else None,
                last_activity=max(last_seen_list) if last_seen_list else None,
                investigator_summary=summary,
                supporting_relationships=supporting_rels[:20],
            )
        )

    communities.sort(key=lambda c: c.size, reverse=True)
    return communities


def find_bridges_and_cut_vertices(G: nx.DiGraph | nx.Graph) -> List[Dict[str, Any]]:
    """
    Identifies bridge edges and cut vertices (articulation points) whose removal
    would disconnect the network. High-value analytical finding for network disruption.
    """
    undirected_G = G.to_undirected() if G.is_directed() else G
    results = []

    # Articulation points
    cut_vertices = list(nx.articulation_points(undirected_G))
    for cv in cut_vertices:
        data = G.nodes[cv]
        results.append({
            "type": "CUT_VERTEX_NODE",
            "entity_id": cv,
            "entity_name": data.get("name", cv),
            "entity_type": data.get("entity_type", "Entity"),
            "investigator_finding": (
                f"Critical Articulation Point: Removal or surveillance of {data.get('name', cv)} "
                f"fractures communication or transaction paths between network components."
            ),
            "evidence_ids": data.get("evidence_ids", []),
        })

    # Bridges (edges)
    bridges = list(nx.bridges(undirected_G))
    for u, v in bridges:
        u_data = G.nodes[u]
        v_data = G.nodes[v]
        results.append({
            "type": "BRIDGE_EDGE",
            "source_id": u,
            "source_name": u_data.get("name", u),
            "target_id": v,
            "target_name": v_data.get("name", v),
            "investigator_finding": (
                f"Critical Bridge: Sole linkage connecting sub-networks between {u_data.get('name', u)} "
                f"and {v_data.get('name', v)}. No alternate redundant channels detected."
            ),
        })

    return results
