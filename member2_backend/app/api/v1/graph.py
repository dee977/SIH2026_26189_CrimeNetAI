from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from app.dependencies import get_current_user, require_permission
from app.dependencies import assert_case_access
from app.database import get_db
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.schemas.graph import (
    GraphDataResponse, NeighborhoodExpansionRequest, RelationshipRetrievalRequest,
    SubgraphRetrievalRequest, ShortestPathRequest, MultiHopSearchRequest, GraphFilterRequest
)
from app.services.m3_graph_data import M3GraphDataClient, get_m3_client
from app.services.m5_graph_analytics import M5GraphAnalyticsClient, get_m5_client

router = APIRouter(prefix='/graph', tags=['Graph Intelligence Orchestration'])

@router.get('', summary='Get Central Network Graph')
@router.get('/case/{case_id}', summary='Get Central Network Graph by Case')
async def get_graph_view(
    case_id: Optional[str] = None,
    limit: int = Query(60, ge=10, le=500),
    m3_client: M3GraphDataClient = Depends(get_m3_client),
    current_user: UserProfile = Depends(require_permission('graph:read')),
    db = Depends(get_db)
):
    target_case = case_id or 'CASE-2025-M3-DATASET'
    assert_case_access(db, current_user, target_case)
    res = await m3_client.get_case_graph(case_id=target_case, limit=limit)
    return ResponseEnvelope(data={
        'nodes': res.nodes if hasattr(res, 'nodes') else [],
        'edges': res.edges if hasattr(res, 'edges') else [],
        'summary': {
            'totalNodes': res.totalNodes if hasattr(res, 'totalNodes') else 0,
            'totalEdges': res.totalEdges if hasattr(res, 'totalEdges') else 0,
            'density': 0,
            'connectedComponentsCount': 1,
            'dominantCommunityId': 1
        }
    })

@router.get('/hidden-path', summary='Find Hidden Shortest Path between Entities')
async def get_hidden_path(
    source: str = Query(...),
    target: str = Query(...),
    case_id: str = Query(..., description="Case ID"),
    m5_client: M5GraphAnalyticsClient = Depends(get_m5_client),
    current_user: UserProfile = Depends(require_permission('graph:read')),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    cid = case_id
    res = await m5_client.find_shortest_path(source_id=source, target_id=target, case_id=cid)
    return ResponseEnvelope(data=res)

@router.get('/analytics', summary='Get Graph Analytics Statistics')
async def get_analytics(
    case_id: str = Query(..., description="Case ID"),
    m5_client: M5GraphAnalyticsClient = Depends(get_m5_client),
    current_user: UserProfile = Depends(require_permission('analytics:read')),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    res = await m5_client.get_network_statistics(case_id=case_id)
    return ResponseEnvelope(data=res)

@router.get('/communities', summary='Get Detected Network Communities')
async def get_communities(
    case_id: str = Query(..., description="Case ID"),
    m5_client: M5GraphAnalyticsClient = Depends(get_m5_client),
    current_user: UserProfile = Depends(require_permission('analytics:read')),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    res = await m5_client.get_communities(case_id=case_id)
    return ResponseEnvelope(data=res)

@router.post('/expand', response_model=ResponseEnvelope[GraphDataResponse], summary='Neighborhood Expansion')
async def expand_neighborhood(req: NeighborhoodExpansionRequest, m3_client: M3GraphDataClient = Depends(get_m3_client), current_user: UserProfile = Depends(require_permission('graph:read'))):
    cid = getattr(req, 'caseId', None) or getattr(req, 'case_id', None) or 'CASE-2024-001'
    res = await m3_client.get_neighborhood(node_id=req.nodeId, case_id=cid, hops=req.hops, relationship_types=req.relationshipTypes)
    return ResponseEnvelope(data=res)

@router.post('/relationships', response_model=ResponseEnvelope[GraphDataResponse], summary='Relationship Retrieval')
async def get_relationships(req: RelationshipRetrievalRequest, m3_client: M3GraphDataClient = Depends(get_m3_client), current_user: UserProfile = Depends(require_permission('graph:read'))):
    cid = getattr(req, 'caseId', None) or getattr(req, 'case_id', None) or 'CASE-2024-001'
    res = await m3_client.get_neighborhood(node_id=req.sourceNodeId, case_id=cid, hops=1, relationship_types=req.relationshipTypes)
    return ResponseEnvelope(data=res)

@router.post('/subgraph', response_model=ResponseEnvelope[GraphDataResponse], summary='Subgraph Retrieval')
async def get_subgraph(req: SubgraphRetrievalRequest, m3_client: M3GraphDataClient = Depends(get_m3_client), current_user: UserProfile = Depends(require_permission('graph:read'))):
    cid = getattr(req, 'caseId', None) or getattr(req, 'case_id', None) or 'CASE-2024-001'
    res = await m3_client.get_subgraph(node_ids=req.nodeIds, case_id=cid)
    return ResponseEnvelope(data=res)

@router.post('/shortest-path', response_model=ResponseEnvelope[dict], summary='Shortest Path Request')
async def shortest_path(req: ShortestPathRequest, m5_client: M5GraphAnalyticsClient = Depends(get_m5_client), current_user: UserProfile = Depends(require_permission('graph:read'))):
    cid = getattr(req, 'caseId', None) or getattr(req, 'case_id', None) or 'CASE-2024-001'
    res = await m5_client.find_shortest_path(source_id=req.sourceNodeId, target_id=req.targetNodeId, case_id=cid, max_depth=req.maxDepth)
    return ResponseEnvelope(data=res)

@router.post('/multi-hop', response_model=ResponseEnvelope[dict], summary='Multi-Hop Search Request')
async def multi_hop_search(req: MultiHopSearchRequest, m5_client: M5GraphAnalyticsClient = Depends(get_m5_client), current_user: UserProfile = Depends(require_permission('graph:read'))):
    cid = getattr(req, 'caseId', None) or getattr(req, 'case_id', None) or 'CASE-2024-001'
    res = await m5_client.multi_hop_search(start_node_id=req.startNodeId, target_node_type=req.targetNodeType, case_id=cid, max_hops=req.maxHops)
    return ResponseEnvelope(data=res)

@router.post('/filter', response_model=ResponseEnvelope[GraphDataResponse], summary='Graph Filtering by Type, Source, Date')
async def filter_graph(req: GraphFilterRequest, m3_client: M3GraphDataClient = Depends(get_m3_client), current_user: UserProfile = Depends(require_permission('graph:read'))):
    cid = getattr(req, 'caseId', None) or getattr(req, 'case_id', None) or 'CASE-2024-001'
    res = await m3_client.get_neighborhood(node_id='FIR-2024-8841', case_id=cid, hops=4, relationship_types=req.relationshipTypes)
    return ResponseEnvelope(data=res)
