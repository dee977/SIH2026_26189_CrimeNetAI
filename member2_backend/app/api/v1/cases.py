from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import get_current_user, require_permission, assert_case_access
from app.database import get_db
from app.models import CaseMembershipModel
from app.exceptions import ResourceNotFoundError
from app.schemas.auth import UserProfile
from app.schemas.cases import (
    CaseCreateRequest, CaseUpdateRequest, CaseSummaryResponse,
    CaseDetailResponse, CaseActivity
)
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.services.case_service import get_case_service
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client

router = APIRouter(prefix='/cases', tags=['Case Management'])

@router.post('', response_model=ResponseEnvelope[CaseSummaryResponse], status_code=status.HTTP_201_CREATED, summary='Create Investigation Case')
async def create_case(
    case_in: CaseCreateRequest,
    current_user: UserProfile = Depends(require_permission('case:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    case_svc = get_case_service()
    case_data = case_in.model_dump()
    new_case = case_svc.create_case(case_data)
    membership = CaseMembershipModel(case_id=new_case['caseId'], user_email=current_user.email, membership_role='OWNER')
    db.add(membership)
    try:
        db.commit()
    except Exception:
        db.rollback()
    
    await m6_client.log_audit_event({
        'logId': f'LOG-CASE-CREATE-{new_case["caseId"]}',
        'userId': current_user.userId,
        'userName': current_user.fullName,
        'action': 'CASE_CREATED',
        'endpoint': '/api/v1/cases',
        'caseId': new_case['caseId'],
        'details': {'title': case_in.title, 'priority': case_in.priority}
    })
    return ResponseEnvelope(data=CaseSummaryResponse(**new_case))

@router.get('', response_model=PaginatedResponse[CaseSummaryResponse], summary='List All Cases')
async def list_cases(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
):
    case_svc = get_case_service()
    all_cases = case_svc.list_cases(status=status, priority=priority)
    if current_user.grantedRole != 'ADMIN':
        memberships = db.query(CaseMembershipModel.case_id).filter(CaseMembershipModel.user_email.ilike(current_user.email)).all()
        allowed = {row[0] for row in memberships}
        all_cases = [case for case in all_cases if case['caseId'] in allowed]
    
    start = (page - 1) * pageSize
    end = start + pageSize
    items = [CaseSummaryResponse(**c) for c in all_cases[start:end]]
    total = len(all_cases)
    pages = (total + pageSize - 1) // pageSize if total > 0 else 1
    return PaginatedResponse(
        items=items,
        pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages)
    )

@router.get('/{id}', response_model=ResponseEnvelope[CaseDetailResponse], summary='Get Case Detail')
async def get_case_detail(id: str, current_user: UserProfile = Depends(get_current_user), db = Depends(get_db)):
    assert_case_access(db, current_user, id)
    case_svc = get_case_service()
    case_summary = case_svc.get_case(id)
    if not case_summary:
        raise ResourceNotFoundError('Case', id)
    
    detail = CaseDetailResponse(
        caseId=case_summary['caseId'],
        title=case_summary['title'],
        description=case_summary['description'],
        assignedInvestigator=case_summary['assignedInvestigator'],
        assignedTeam=case_summary['assignedTeam'],
        status=case_summary['status'],
        priority=case_summary['priority'],
        entities=[],
        relationships=[],
        evidence=[],
        timeline=[],
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
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, id)
    case_svc = get_case_service()
    case_summary = case_svc.get_case(id)
    if not case_summary:
        raise ResourceNotFoundError('Case', id)
        
    update_data = case_update.model_dump(exclude_unset=True)
    updated_case = case_svc.update_case(id, update_data)
    
    await m6_client.log_audit_event({
        'logId': f'LOG-CASE-UPDATE-{id}',
        'userId': current_user.userId,
        'userName': current_user.fullName,
        'action': 'CASE_UPDATED',
        'endpoint': f'/api/v1/cases/{id}',
        'caseId': id,
        'details': update_data
    })
    return ResponseEnvelope(data=CaseSummaryResponse(**updated_case))
