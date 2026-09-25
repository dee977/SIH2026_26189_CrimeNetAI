import os
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from neo4j import GraphDatabase

from app.dependencies import get_current_user
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.schemas.timeline import TimelineEvent, TimelinePlaybackResponse, TimelinePlaybackFrame
from app.services.demo_data import DEMO_TIMELINE

router = APIRouter(prefix='/timeline', tags=['Timeline & Temporal Playback'])


def _fetch_neo4j_timeline(entity_id: Optional[str] = None, event_type: Optional[str] = None, limit: int = 50) -> List[TimelineEvent]:
    uri = os.getenv('NEO4J_URI', 'bolt://neo4j:7687')
    user = os.getenv('NEO4J_USERNAME', os.getenv('NEO4J_USER', 'neo4j'))
    pwd = os.getenv('NEO4J_PASSWORD', 'CrimeNetNeo4j123!')

    events: List[TimelineEvent] = []
    try:
        driver = GraphDatabase.driver(uri, auth=(user, pwd))
        with driver.session() as session:
            # 1. Communications
            if not event_type or event_type in ['COMMUNICATION', 'Communication']:
                if entity_id:
                    c_query = """
                    MATCH (c:Communication)
                    WHERE c.caller_id = $eid OR c.receiver_id = $eid
                    RETURN c.id as id, c.timestamp as ts, c.caller_id as caller, c.receiver_id as receiver, 
                           c.call_type as ctype, c.status as st, c.duration_sec as dur
                    ORDER BY c.timestamp DESC LIMIT $lim
                    """
                    records = session.run(c_query, eid=entity_id, lim=limit)
                else:
                    c_query = """
                    MATCH (c:Communication)
                    RETURN c.id as id, c.timestamp as ts, c.caller_id as caller, c.receiver_id as receiver, 
                           c.call_type as ctype, c.status as st, c.duration_sec as dur
                    ORDER BY c.timestamp DESC LIMIT $lim
                    """
                    records = session.run(c_query, lim=limit // 2)

                for r in records:
                    ts = f"{r['ts'].replace(' ', 'T')}Z" if r.get('ts') else "2025-01-01T00:00:00Z"
                    caller_id = str(r['caller'])
                    receiver_id = str(r['receiver'])
                    events.append(TimelineEvent(
                        eventId=f"EVT-COMM-{r['id']}",
                        caseId='CASE-2025-NAT-001',
                        timestamp=ts,
                        eventType='COMMUNICATION',
                        title=f"{r['ctype']} Call ({r['st']})",
                        description=f"Telecommunication link between {caller_id} and {receiver_id}. Duration: {r['dur']}s, Status: {r['st']}.",
                        primaryEntityId=caller_id,
                        primaryEntityName=f"Subject {caller_id}",
                        secondaryEntityId=receiver_id,
                        secondaryEntityName=f"Subject {receiver_id}",
                        location="Cell Tower Grid",
                        sourceDocument="communication_links.csv",
                        evidenceId='EVD-REAL-001',
                        metadata={'callId': r['id'], 'callType': r['ctype'], 'duration': r['dur'], 'status': r['st']}
                    ))

            # 2. Financial Transactions
            if not event_type or event_type in ['FINANCIAL_TRANSACTION', 'Transaction', 'FINANCIAL']:
                if entity_id:
                    t_query = """
                    MATCH (t:Transaction)
                    WHERE t.sender_id = $eid OR t.receiver_id = $eid
                    RETURN t.id as id, t.date as dt, t.sender_id as sender, t.receiver_id as receiver,
                           t.amount as amt, t.method as method, t.location as loc, t.risk_label as risk
                    ORDER BY t.date DESC LIMIT $lim
                    """
                    records = session.run(t_query, eid=entity_id, lim=limit)
                else:
                    t_query = """
                    MATCH (t:Transaction)
                    RETURN t.id as id, t.date as dt, t.sender_id as sender, t.receiver_id as receiver,
                           t.amount as amt, t.method as method, t.location as loc, t.risk_label as risk
                    ORDER BY t.date DESC LIMIT $lim
                    """
                    records = session.run(t_query, lim=limit // 2)

                for r in records:
                    amt_str = f"INR {r['amt']:,.2f}" if r.get('amt') else "INR 0"
                    sender_id = str(r['sender'])
                    receiver_id = str(r['receiver'])
                    events.append(TimelineEvent(
                        eventId=f"EVT-TXN-{r['id']}",
                        caseId='CASE-2025-NAT-001',
                        timestamp=f"{r['dt']}T12:00:00Z",
                        eventType='FINANCIAL_TRANSACTION',
                        title=f"{r['method']} Transfer ({amt_str})",
                        description=f"Funds transfer of {amt_str} from {sender_id} to {receiver_id} via {r['method']} in {r['loc']}. Risk: {r['risk']}.",
                        primaryEntityId=sender_id,
                        primaryEntityName=f"Account Holder {sender_id}",
                        secondaryEntityId=receiver_id,
                        secondaryEntityName=f"Beneficiary {receiver_id}",
                        location=str(r['loc']),
                        sourceDocument="financial_transactions.csv",
                        evidenceId='EVD-REAL-002',
                        metadata={'transactionId': r['id'], 'amount': r['amt'], 'method': r['method'], 'location': r['loc'], 'riskLabel': r['risk']}
                    ))

            # 3. FIR Registration Events
            if not event_type or event_type in ['CRIME_INCIDENT', 'FIR', 'CRIME']:
                f_query = """
                MATCH (f:FIR)
                RETURN f.id as id, f.date as dt, f.crime_type as crime, f.location as loc, f.case_status as status
                ORDER BY f.date DESC LIMIT 10
                """
                records = session.run(f_query)
                for r in records:
                    fid = str(r['id'])
                    events.append(TimelineEvent(
                        eventId=f"EVT-FIR-{fid}",
                        caseId='CASE-2025-NAT-001',
                        timestamp=f"{r['dt']}T09:00:00Z",
                        eventType='CRIME_INCIDENT',
                        title=f"FIR Registration: {r['crime']}",
                        description=f"FIR {fid} registered for {r['crime']} at {r['loc']}. Status: {r['status']}.",
                        primaryEntityId=fid,
                        primaryEntityName=f"FIR {fid}",
                        location=str(r['loc']),
                        sourceDocument="criminal_relationships.csv",
                        evidenceId='EVD-REAL-003',
                        metadata={'firId': fid, 'crimeType': r['crime'], 'location': r['loc'], 'caseStatus': r['status']}
                    ))

        driver.close()
    except Exception as e:
        print(f"[Timeline API] Neo4j timeline query error, fallback will trigger: {e}")

    events.sort(key=lambda x: x.timestamp, reverse=True)
    return events


@router.get('', response_model=PaginatedResponse[TimelineEvent], summary='Query Investigation Timeline')
async def get_timeline(
    caseId: Optional[str] = Query(None),
    entityId: Optional[str] = Query(None),
    eventType: Optional[str] = Query(None),
    fromDate: Optional[str] = Query(None),
    toDate: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=500),
    current_user: UserProfile = Depends(get_current_user)
):
    # 1. Primary: If querying real dataset or general timeline, fetch from Neo4j
    if not caseId or caseId in ['CASE-2025-NAT-001', 'ALL', 'default']:
        loop = asyncio.get_event_loop()
        real_events = await loop.run_in_executor(None, _fetch_neo4j_timeline, entityId, eventType, pageSize * 2)
        if real_events:
            start = (page - 1) * pageSize
            paginated = real_events[start:start + pageSize]
            total = len(real_events)
            pages = (total + pageSize - 1) // pageSize if total > 0 else 1
            return PaginatedResponse(
                items=paginated,
                pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages)
            )

    # 2. Fallback to demo timeline fixtures (e.g. for CASE-2024-MH-092)
    filtered = DEMO_TIMELINE
    if caseId:
        filtered = [t for t in filtered if t.get('caseId') == caseId]
    if entityId:
        filtered = [t for t in filtered if t.get('primaryEntityId') == entityId or t.get('secondaryEntityId') == entityId]
    if eventType:
        filtered = [t for t in filtered if t.get('eventType') == eventType]

    start = (page - 1) * pageSize
    items = [TimelineEvent(**t) for t in filtered[start:start + pageSize]]
    total = len(filtered)
    pages = (total + pageSize - 1) // pageSize if total > 0 else 1
    return PaginatedResponse(
        items=items,
        pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages)
    )


@router.get('/playback', response_model=ResponseEnvelope[TimelinePlaybackResponse], summary='Temporal Playback Frames for Graph Animation')
async def get_timeline_playback(caseId: Optional[str] = Query(None), current_user: UserProfile = Depends(get_current_user)):
    # 1. Primary: Use real events from Neo4j
    loop = asyncio.get_event_loop()
    events = await loop.run_in_executor(None, _fetch_neo4j_timeline, None, None, 40)
    
    # 2. Fallback to demo timeline if Neo4j returned nothing
    if not events:
        raw_demo = DEMO_TIMELINE if not caseId else [t for t in DEMO_TIMELINE if t.get('caseId') == caseId]
        events = [TimelineEvent(**t) for t in raw_demo]

    # Sort chronological ascending for smooth temporal playback
    sorted_events = sorted(events, key=lambda x: x.timestamp)
    frames = []
    accumulated_nodes = set()
    accumulated_edges = set()

    for idx, evt in enumerate(sorted_events):
        p_id = evt.primaryEntityId
        s_id = evt.secondaryEntityId
        if p_id:
            accumulated_nodes.add(p_id)
        if s_id:
            accumulated_nodes.add(s_id)
        if p_id and s_id:
            accumulated_edges.add(f'{p_id}->{s_id}')

        frames.append(TimelinePlaybackFrame(
            frameIndex=idx + 1,
            timestamp=evt.timestamp,
            activeEvents=[evt],
            activeNodes=list(accumulated_nodes),
            activeEdges=list(accumulated_edges)
        ))

    resp = TimelinePlaybackResponse(
        totalFrames=len(frames),
        startDate=sorted_events[0].timestamp if sorted_events else '',
        endDate=sorted_events[-1].timestamp if sorted_events else '',
        frames=frames
    )
    return ResponseEnvelope(data=resp)
