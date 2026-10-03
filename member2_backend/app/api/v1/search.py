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

    case_id = search_req.filters.caseId if search_req.filters and search_req.filters.caseId else None
    if case_id:
        assert_case_access(db, current_user, case_id)
    type_filters = [t.lower() for t in (search_req.filters.entityTypes or []) if t and t != 'ALL'] if search_req.filters else []

    # 1. Query PostgreSQL EntityModel
    from app.models import EntityModel
    pg_query = db.query(EntityModel)
    if case_id:
        pg_query = pg_query.filter(EntityModel.case_id == case_id)

    db_entities = pg_query.all()
    seen_ids = set()

    for ent in db_entities:
        nid = ent.entity_id
        lbl = ent.entity_type
        cname = ent.canonical_name
        props = ent.properties or {}

        if type_filters and not any(t in lbl.lower() for t in type_filters):
            continue

        matched = []
        if q:
            match_found = False
            if q in cname.lower():
                matched.append('canonicalName')
                match_found = True
            if q in nid.lower():
                matched.append('id')
                match_found = True
            if q in str(props.get('city', '')).lower():
                matched.append('city')
                match_found = True
            if q in str(props.get('role', '')).lower():
                matched.append('role')
                match_found = True
            if q in str(props.get('alias', '')).lower():
                matched.append('alias')
                match_found = True
            if not match_found:
                continue
        else:
            matched = ['index']

        seen_ids.add(nid)
        snippet = f"{lbl} [{nid}]: {cname}"
        if props.get('city'): snippet += f" | City: {props.get('city')}"
        if props.get('role'): snippet += f" | Role: {props.get('role')}"
        if props.get('alias'): snippet += f" | Alias: {props.get('alias')}"
        if props.get('amount'): snippet += f" | INR {props.get('amount'):,.2f}"

        items.append(SearchResultItem(
            entityId=nid,
            entityType=lbl,
            name=cname,
            snippet=snippet,
            source='Supabase PostgreSQL',
            caseReference=ent.case_id or case_id or '',
            confidence=float(ent.confidence or 0.98),
            matchedFields=matched,
            metadata=props
        ))

    # 2. Check Neo4j if available and items is empty
    if not items:
        uri = getattr(settings, 'M3_NEO4J_URI', 'bolt://localhost:7687')
        user = getattr(settings, 'M3_NEO4J_USER', 'neo4j')
        pwd = getattr(settings, 'M3_NEO4J_PASSWORD', None)

        def _neo4j_search(tx):
            where_clauses = []
            params = {'lim': search_req.limit or 100}
            if case_id:
                where_clauses.append("(n.caseId = $case_id OR n.case_id = $case_id)")
                params['case_id'] = case_id
            if q:
                params['q'] = q
                where_clauses.append("(toLower(coalesce(n.name, '')) CONTAINS $q OR toLower(coalesce(n.id, '')) CONTAINS $q)")
            where_stmt = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
            query = f"MATCH (n) {where_stmt} RETURN properties(n) as props, labels(n) as labels LIMIT $lim"
            records = list(tx.run(query, **params))
            res_items = []
            for r in records:
                props = r["props"]
                raw_labels = [l for l in (r["labels"] or []) if l != 'Entity']
                lbl = raw_labels[0] if raw_labels else "Entity"
                nid = str(props.get('id') or '')
                cname = str(props.get('name') or props.get('canonicalName') or nid)
                res_items.append(SearchResultItem(
                    entityId=nid, entityType=lbl, name=cname,
                    snippet=f"{lbl} [{nid}]: {cname}",
                    source='Neo4j Graph', caseReference=case_id or '',
                    confidence=0.95, matchedFields=['query'], metadata=props
                ))
            return res_items

        try:
            driver = GraphDatabase.driver(uri, auth=(user, pwd), connection_timeout=0.2, max_connection_lifetime=5)
            try:
                driver.verify_connectivity()
                with driver.session() as session:
                    db_matches = session.execute_read(_neo4j_search)
                if db_matches:
                    for m in db_matches:
                        if m.entityId not in seen_ids:
                            seen_ids.add(m.entityId)
                            items.append(m)
            finally:
                driver.close()
        except Exception:
            pass

    total = len(items)
    paginated = items[search_req.offset:search_req.offset + search_req.limit]
    res = UniversalSearchResponse(totalMatches=total, query=search_req.query or '', results=paginated)
    return ResponseEnvelope(data=res)
