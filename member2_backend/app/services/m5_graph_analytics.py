import os
from typing import Dict, Any, List
import asyncio
from neo4j import GraphDatabase
import networkx as nx

def _get_pg_graph(case_id: str):
    try:
        from app.database import SessionLocal
        from app.models import EntityModel, RelationshipModel
        db = SessionLocal()
        try:
            entities = db.query(EntityModel).filter(EntityModel.case_id == case_id).all()
            relationships = db.query(RelationshipModel).filter(RelationshipModel.case_id == case_id).all()
            G = nx.Graph()
            for e in entities:
                G.add_node(e.entity_id, type=e.entity_type, name=e.canonical_name, confidence=float(e.confidence or 0.95))
            for r in relationships:
                G.add_edge(r.source_id, r.target_id, type=r.relationship_type, confidence=float(r.confidence or 0.95), rid=r.relationship_id)
            return G, entities, relationships
        finally:
            db.close()
    except Exception as e:
        print(f"[M5 Graph] Error loading graph from PostgreSQL: {e}")
        return nx.Graph(), [], []

class M5GraphAnalyticsClient:
    def __init__(self, base_url: str = "http://localhost:8000", fallback_mode: bool = False):
        self.base_url = base_url
        self.fallback_mode = fallback_mode
        
        uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        user = os.getenv('NEO4J_USERNAME', os.getenv('NEO4J_USER', 'neo4j'))
        pwd = os.getenv('NEO4J_PASSWORD', 'CrimeNetNeo4j123!')
        
        self.driver = None
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.2)
            check_port = sock.connect_ex(('127.0.0.1', 7687))
            sock.close()
            if check_port == 0:
                d = GraphDatabase.driver(uri, auth=(user, pwd), connection_timeout=0.2, max_connection_lifetime=10)
                d.verify_connectivity()
                self.driver = d
        except Exception:
            self.driver = None

    async def get_network_statistics(self, case_id: str) -> Dict[str, Any]:
        if not case_id:
            raise ValueError("case_id is required")
        if self.driver:
            def _neo4j_stats(tx, case_id):
                n_count = tx.run("MATCH (n) WHERE n.caseId = $case_id OR n.case_id = $case_id RETURN count(n) as c", case_id=case_id).single()["c"]
                if n_count == 0:
                    return None

                e_count = tx.run("MATCH (n)-[r]->(m) WHERE (n.caseId = $case_id OR n.case_id = $case_id) AND (m.caseId = $case_id OR m.case_id = $case_id) RETURN count(r) as c", case_id=case_id).single()["c"]
                
                density = 0.0
                if n_count > 1:
                    density = (2.0 * e_count) / (n_count * (n_count - 1))
                
                degree_query = """
                MATCH (n)-[r]-(m)
                WHERE (n.caseId = $case_id OR n.case_id = $case_id) AND (m.caseId = $case_id OR m.case_id = $case_id)
                RETURN coalesce(n.id, elementId(n)) as id, count(r) as degree
                ORDER BY degree DESC
                LIMIT 5
                """
                top_nodes = []
                for record in tx.run(degree_query, case_id=case_id):
                    top_nodes.append({'id': record["id"], 'degree': record["degree"]})
                
                return {
                    'totalNodes': n_count,
                    'totalEdges': e_count,
                    'density': round(density, 4),
                    'connectedComponents': 1,
                    'topDegreeNodes': top_nodes
                }
            
            try:
                loop = asyncio.get_event_loop()
                def _run_stats():
                    with self.driver.session() as session:
                        return session.execute_read(_neo4j_stats, case_id)
                res = await loop.run_in_executor(None, _run_stats)
                if res and res.get('totalNodes', 0) > 0:
                    return res
            except Exception:
                pass

        # PostgreSQL + NetworkX Fallback
        loop = asyncio.get_event_loop()
        def _compute_pg_stats():
            G, entities, rels = _get_pg_graph(case_id)
            n_count = len(G.nodes)
            e_count = len(G.edges)
            if n_count > 0:
                density = nx.density(G)
                components = nx.number_connected_components(G)
                degrees = sorted(G.degree, key=lambda x: x[1], reverse=True)[:5]
                top_nodes = [{'id': node_id, 'degree': deg} for node_id, deg in degrees]
                return {
                    'totalNodes': n_count,
                    'totalEdges': e_count,
                    'density': round(density, 4),
                    'connectedComponents': components,
                    'topDegreeNodes': top_nodes
                }
            return {
                'totalNodes': 0,
                'totalEdges': 0,
                'density': 0.0,
                'connectedComponents': 0,
                'topDegreeNodes': []
            }

        return await loop.run_in_executor(None, _compute_pg_stats)

    async def get_communities(self, case_id: str) -> Dict[str, Any]:
        if not case_id:
            raise ValueError("case_id is required")
        if self.driver:
            def _neo4j_communities(tx, case_id):
                nodes_res = tx.run("MATCH (n) WHERE n.caseId=$case_id OR n.case_id=$case_id RETURN coalesce(n.id, elementId(n)) as id, labels(n)[0] as type", case_id=case_id)
                nodes = [record["id"] for record in nodes_res]
                
                edges_res = tx.run("MATCH (n)-[r]->(m) WHERE (n.caseId=$case_id OR n.case_id=$case_id) AND (m.caseId=$case_id OR m.case_id=$case_id) RETURN coalesce(n.id, elementId(n)) as src, coalesce(m.id, elementId(m)) as dst", case_id=case_id)
                edges = [(record["src"], record["dst"]) for record in edges_res]
                
                G = nx.Graph()
                G.add_nodes_from(nodes)
                G.add_edges_from(edges)
                
                if len(G.nodes) == 0:
                    return None
                    
                communities = nx.community.louvain_communities(G)
                clusters = []
                for i, comm in enumerate(communities):
                    clusters.append({
                        'clusterId': f"Cluster-{i+1}",
                        'nodeIds': list(comm),
                        'memberCount': len(comm),
                        'density': round(nx.density(G.subgraph(comm)), 4) if len(comm)>1 else 0.0
                    })
                return {'algorithm': 'louvain', 'clusters': clusters}

            try:
                loop = asyncio.get_event_loop()
                def _run_communities():
                    with self.driver.session() as session:
                        return session.execute_read(_neo4j_communities, case_id)
                res = await loop.run_in_executor(None, _run_communities)
                if res and res.get('clusters'):
                    return res
            except Exception:
                pass

        # PostgreSQL + NetworkX Fallback
        loop = asyncio.get_event_loop()
        def _compute_pg_communities():
            G, entities, rels = _get_pg_graph(case_id)
            if len(G.nodes) == 0:
                return {'algorithm': 'louvain', 'clusters': []}
            try:
                communities = nx.community.louvain_communities(G)
            except Exception:
                communities = list(nx.connected_components(G))
            clusters = []
            for comm in communities:
                clusters.append({
                    'nodeIds': list(comm),
                    'memberCount': len(comm),
                    'density': round(nx.density(G.subgraph(comm)), 4) if len(comm)>1 else 0.0
                })
            clusters.sort(key=lambda x: (x['memberCount'], x['density']), reverse=True)
            for i, c in enumerate(clusters):
                c['clusterId'] = f"Cluster-{i+1}"
            return {'algorithm': 'louvain', 'clusters': clusters}

        return await loop.run_in_executor(None, _compute_pg_communities)

    async def find_shortest_path(self, source_id: str, target_id: str, case_id: str, max_depth: int = 10) -> Dict[str, Any]:
        if not case_id:
            raise ValueError("case_id is required")
        if self.driver:
            def _neo4j_path(tx, src, tgt, case_id):
                query = """
                MATCH p=shortestPath((n)-[*..10]-(m))
                WHERE coalesce(n.id, elementId(n)) = $src AND coalesce(m.id, elementId(m)) = $tgt
                AND (n.caseId=$case_id OR n.case_id=$case_id) AND (m.caseId=$case_id OR m.case_id=$case_id)
                RETURN p
                """
                record = tx.run(query, src=src, tgt=tgt, case_id=case_id).single()
                if record and record["p"]:
                    path = record["p"]
                    nodes = [{"id": node.get("id") or node.element_id, "type": list(node.labels)[0] if node.labels else "Unknown"} for node in path.nodes]
                    edges = [{"source": rel.start_node.get("id") or rel.start_node.element_id, "target": rel.end_node.get("id") or rel.end_node.element_id, "type": rel.type} for rel in path.relationships]
                    found = len(path.relationships) > 0
                    return {"nodes": nodes, "edges": edges, "distance": len(path.relationships), "found": found}
                return None

            try:
                loop = asyncio.get_event_loop()
                def _run_path():
                    with self.driver.session() as session:
                        return session.execute_read(_neo4j_path, source_id, target_id, case_id)
                res = await loop.run_in_executor(None, _run_path)
                if res and res.get("found"):
                    return res
            except Exception:
                pass

        # PostgreSQL + NetworkX Fallback
        loop = asyncio.get_event_loop()
        def _compute_pg_path():
            G, entities, rels = _get_pg_graph(case_id)
            if not G or len(G.nodes) == 0:
                return {"nodes": [], "edges": [], "distance": 0, "found": False}

            # Resolve source and target by ID, exact name, or partial name
            actual_src = source_id if source_id in G else None
            actual_tgt = target_id if target_id in G else None

            if not actual_src:
                s_lower = source_id.strip().lower()
                for n, d in G.nodes(data=True):
                    if (d.get("name") or "").lower() == s_lower or n.lower() == s_lower:
                        actual_src = n
                        break
                if not actual_src:
                    for n, d in G.nodes(data=True):
                        if s_lower in (d.get("name") or "").lower() or s_lower in n.lower():
                            actual_src = n
                            break

            if not actual_tgt:
                t_lower = target_id.strip().lower()
                for n, d in G.nodes(data=True):
                    if (d.get("name") or "").lower() == t_lower or n.lower() == t_lower:
                        actual_tgt = n
                        break
                if not actual_tgt:
                    for n, d in G.nodes(data=True):
                        if t_lower in (d.get("name") or "").lower() or t_lower in n.lower():
                            actual_tgt = n
                            break

            if actual_src and actual_tgt:
                try:
                    path = nx.shortest_path(G, source=actual_src, target=actual_tgt)
                    nodes = []
                    for nid in path:
                        node_data = G.nodes.get(nid, {})
                        nodes.append({"id": nid, "type": node_data.get("type", "Entity"), "name": node_data.get("name", nid)})
                    edges = []
                    for i in range(len(path) - 1):
                        u, v = path[i], path[i+1]
                        edge_data = G.get_edge_data(u, v) or {}
                        edges.append({
                            "source": u,
                            "target": v,
                            "type": edge_data.get("type", "CONNECTED_TO")
                        })
                    return {"nodes": nodes, "edges": edges, "distance": len(edges), "found": True}
                except (nx.NetworkXNoPath, nx.NodeNotFound):
                    pass
            return {"nodes": [], "edges": [], "distance": 0, "found": False}

        return await loop.run_in_executor(None, _compute_pg_path)

    async def multi_hop_search(self, start_node_id: str, target_node_type: str, case_id: str, max_hops: int = 3) -> Dict[str, Any]:
        loop = asyncio.get_event_loop()
        def _compute_pg_multihop():
            G, entities, rels = _get_pg_graph(case_id)
            if start_node_id in G:
                matches = []
                lengths = nx.single_source_shortest_path_length(G, start_node_id, cutoff=max_hops)
                for target, dist in lengths.items():
                    if dist > 0 and (not target_node_type or G.nodes.get(target, {}).get("type", "").lower() == target_node_type.lower()):
                        path = nx.shortest_path(G, source=start_node_id, target=target)
                        matches.append({
                            "targetId": target,
                            "targetName": G.nodes.get(target, {}).get("name", target),
                            "targetType": G.nodes.get(target, {}).get("type", "Entity"),
                            "hopDistance": dist,
                            "path": path
                        })
                return {'startNodeId': start_node_id, 'targetNodeType': target_node_type, 'matchCount': len(matches), 'matches': matches}
            return {'startNodeId': start_node_id, 'targetNodeType': target_node_type, 'matchCount': 0, 'matches': []}

        return await loop.run_in_executor(None, _compute_pg_multihop)

_m5_client_instance = None
def get_m5_client() -> M5GraphAnalyticsClient:
    global _m5_client_instance
    if _m5_client_instance is None:
        _m5_client_instance = M5GraphAnalyticsClient()
    return _m5_client_instance
