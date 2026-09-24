"""
CrimeNet AI — Member 5: Hidden Relationship Discovery
Finds multi-hop indirect paths, common intermediaries (phones, accounts, locations, vehicles, orgs),
and cross-case relationships.
"""

from typing import List, Dict, Any, Optional
import networkx as nx

from member5_graph_ml.models.schemas import (
    PathStep,
    MultiHopPath,
    IndirectConnection,
    EvidenceReference,
)


def find_multi_hop_paths(
    G: nx.DiGraph | nx.Graph,
    source_id: str,
    target_id: str,
    max_hops: int = 5,
    cutoff: int = 10,
) -> List[MultiHopPath]:
    """
    Finds paths between source_id and target_id up to max_hops.
    Constructs an explainable trace with entity types, relationship types, and evidence tags.
    """
    if not G.has_node(source_id) or not G.has_node(target_id):
        return []

    undirected_G = G.to_undirected() if G.is_directed() else G

    try:
        raw_paths = []
        for path in nx.all_simple_paths(undirected_G, source=source_id, target=target_id, cutoff=max_hops):
            raw_paths.append(path)
            if len(raw_paths) >= cutoff:
                break
    except Exception:
        raw_paths = []

    results: List[MultiHopPath] = []

    for path_nodes in raw_paths:
        steps: List[PathStep] = []
        all_evidence: List[EvidenceReference] = []
        trace_parts = []

        for i in range(len(path_nodes) - 1):
            u = path_nodes[i]
            v = path_nodes[i + 1]

            u_data = G.nodes[u]
            v_data = G.nodes[v]

            # Try to get edge attributes
            edge_data = G.get_edge_data(u, v) or G.get_edge_data(v, u) or {}
            rel_type = edge_data.get("relationship_type", "LINKED_TO")
            timestamp = edge_data.get("timestamp")
            ev_ids = edge_data.get("evidence_ids", []) + u_data.get("evidence_ids", [])

            for ev_id in ev_ids:
                all_evidence.append(
                    EvidenceReference(
                        evidence_id=ev_id,
                        source_type="GRAPH_EXTRACT",
                        timestamp=timestamp,
                    )
                )

            step = PathStep(
                step_number=i + 1,
                from_entity_id=u,
                from_entity_name=u_data.get("name", u),
                from_entity_type=u_data.get("entity_type", "Entity"),
                relationship=rel_type,
                to_entity_id=v,
                to_entity_name=v_data.get("name", v),
                to_entity_type=v_data.get("entity_type", "Entity"),
                timestamp=timestamp,
                evidence_ids=list(set(ev_ids)),
            )
            steps.append(step)

            if i == 0:
                trace_parts.append(f"{u_data.get('name', u)} ({u_data.get('entity_type', 'Entity')})")
            trace_parts.append(f"--[{rel_type}]--> {v_data.get('name', v)} ({v_data.get('entity_type', 'Entity')})")

        human_trace = " ".join(trace_parts)

        # De-duplicate evidence references
        unique_ev = {e.evidence_id: e for e in all_evidence}.values()

        results.append(
            MultiHopPath(
                path_length=len(path_nodes),
                hop_count=len(steps),
                source_entity=G.nodes[source_id].get("name", source_id),
                target_entity=G.nodes[target_id].get("name", target_id),
                steps=steps,
                human_readable_trace=human_trace,
                supporting_evidence=list(unique_ev),
            )
        )

    results.sort(key=lambda x: x.hop_count)
    return results


def find_common_intermediaries(
    G: nx.DiGraph | nx.Graph,
    entity_a_id: str,
    entity_b_id: str,
) -> List[IndirectConnection]:
    """
    Identifies hidden connections between Entity A and Entity B via common intermediaries:
    - Common Phone Numbers
    - Common Bank Accounts
    - Common Vehicles
    - Common Locations
    - Common Organizations
    """
    if not G.has_node(entity_a_id) or not G.has_node(entity_b_id):
        return []

    undirected_G = G.to_undirected() if G.is_directed() else G

    neighbors_a = set(undirected_G.neighbors(entity_a_id))
    neighbors_b = set(undirected_G.neighbors(entity_b_id))

    common_nodes = neighbors_a.intersection(neighbors_b)

    results: List[IndirectConnection] = []
    a_data = G.nodes[entity_a_id]
    b_data = G.nodes[entity_b_id]

    for inter_id in common_nodes:
        inter_data = G.nodes[inter_id]
        etype = inter_data.get("entity_type", "Entity")
        name = inter_data.get("name", inter_id)

        # Determine relationships
        edge_a = G.get_edge_data(entity_a_id, inter_id) or G.get_edge_data(inter_id, entity_a_id) or {}
        edge_b = G.get_edge_data(entity_b_id, inter_id) or G.get_edge_data(inter_id, entity_b_id) or {}

        rel_a = edge_a.get("relationship_type", "ASSOCIATED_WITH")
        rel_b = edge_b.get("relationship_type", "ASSOCIATED_WITH")

        evidence_ids = list(set(
            inter_data.get("evidence_ids", []) +
            edge_a.get("evidence_ids", []) +
            edge_b.get("evidence_ids", [])
        ))

        # Categorize intermediary
        category_map = {
            "PhoneNumber": "Common Phone Connection",
            "BankAccount": "Common Bank Account Connection",
            "Vehicle": "Common Vehicle Connection",
            "Location": "Common Location / Safehouse Co-presence",
            "Organization": "Common Corporate / Shell Entity",
        }
        inter_cat = category_map.get(etype, f"Common {etype} Intermediary")

        finding = (
            f"Hidden connection between {a_data.get('name', entity_a_id)} and {b_data.get('name', entity_b_id)} "
            f"discovered via {inter_cat}: '{name}' ({etype})."
        )
        lead = (
            f"Cross-reference activities of {a_data.get('name')} and {b_data.get('name')} "
            f"linked through {name}. Subpoena records for {name} ({etype}) to map coordination."
        )

        results.append(
            IndirectConnection(
                entity_a_id=entity_a_id,
                entity_a_name=a_data.get("name", entity_a_id),
                entity_b_id=entity_b_id,
                entity_b_name=b_data.get("name", entity_b_id),
                intermediary_id=inter_id,
                intermediary_name=name,
                intermediary_type=inter_cat,
                relationship_a_to_intermediary=rel_a,
                relationship_b_to_intermediary=rel_b,
                analytical_finding=finding,
                investigator_lead=lead,
                supporting_evidence_ids=evidence_ids,
            )
        )

    return results


def discover_all_hidden_triangles_and_intermediaries(
    G: nx.DiGraph | nx.Graph,
    target_entity_types: Optional[List[str]] = None,
) -> List[IndirectConnection]:
    """
    Scans entire graph for indirect connections where two entities (e.g. Person nodes)
    share a common non-person intermediary (Phone, BankAccount, Location, Vehicle, Organization).
    """
    if target_entity_types is None:
        target_entity_types = ["Person", "Organization"]

    undirected_G = G.to_undirected() if G.is_directed() else G
    discovered: List[IndirectConnection] = []
    seen_pairs = set()

    for node_id, data in G.nodes(data=True):
        etype = data.get("entity_type")
        if etype not in ["PhoneNumber", "BankAccount", "Vehicle", "Location", "Organization"]:
            continue

        neighbors = list(undirected_G.neighbors(node_id))
        if len(neighbors) < 2:
            continue

        # Check pairs of neighbors
        for i in range(len(neighbors)):
            for j in range(i + 1, len(neighbors)):
                u = neighbors[i]
                v = neighbors[j]

                u_type = G.nodes[u].get("entity_type")
                v_type = G.nodes[v].get("entity_type")

                # Both should be target types
                if u_type in target_entity_types and v_type in target_entity_types:
                    pair_key = tuple(sorted([u, v])) + (node_id,)
                    if pair_key in seen_pairs:
                        continue
                    seen_pairs.add(pair_key)

                    conns = find_common_intermediaries(G, u, v)
                    for c in conns:
                        if c.intermediary_id == node_id:
                            discovered.append(c)

    return discovered
