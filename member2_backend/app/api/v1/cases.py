from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import get_current_user, require_permission
from app.exceptions import ResourceNotFoundError
from app.schemas.auth import UserProfile
from app.schemas.cases import (
    CaseCreateRequest, CaseUpdateRequest, CaseSummaryResponse,
    CaseDetailResponse, CaseActivity
)
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.services.demo_data import DEMO_CASES, DEMO_ENTITIES, DEMO_EDGES, DEMO_TIMELINE
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client

router = APIRouter(prefix='/cases', tags=['Case Management'])

@router.post('', response_model=ResponseEnvelope[CaseSummaryResponse], status_code=status.HTTP_201_CREATED, summary='Create Investigation Case')
async def create_case(
    case_in: CaseCreateRequest,
    current_user: UserProfile = Depends(require_permission('case:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client)
):
    case_id = f'CASE-2024-{len(DEMO_CASES) + 1:03d}'
    now = datetime.now(timezone.utc).isoformat()
    new_case = {
        'caseId': case_id,
        'title': case_in.title,
        'description': case_in.description,
        'assignedInvestigator': case_in.assignedInvestigator,
        'assignedTeam': case_in.assignedTeam,
        'status': 'active',
        'priority': case_in.priority,
        'entityCount': len(case_in.initialEntityIds or []),
        'relationshipCount': 0,
        'evidenceCount': len(case_in.initialEvidenceIds or []),
        'reportCount': 0,
        'createdAt': now,
        'updatedAt': now
    }
    DEMO_CASES.append(new_case)
    await m6_client.log_audit_event({
        'logId': f'LOG-CASE-CREATE-{case_id}',
        'userId': current_user.userId,
        'userName': current_user.fullName,
        'action': 'CASE_CREATED',
        'endpoint': '/api/v1/cases',
        'caseId': case_id,
        'details': {'title': case_in.title, 'priority': case_in.priority}
    })
    return ResponseEnvelope(data=CaseSummaryResponse(**new_case))

@router.get('', response_model=PaginatedResponse[CaseSummaryResponse], summary='List All Cases')
async def list_cases(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: UserProfile = Depends(get_current_user)
):
    filtered = DEMO_CASES
    if status:
        filtered = [c for c in filtered if c.get('status') == status]
    if priority:
        filtered = [c for c in filtered if c.get('priority') == priority]
    start = (page - 1) * pageSize
    end = start + pageSize
    items = [CaseSummaryResponse(**c) for c in filtered[start:end]]
    total = len(filtered)
    pages = (total + pageSize - 1) // pageSize if total > 0 else 1
    return PaginatedResponse(
        items=items,
        pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages)
    )

@router.get('/{id}', response_model=ResponseEnvelope[CaseDetailResponse], summary='Get Case Detail')
async def get_case_detail(id: str, current_user: UserProfile = Depends(get_current_user)):
    case_summary = next((c for c in DEMO_CASES if c.get('caseId') == id), None)
    if not case_summary:
        raise ResourceNotFoundError('Case', id)
    case_entities = [e for e in DEMO_ENTITIES if e.get('caseId') == id or not e.get('caseId')]
    case_edges = [ed for ed in DEMO_EDGES]
    case_timeline = [t for t in DEMO_TIMELINE if t.get('caseId') == id]
    detail = CaseDetailResponse(
        caseId=case_summary['caseId'],
        title=case_summary['title'],
        description=case_summary['description'],
        assignedInvestigator=case_summary['assignedInvestigator'],
        assignedTeam=case_summary['assignedTeam'],
        status=case_summary['status'],
        priority=case_summary['priority'],
        entities=case_entities,
        relationships=case_edges,
        evidence=[e for e in case_entities if e.get('entityType') == 'Evidence'],
        timeline=case_timeline,
        reports=[],
        recentActivity=[
            CaseActivity(activityId='ACT-01', caseId=id, action='INVESTIGATOR_ACCESSED_CASE', performedBy=current_user.fullName)
        ],
        createdAt=case_summary['createdAt'],
        updatedAt=case_summary['updatedAt']
    )
    return ResponseEnvelope(data=detail)

@router.put('/{id}', response_model=ResponseEnvelope[CaseSummaryResponse], summary='Update Case Details')
@router.patch('/{id}', response_model=ResponseEnvelope[CaseSummaryResponse], summary='Partial Update Case')
async def update_case(
    id: str,
    case_update: CaseUpdateRequest,
    current_user: UserProfile = Depends(require_permission('case:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client)
):
    case_summary = next((c for c in DEMO_CASES if c.get('caseId') == id), None)
    if not case_summary:
        raise ResourceNotFoundError('Case', id)
    update_data = case_update.model_dump(exclude_unset=True)
    case_summary.update(update_data)
    case_summary['updatedAt'] = datetime.now(timezone.utc).isoformat()
    await m6_client.log_audit_event({
        'logId': f'LOG-CASE-UPDATE-{id}',
        'userId': current_user.userId,
        'userName': current_user.fullName,
        'action': 'CASE_UPDATED',
        'endpoint': f'/api/v1/cases/{id}',
        'caseId': id,
        'details': update_data
    })
    return ResponseEnvelope(data=CaseSummaryResponse(**case_summary))
