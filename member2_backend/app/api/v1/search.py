import os
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends
from neo4j import GraphDatabase

from app.dependencies import get_current_user
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.schemas.search import UniversalSearchRequest, UniversalSearchResponse, SearchResultItem
from app.services.demo_data import DEMO_ENTITIES

router = APIRouter(prefix='/search', tags=['Search Engine'])


@router.post('', response_model=ResponseEnvelope[UniversalSearchResponse], summary='Universal Search Across All Entity Types')
async def execute_search(search_req: UniversalSearchRequest, current_user: UserProfile = Depends(get_current_user)):
    q = search_req.query.strip().lower()
    items: List[SearchResultItem] = []

    # 1. Primary: Search real entities in Neo4j
    uri = os.getenv('NEO4J_URI', 'bolt://neo4j:7687')
    user = os.getenv('NEO4J_USERNAME', os.getenv('NEO4J_USER', 'neo4j'))
    pwd = os.getenv('NEO4J_PASSWORD', 'CrimeNetNeo4j123!')

    def _neo4j_search(tx):
        query = """
        MATCH (n)
        WHERE toLower(n.name) CONTAINS $q 
           OR toLower(n.id) CONTAINS $q 
           OR toLower(n.city) CONTAINS $q 
           OR toLower(n.role) CONTAINS $q 
           OR toLower(n.crime_type) CONTAINS $q 
           OR toLower(n.method) CONTAINS $q
           OR toLower(n.location) CONTAINS $q
        RETURN properties(n) as props, labels(n) as labels
        LIMIT 60
        """
        records = list(tx.run(query, q=q))
        res_items = []
        for r in records:
            props = r["props"]
            lbl = r["labels"][0] if r["labels"] else "Entity"
            nid = str(props.get('id', ''))
            cname = str(props.get('name') or props.get('canonicalName') or props.get('firNumber') or nid)
            
            matched = []
            if q in cname.lower():
                matched.append('name')
            if q in nid.lower():
                matched.append('id')
            if q in str(props.get('city', '')).lower():
                matched.append('city')
            if q in str(props.get('role', '')).lower():
                matched.append('role')

            snippet = f"{lbl} [{nid}]: {cname}"
            if props.get('city'):
                snippet += f" | City: {props.get('city')}"
            if props.get('role'):
                snippet += f" | Role: {props.get('role')}"
            if props.get('amount'):
                snippet += f" | INR {props.get('amount'):,.2f}"

            res_items.append(SearchResultItem(
                entityId=nid,
                entityType=lbl,
                name=cname,
                snippet=snippet,
                source=props.get('source', 'member3_data_graph/datasets'),
                caseReference='CASE-2025-NAT-001',
                confidence=0.98,
                matchedFields=matched or ['keyword'],
                metadata=props
            ))
        return res_items

    try:
        loop = asyncio.get_event_loop()
        driver = GraphDatabase.driver(uri, auth=(user, pwd))
        with driver.session() as session:
            db_matches = await loop.run_in_executor(None, session.execute_read, _neo4j_search)
        driver.close()

        if db_matches:
            items.extend(db_matches)
    except Exception as e:
        print(f"[Search API] Neo4j search error, falling back: {e}")

    # 2. Also search demo entities (or as fallback)
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
            # Avoid duplicate if already in items
            if not any(it.entityId == e_id for it in items):
                items.append(SearchResultItem(
                    entityId=e_id,
                    entityType=e_type,
                    name=c_name,
                    snippet=snippet,
                    source=e.get('source', 'M3_GRAPH_DATA'),
                    evidenceReference=e.get('evidenceId'),
                    caseReference=e.get('caseId'),
                    confidence=e.get('confidence', 0.95),
                    matchedFields=matched_fields or ['type'],
                    metadata=e.get('metadata', {})
                ))

    total = len(items)
    paginated = items[search_req.offset:search_req.offset + search_req.limit]
    res = UniversalSearchResponse(totalMatches=total, query=search_req.query, results=paginated)
    return ResponseEnvelope(data=res)
