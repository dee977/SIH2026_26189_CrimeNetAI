from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.schemas.timeline import TimelineEvent, TimelinePlaybackResponse, TimelinePlaybackFrame, TimelineFilterRequest
from app.services.demo_data import DEMO_TIMELINE

router = APIRouter(prefix='/timeline', tags=['Timeline & Temporal Playback'])

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
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages))

@router.get('/playback', response_model=ResponseEnvelope[TimelinePlaybackResponse], summary='Temporal Playback Frames for Graph Animation')
async def get_timeline_playback(caseId: Optional[str] = Query(None), current_user: UserProfile = Depends(get_current_user)):
    events = DEMO_TIMELINE if not caseId else [t for t in DEMO_TIMELINE if t.get('caseId') == caseId]
    sorted_events = sorted(events, key=lambda x: x.get('timestamp', ''))
    frames = []
    accumulated_nodes = set()
    accumulated_edges = set()

    for idx, evt in enumerate(sorted_events):
        p_id = evt.get('primaryEntityId')
        s_id = evt.get('secondaryEntityId')
        if p_id:
            accumulated_nodes.add(p_id)
        if s_id:
            accumulated_nodes.add(s_id)
        if p_id and s_id:
            accumulated_edges.add(f'{p_id}->{s_id}')

        frames.append(TimelinePlaybackFrame(
            frameIndex=idx + 1,
            timestamp=evt.get('timestamp'),
            activeEvents=[TimelineEvent(**evt)],
            activeNodes=list(accumulated_nodes),
            activeEdges=list(accumulated_edges)
        ))

    resp = TimelinePlaybackResponse(
        totalFrames=len(frames),
        startDate=sorted_events[0]['timestamp'] if sorted_events else '',
        endDate=sorted_events[-1]['timestamp'] if sorted_events else '',
        frames=frames
    )
    return ResponseEnvelope(data=resp)
