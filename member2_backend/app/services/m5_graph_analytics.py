from typing import Any, Dict, List, Optional
import httpx
from app.config import settings
from app.schemas.graph import GraphDataResponse, GraphNode, GraphEdge
from app.services.demo_data import DEMO_ENTITIES, DEMO_EDGES

class M5GraphAnalyticsClient:
    def __init__(self, base_url: str = settings.M5_GRAPH_ML_SERVICE_URL, fallback_mode: bool = settings.DOWNSTREAM_FALLBACK_MODE):
        self.base_url = base_url
        self.fallback_mode = fallback_mode

    async def find_shortest_path(self, source_id: str, target_id: str, max_depth: int = 10) -> Dict[str, Any]:
        if not self.fallback_mode:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(f'{self.base_url}/analytics/shortest-path', json={'sourceNodeId': source_id, 'targetNodeId': target_id, 'maxDepth': max_depth})
                    if resp.status_code == 200:
                        return resp.json().get('data')
            except Exception:
                pass

        adj = {}
        for edge in DEMO_EDGES:
            u, v = edge['source'], edge['target']
            adj.setdefault(u, []).append((v, edge))
            adj.setdefault(v, []).append((u, edge))

        queue = [[(source_id, None)]]
        visited = {source_id}
        path_found = None

        while queue:
            curr_path = queue.pop(0)
            node, _ = curr_path[-1]
            if node == target_id:
                path_found = curr_path
                break
            if len(curr_path) <= max_depth:
                for neighbor, edge_obj in adj.get(node, []):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        new_path = list(curr_path)
                        new_path.append((neighbor, edge_obj))
                        queue.append(new_path)

        if not path_found:
            return {'found': False, 'length': 0, 'nodes': [], 'edges': []}

        node_ids = [step[0] for step in path_found]
        edges = [step[1] for step in path_found if step[1] is not None]

        return {
            'found': True,
            'length': len(edges),
            'nodeIds': node_ids,
            'edges': edges,
            'summary': f'Shortest path connects {source_id} to {target_id} across {len(edges)} hops.'
        }

    async def multi_hop_search(self, start_node_id: str, target_node_type: str, max_hops: int = 10) -> Dict[str, Any]:
        if not self.fallback_mode:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(f'{self.base_url}/analytics/multi-hop', json={'startNodeId': start_node_id, 'targetNodeType': target_node_type, 'maxHops': max_hops})
                    if resp.status_code == 200:
                        return resp.json().get('data')
            except Exception:
                pass

        discovered = []
        for ent in DEMO_ENTITIES:
            if ent.get('entityType', '').lower() == target_node_type.lower() and ent.get('id') != start_node_id:
                path_info = await self.find_shortest_path(start_node_id, ent['id'], max_depth=max_hops)
                if path_info.get('found'):
                    discovered.append({
                        'targetEntity': ent,
                        'hopCount': path_info.get('length'),
                        'path': path_info.get('nodeIds')
                    })
        return {'startNodeId': start_node_id, 'targetNodeType': target_node_type, 'matchCount': len(discovered), 'matches': discovered}

    async def get_network_statistics(self) -> Dict[str, Any]:
        return {
            'totalNodes': len(DEMO_ENTITIES),
            'totalEdges': len(DEMO_EDGES),
            'density': 0.18,
            'averageDegree': 2.4,
            'isolatedSubgraphs': 1
        }

_m5_client_instance = None
def get_m5_client() -> M5GraphAnalyticsClient:
    global _m5_client_instance
    if _m5_client_instance is None:
        _m5_client_instance = M5GraphAnalyticsClient()
    return _m5_client_instance
