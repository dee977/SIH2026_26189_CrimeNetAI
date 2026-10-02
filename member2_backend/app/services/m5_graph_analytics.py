import os
from typing import Dict, Any, List
import asyncio
from neo4j import GraphDatabase
import networkx as nx

class M5GraphAnalyticsClient:
    def __init__(self, base_url: str = "http://localhost:8000", fallback_mode: bool = False):
        self.base_url = base_url
        self.fallback_mode = fallback_mode
        
        uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        user = os.getenv('NEO4J_USERNAME', os.getenv('NEO4J_USER', 'neo4j'))
        pwd = os.getenv('NEO4J_PASSWORD', 'CrimeNetNeo4j123!')
        
        self.driver = None
        try:
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
                    return {'totalNodes': 0, 'totalEdges': 0, 'density': 0.0, 'connectedComponents': 0, 'topDegreeNodes': []}

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
                return res
            except Exception as e:
                import traceback
                traceback.print_exc()
                
        return {
            'totalNodes': 0,
            'totalEdges': 0,
            'density': 0.0,
            'connectedComponents': 0,
            'topDegreeNodes': []
        }

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
                    return {'algorithm': 'louvain', 'clusters': []}
                    
                communities = nx.community.louvain_communities(G)
                
                clusters = []
                for i, comm in enumerate(communities):
                    clusters.append({
                        'clusterId': f"Cluster-{i+1}",
                        'nodeIds': list(comm),
                        'memberCount': len(comm),
                        'density': nx.density(G.subgraph(comm)) if len(comm)>1 else 0
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
            except Exception as e:
                import traceback
                traceback.print_exc()

        return {'algorithm': 'louvain', 'clusters': []}

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
                    nodes = [{"id": coalesce(node.get("id"), node.element_id), "type": list(node.labels)[0] if node.labels else "Unknown"} for node in path.nodes]
                    edges = [{"source": coalesce(rel.start_node.get("id"), rel.start_node.element_id), "target": coalesce(rel.end_node.get("id"), rel.end_node.element_id), "type": rel.type} for rel in path.relationships]
                    found = len(path.relationships) > 0
                    return {"nodes": nodes, "edges": edges, "distance": len(path.relationships), "found": found}
                return {"nodes": [], "edges": [], "distance": 0, "found": False}

            try:
                loop = asyncio.get_event_loop()
                def coalesce(*args):
                    for arg in args:
                        if arg is not None:
                            return arg
                    return None
                def _run_path():
                    with self.driver.session() as session:
                        return session.execute_read(_neo4j_path, source_id, target_id, case_id)
                res = await loop.run_in_executor(None, _run_path)
                if res and res.get("found"):
                    return res
            except Exception as e:
                import traceback
                traceback.print_exc()

        return {"nodes": [], "edges": [], "distance": 0, "found": False}

    async def multi_hop_search(self, start_node_id: str, target_node_type: str, case_id: str, max_hops: int = 3) -> Dict[str, Any]:
        return {'startNodeId': start_node_id, 'targetNodeType': target_node_type, 'matchCount': 0, 'matches': []}

_m5_client_instance = None
def get_m5_client() -> M5GraphAnalyticsClient:
    global _m5_client_instance
    if _m5_client_instance is None:
        _m5_client_instance = M5GraphAnalyticsClient()
    return _m5_client_instance
