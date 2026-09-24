from typing import Any, Dict, List, Optional
import httpx
from app.config import settings
from app.schemas.graph import GraphDataResponse, GraphNode, GraphEdge
from app.services.demo_data import DEMO_ENTITIES, DEMO_EDGES

class M3GraphDataClient:
    def __init__(self, base_url: str = settings.M3_DATA_GRAPH_SERVICE_URL, fallback_mode: bool = settings.DOWNSTREAM_FALLBACK_MODE):
        self.base_url = base_url
        self.fallback_mode = fallback_mode

    async def get_node_by_id(self, node_id: str) -> Optional[Dict[str, Any]]:
        if not self.fallback_mode:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(f'{self.base_url}/nodes/{node_id}')
                    if resp.status_code == 200:
                        return resp.json().get('data')
            except Exception:
                pass
        for entity in DEMO_ENTITIES:
            if entity.get('id') == node_id:
                return entity
        return None

    async def query_entities(self, entity_type: Optional[str] = None, query: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.fallback_mode:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(f'{self.base_url}/entities', params={'entityType': entity_type, 'query': query, 'limit': limit})
                    if resp.status_code == 200:
                        return resp.json().get('data', [])
            except Exception:
                pass
        results = []
        for e in DEMO_ENTITIES:
            if entity_type and e.get('entityType', '').lower() != entity_type.lower():
                continue
            if query:
                q = query.lower()
                matches = (q in e.get('canonicalName', '').lower() or
                           q in e.get('id', '').lower() or
                           q in str(e.get('metadata', {})).lower())
                if not matches:
                    continue
            results.append(e)
            if len(results) >= limit:
                break
        return results

    async def get_neighborhood(self, node_id: str, hops: int = 1, relationship_types: Optional[List[str]] = None) -> GraphDataResponse:
        if not self.fallback_mode:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(f'{self.base_url}/graph/neighborhood', json={'nodeId': node_id, 'hops': hops, 'relationshipTypes': relationship_types})
                    if resp.status_code == 200:
                        return GraphDataResponse(**resp.json().get('data'))
            except Exception:
                pass
        # Fallback local expansion from DEMO_EDGES
        matched_node_ids = {node_id}
        matched_edges = []
        current_layer = {node_id}

        for _ in range(hops):
            next_layer = set()
            for edge in DEMO_EDGES:
                if relationship_types and edge.get('relationshipType') not in relationship_types:
                    continue
                src, tgt = edge.get('source'), edge.get('target')
                if src in current_layer and tgt not in matched_node_ids:
                    matched_edges.append(edge)
                    next_layer.add(tgt)
                    matched_node_ids.add(tgt)
                elif tgt in current_layer and src not in matched_node_ids:
                    matched_edges.append(edge)
                    next_layer.add(src)
                    matched_node_ids.add(src)
            current_layer = next_layer
            if not current_layer:
                break

        nodes_list = []
        for ent in DEMO_ENTITIES:
            if ent.get('id') in matched_node_ids:
                nodes_list.append(GraphNode(
                    id=ent.get('id'),
                    label=ent.get('canonicalName'),
                    type=ent.get('entityType'),
                    properties=ent.get('metadata', {}),
                    source=ent.get('source', 'M3_GRAPH_DATA'),
                    caseId=ent.get('caseId'),
                    evidenceId=ent.get('evidenceId'),
                    confidence=ent.get('confidence', 0.95)
                ))

        edges_list = [GraphEdge(**e) for e in matched_edges]
        return GraphDataResponse(nodes=nodes_list, edges=edges_list, totalNodes=len(nodes_list), totalEdges=len(edges_list))

    async def get_subgraph(self, node_ids: List[str]) -> GraphDataResponse:
        nodes_set = set(node_ids)
        nodes_list = []
        for ent in DEMO_ENTITIES:
            if ent.get('id') in nodes_set:
                nodes_list.append(GraphNode(
                    id=ent.get('id'),
                    label=ent.get('canonicalName'),
                    type=ent.get('entityType'),
                    properties=ent.get('metadata', {}),
                    source=ent.get('source', 'M3_GRAPH_DATA'),
                    caseId=ent.get('caseId'),
                    evidenceId=ent.get('evidenceId'),
                    confidence=ent.get('confidence', 0.95)
                ))
        edges_list = []
        for e in DEMO_EDGES:
            if e.get('source') in nodes_set and e.get('target') in nodes_set:
                edges_list.append(GraphEdge(**e))

        return GraphDataResponse(nodes=nodes_list, edges=edges_list, totalNodes=len(nodes_list), totalEdges=len(edges_list))

_m3_client_instance = None
def get_m3_client() -> M3GraphDataClient:
    global _m3_client_instance
    if _m3_client_instance is None:
        _m3_client_instance = M3GraphDataClient()
    return _m3_client_instance
