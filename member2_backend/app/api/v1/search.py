from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.schemas.search import UniversalSearchRequest, UniversalSearchResponse, SearchResultItem
from app.services.demo_data import DEMO_ENTITIES

router = APIRouter(prefix='/search', tags=['Search Engine'])

@router.post('', response_model=ResponseEnvelope[UniversalSearchResponse], summary='Universal Search Across All 13 Entity Types')
async def execute_search(search_req: UniversalSearchRequest, current_user: UserProfile = Depends(get_current_user)):
    q = search_req.query.lower()
    items: List[SearchResultItem] = []
    
    for e in DEMO_ENTITIES:
        matched_fields = []
        c_name = e.get('canonicalName', '')
        e_id = e.get('id', '')
        e_type = e.get('entityType', '')
        
        if q in c_name.lower():
            matched_fields.append('canonicalName')
        if q in e_id.lower():
            matched_fields.append('id')
        if q in str(e.get('metadata', {})).lower():
            matched_fields.append('metadata')
            
        if matched_fields or q in e_type.lower():
            snippet = f'{e_type}: {c_name} - Ref: {e_id}'
            items.append(SearchResultItem(
                entityId=e_id,
                entityType=e_type,
                name=c_name,
                snippet=snippet,
                source=e.get('source', 'M3_GRAPH_DATA'),
                evidenceReference=e.get('evidenceId'),
                caseReference=e.get('caseId'),
                confidence=e.get('confidence', 0.95),
                matchedFields=matched_fields,
                metadata=e.get('metadata', {})
            ))

    total = len(items)
    paginated = items[search_req.offset:search_req.offset + search_req.limit]
    res = UniversalSearchResponse(totalMatches=total, query=search_req.query, results=paginated)
    return ResponseEnvelope(data=res)
