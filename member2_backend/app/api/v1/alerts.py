from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user, require_permission
from app.exceptions import ResourceNotFoundError
from app.schemas.alerts import AlertResponse, AlertFilterRequest, AlertAcknowledgeRequest
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.services.demo_data import DEMO_ALERTS

router = APIRouter(prefix='/alerts', tags=['Real-Time Network Alerts'])

@router.get('', response_model=PaginatedResponse[AlertResponse], summary='List Network Alerts')
async def list_alerts(
    alertType: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    caseId: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user)
):
    filtered = DEMO_ALERTS
    if alertType:
        filtered = [a for a in filtered if a.get('alertType') == alertType]
    if severity:
        filtered = [a for a in filtered if a.get('severity') == severity]
    if status:
        filtered = [a for a in filtered if a.get('status') == status]

    start = (page - 1) * pageSize
    items = [AlertResponse(**a) for a in filtered[start:start + pageSize]]
    total = len(filtered)
    pages = (total + pageSize - 1) // pageSize if total > 0 else 1
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages))

@router.post('/{alertId}/acknowledge', response_model=ResponseEnvelope[AlertResponse], summary='Acknowledge / Resolve Alert')
async def acknowledge_alert(
    alertId: str,
    ack: AlertAcknowledgeRequest,
    current_user: UserProfile = Depends(require_permission('alert:manage'))
):
    target = next((a for a in DEMO_ALERTS if a.get('alertId') == alertId), None)
    if not target:
        raise ResourceNotFoundError('Alert', alertId)
    target['status'] = ack.status
    if 'metadata' not in target:
        target['metadata'] = {}
    target['metadata']['resolutionNotes'] = ack.resolutionNotes
    target['metadata']['resolvedBy'] = current_user.fullName
    return ResponseEnvelope(data=AlertResponse(**target))
