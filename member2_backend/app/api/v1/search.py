import os
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends
from neo4j import GraphDatabase

from app.config import settings
from app.dependencies import get_current_user
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.schemas.search import UniversalSearchRequest, UniversalSearchResponse, SearchResultItem

from app.dependencies import get_current_user, assert_case_access
from app.database import get_db

router = APIRouter(prefix='/search', tags=['Search Engine'])


@router.post('', response_model=ResponseEnvelope[UniversalSearchResponse], summary='Universal Search Across All Entity Types')
async def execute_search(
    search_req: UniversalSearchRequest,
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
):
    q = (search_req.query or '').strip().lower()
    items: List[SearchResultItem] = []

    case_id = (search_req.filters.caseId if search_req.filters and search_req.filters.caseId else None) or 'CASE-2024-001'
    assert_case_access(db, current_user, case_id)
    type_filters = [t.lower() for t in (search_req.filters.entityTypes or []) if t and t != 'ALL'] if search_req.filters else []

    uri = getattr(settings, 'M3_NEO4J_URI', 'bolt://localhost:7687')
    user = getattr(settings, 'M3_NEO4J_USER', 'neo4j')
    pwd = getattr(settings, 'M3_NEO4J_PASSWORD', None)

    def _neo4j_search(tx):
        # Build query dynamically
        where_clauses = []
        params = {'lim': search_req.limit or 100}

        if case_id:
            where_clauses.append("(n.caseId = $case_id OR n.case_id = $case_id)")
            params['case_id'] = case_id

        if q:
            params['q'] = q
            where_clauses.append("""(
                toLower(coalesce(n.name, '')) CONTAINS $q 
                OR toLower(coalesce(n.id, '')) CONTAINS $q 
                OR toLower(coalesce(n.city, '')) CONTAINS $q 
                OR toLower(coalesce(n.role, '')) CONTAINS $q 
                OR toLower(coalesce(n.crime_type, '')) CONTAINS $q 
                OR toLower(coalesce(n.method, '')) CONTAINS $q
                OR toLower(coalesce(n.location, '')) CONTAINS $q
                OR toLower(coalesce(n.canonicalName, '')) CONTAINS $q
            )""")

        where_stmt = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        query = f"""
        MATCH (n)
        {where_stmt}
        RETURN properties(n) as props, labels(n) as labels
        LIMIT $lim
        """
        records = list(tx.run(query, **params))
        res_items = []
        for r in records:
            props = r["props"]
            raw_labels = [lbl for lbl in (r["labels"] or []) if lbl != 'Entity']
            lbl = raw_labels[0] if raw_labels else (r["labels"][0] if r["labels"] else "Entity")
            
            # Filter by type if requested
            if type_filters:
                label_matches = any(t in lbl.lower() for t in type_filters)
                prop_type_matches = any(t in str(props.get('entityType', '')).lower() for t in type_filters)
                if not label_matches and not prop_type_matches:
                    continue

            nid = str(props.get('id') or props.get('original_id') or '')
            cname = str(props.get('name') or props.get('canonicalName') or props.get('fullName') or props.get('firNumber') or nid)
            
            matched = []
            if q:
                if q in cname.lower(): matched.append('name')
                if q in nid.lower(): matched.append('id')
                if q in str(props.get('city', '')).lower(): matched.append('city')
                if q in str(props.get('role', '')).lower(): matched.append('role')

            snippet = f"{lbl} [{nid}]: {cname}"
            if props.get('city'): snippet += f" | City: {props.get('city')}"
            if props.get('role'): snippet += f" | Role: {props.get('role')}"
            if props.get('amount'): snippet += f" | INR {props.get('amount'):,.2f}"
            if props.get('call_type'): snippet += f" | Call Type: {props.get('call_type')}"
            if props.get('crime_type'): snippet += f" | Crime: {props.get('crime_type')}"

            res_items.append(SearchResultItem(
                entityId=nid,
                entityType=lbl,
                name=cname,
                snippet=snippet,
                source=props.get('source', 'member3_data_graph/datasets'),
                caseReference=props.get('caseId') or case_id or 'CASE-2025-M3-DATASET',
                confidence=0.98,
                matchedFields=matched or ['index'],
                metadata=props
            ))
        return res_items

    try:
        def _run_search():
            driver = GraphDatabase.driver(uri, auth=(user, pwd), connection_timeout=0.2, max_connection_lifetime=5)
            try:
                driver.verify_connectivity()
                with driver.session() as session:
                    return session.execute_read(_neo4j_search)
            finally:
                driver.close()

        loop = asyncio.get_event_loop()
        db_matches = await loop.run_in_executor(None, _run_search)
        if db_matches:
            items.extend(db_matches)
    except Exception as e:
        print(f"[Search API] Neo4j search notice: {e}")

    # Merge canonical case entities and imported entities from DEMO_ENTITIES
    from app.services.demo_data import DEMO_ENTITIES
    seen_ids = {it.entityId for it in items}
    for ent in DEMO_ENTITIES:
        if case_id and ent.get('caseId') != case_id:
            continue
        nid = str(ent.get('id', ''))
        if nid in seen_ids:
            continue
        name = str(ent.get('canonicalName') or ent.get('name') or ent.get('fullName') or '')
        lbl = ent.get('entityType', 'Entity')
        if type_filters and not any(t in lbl.lower() for t in type_filters):
            continue
        if not q or (q in name.lower() or q in nid.lower()):
            seen_ids.add(nid)
            items.append(SearchResultItem(
                entityId=nid,
                entityType=lbl,
                name=name,
                snippet=f"{lbl} [{nid}]: {name}",
                source=ent.get('source', 'Uploaded CSV'),
                caseReference=case_id,
                confidence=0.98,
                matchedFields=['name'] if q and q in name.lower() else ['index'],
                metadata=ent
            ))

    total = len(items)
    paginated = items[search_req.offset:search_req.offset + search_req.limit]
    res = UniversalSearchResponse(totalMatches=total, query=search_req.query or '', results=paginated)
    return ResponseEnvelope(data=res)
