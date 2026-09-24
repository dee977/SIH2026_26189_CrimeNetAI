import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.dependencies import get_current_user, require_permission
from app.exceptions import ResourceNotFoundError
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.schemas.watchlist import WatchlistAddRequest, WatchlistRemoveRequest, WatchlistItemResponse
from app.services.demo_data import DEMO_WATCHLIST

router = APIRouter(prefix='/watchlist', tags=['Target Watchlist Management'])

@router.post('', response_model=ResponseEnvelope[WatchlistItemResponse], status_code=status.HTTP_201_CREATED, summary='Add Entity to Target Watchlist')
async def add_to_watchlist(
    req: WatchlistAddRequest,
    current_user: UserProfile = Depends(require_permission('watchlist:manage'))
):
    watch_id = f'WCH-{uuid.uuid4().hex[:6].upper()}'
    now = datetime.now(timezone.utc).isoformat()
    new_item = {
        'watchId': watch_id,
        'entityType': req.entityType,
        'identifierValue': req.identifierValue,
        'canonicalName': req.identifierValue,
        'reason': req.reason,
        'priority': req.priority,
        'caseId': req.caseId,
        'addedBy': current_user.fullName,
        'addedAt': now,
        'isActive': True,
        'matchCount': 0
    }
    DEMO_WATCHLIST.append(new_item)
    return ResponseEnvelope(data=WatchlistItemResponse(**new_item))

@router.get('', response_model=PaginatedResponse[WatchlistItemResponse], summary='List Active Watchlist Targets')
async def list_watchlist(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    entityType: Optional[str] = Query(None),
    current_user: UserProfile = Depends(get_current_user)
):
    filtered = DEMO_WATCHLIST
    if entityType:
        filtered = [w for w in filtered if w.get('entityType') == entityType]
    start = (page - 1) * pageSize
    items = [WatchlistItemResponse(**w) for w in filtered[start:start + pageSize]]
    total = len(filtered)
    pages = (total + pageSize - 1) // pageSize if total > 0 else 1
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages))

@router.delete('/{watchId}', response_model=ResponseEnvelope[dict], summary='Remove Target from Watchlist')
async def remove_watchlist_item(
    watchId: str,
    current_user: UserProfile = Depends(require_permission('watchlist:manage'))
):
    target = next((w for w in DEMO_WATCHLIST if w.get('watchId') == watchId), None)
    if not target:
        raise ResourceNotFoundError('WatchlistItem', watchId)
    target['isActive'] = False
    return ResponseEnvelope(data={'message': f'Watchlist target {watchId} deactivated successfully.'})
