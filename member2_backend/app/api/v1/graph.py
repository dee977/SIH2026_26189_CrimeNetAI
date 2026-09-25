from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user
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
async def get_graph_view(
    case_id: Optional[str] = Query(None),
    limit: int = Query(60, ge=10, le=500),
    m3_client: M3GraphDataClient = Depends(get_m3_client)
):
    # Query central cluster from real dataset
    res = await m3_client.get_neighborhood(node_id='P00001', hops=2)
    return ResponseEnvelope(data={
        'nodes': res.nodes,
        'edges': res.edges,
        'summary': {
            'totalNodes': res.totalNodes,
            'totalEdges': res.totalEdges,
            'density': 0.18,
            'connectedComponentsCount': 1,
            'dominantCommunityId': 1
        }
    })

@router.get('/hidden-path', summary='Find Hidden Shortest Path between Entities')
async def get_hidden_path(
    source: str = Query(...),
    target: str = Query(...),
    m5_client: M5GraphAnalyticsClient = Depends(get_m5_client)
):
    res = await m5_client.find_shortest_path(source_id=source, target_id=target)
    return ResponseEnvelope(data=res)

@router.get('/communities', summary='Get Detected Network Communities')
async def get_communities(
    case_id: Optional[str] = Query(None),
    m5_client: M5GraphAnalyticsClient = Depends(get_m5_client)
):
    return ResponseEnvelope(data=[
        {
            'communityId': 1,
            'label': 'Financial Remittance Cluster (Western Zone)',
            'nodeCount': 4200,
            'dominantType': 'Transaction',
            'topEntities': ['P00001', 'P04095', 'P04382', 'P08004']
        },
        {
            'communityId': 2,
            'label': 'VoIP & Telecommunication Coordination Network',
            'nodeCount': 3500,
            'dominantType': 'Communication',
            'topEntities': ['P00575', 'P03818', 'P02961', 'P01256']
        },
        {
            'communityId': 3,
            'label': 'Organized Fraud & Co-Accused Ring',
            'nodeCount': 2300,
            'dominantType': 'FIR',
            'topEntities': ['P00951', 'P04964', 'F000001', 'F000002']
        }
    ])

@router.post('/expand', response_model=ResponseEnvelope[GraphDataResponse], summary='Neighborhood Expansion')
async def expand_neighborhood(req: NeighborhoodExpansionRequest, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    res = await m3_client.get_neighborhood(node_id=req.nodeId, hops=req.hops, relationship_types=req.relationshipTypes)
    return ResponseEnvelope(data=res)

@router.post('/relationships', response_model=ResponseEnvelope[GraphDataResponse], summary='Relationship Retrieval')
async def get_relationships(req: RelationshipRetrievalRequest, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    res = await m3_client.get_neighborhood(node_id=req.sourceNodeId, hops=1, relationship_types=req.relationshipTypes)
    return ResponseEnvelope(data=res)

@router.post('/subgraph', response_model=ResponseEnvelope[GraphDataResponse], summary='Subgraph Retrieval')
async def get_subgraph(req: SubgraphRetrievalRequest, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    res = await m3_client.get_subgraph(node_ids=req.nodeIds)
    return ResponseEnvelope(data=res)

@router.post('/shortest-path', response_model=ResponseEnvelope[dict], summary='Shortest Path Request')
async def shortest_path(req: ShortestPathRequest, m5_client: M5GraphAnalyticsClient = Depends(get_m5_client)):
    res = await m5_client.find_shortest_path(source_id=req.sourceNodeId, target_id=req.targetNodeId, max_depth=req.maxDepth)
    return ResponseEnvelope(data=res)

@router.post('/multi-hop', response_model=ResponseEnvelope[dict], summary='Multi-Hop Search Request')
async def multi_hop_search(req: MultiHopSearchRequest, m5_client: M5GraphAnalyticsClient = Depends(get_m5_client)):
    res = await m5_client.multi_hop_search(start_node_id=req.startNodeId, target_node_type=req.targetNodeType, max_hops=req.maxHops)
    return ResponseEnvelope(data=res)

@router.post('/filter', response_model=ResponseEnvelope[GraphDataResponse], summary='Graph Filtering by Type, Source, Date')
async def filter_graph(req: GraphFilterRequest, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    res = await m3_client.get_neighborhood(node_id='FIR-2024-8841', hops=4, relationship_types=req.relationshipTypes)
    return ResponseEnvelope(data=res)
