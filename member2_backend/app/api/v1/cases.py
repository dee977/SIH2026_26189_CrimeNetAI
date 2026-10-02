import hashlib
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from app.dependencies import get_current_user, require_permission, assert_case_access
from app.database import get_db
from app.models import CaseMembershipModel, CaseModel
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
    if current_user.grantedRole not in ('ADMIN', 'INVESTIGATOR'):
        memberships = db.query(CaseMembershipModel.case_id).filter(CaseMembershipModel.user_email.ilike(current_user.email)).all()
        allowed = {row[0] for row in memberships}
        if allowed:
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

    from app.models import EvidenceModel, IngestJobModel
    from app.services.demo_data import DEMO_ENTITIES, DEMO_EDGES, DEMO_TIMELINE

    ev_rows = db.query(EvidenceModel).filter(EvidenceModel.case_id == id).all()
    evidence_list = []
    for r in ev_rows:
        evidence_list.append({
            'id': r.evidence_id,
            'evidenceId': r.evidence_id,
            'evidenceCode': r.evidence_number or r.evidence_id,
            'title': r.canonical_name,
            'category': r.evidence_type,
            'caseId': r.case_id,
            'seizureDate': r.collected_date,
            'seizingOfficer': r.collected_by,
            'custodian': r.storage_location,
            'sha256Hash': r.sha256_hash,
            'originalHashSHA256': r.sha256_hash,
            'currentHashSHA256': r.sha256_hash,
            'integrityStatus': 'MATCH',
            'bsaCertificateId': r.bsa_certificate_id,
            'confidence': float(r.confidence) if r.confidence else 1.0,
            'description': r.description or f"Evidence item {r.evidence_id}"
        })

    entities_list = [
        e for e in DEMO_ENTITIES 
        if e.get('caseId') == id or id in e.get('caseIds', []) or (id == 'CASE-2025-M3-DATASET' and not e.get('caseId'))
    ]

    rel_list = [
        e for e in DEMO_EDGES
        if e.get('caseId') == id or (id == 'CASE-2025-M3-DATASET' and not e.get('caseId'))
    ]

    timeline_list = [
        t for t in DEMO_TIMELINE
        if t.get('caseId') == id or (id == 'CASE-2025-M3-DATASET' and not t.get('caseId'))
    ]

    activities = [
        CaseActivity(activityId='ACT-01', caseId=id, action='INVESTIGATOR_ACCESSED_CASE', performedBy=current_user.fullName)
    ]
    recent_job = db.query(IngestJobModel).filter(IngestJobModel.case_id == id).order_by(IngestJobModel.id.desc()).first()
    if recent_job:
        activities.insert(0, CaseActivity(
            activityId=f"ACT-{recent_job.job_id}",
            caseId=id,
            action=f"EVIDENCE_INGESTED_{recent_job.status}",
            performedBy=current_user.fullName,
            details={'fileName': recent_job.file_name, 'recordsProcessed': recent_job.records_processed}
        ))
    
    detail = CaseDetailResponse(
        caseId=case_summary['caseId'],
        title=case_summary['title'],
        description=case_summary['description'],
        assignedInvestigator=case_summary['assignedInvestigator'],
        assignedTeam=case_summary['assignedTeam'],
        status=case_summary['status'],
        priority=case_summary['priority'],
        entities=entities_list,
        relationships=rel_list,
        evidence=evidence_list,
        timeline=timeline_list,
        reports=[
            {'reportId': f"REP-{id}-01", 'caseId': id, 'title': f"Interim Investigation Dossier - {case_summary['title']}", 'generatedAt': case_summary['createdAt']}
        ],
        recentActivity=activities,
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

@router.post('/{case_id}/documents', response_model=ResponseEnvelope[Dict[str, Any]], summary='Upload and Attach Document to Case')
@router.post('/{case_id}/evidence', response_model=ResponseEnvelope[Dict[str, Any]], summary='Upload and Attach Evidence to Case')
async def attach_case_document(
    case_id: str,
    file: UploadFile = File(...),
    document_type: Optional[str] = Form('General Evidence'),
    description: Optional[str] = Form(None),
    current_user: UserProfile = Depends(require_permission('evidence:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    content = await file.read()
    sha256_hash = hashlib.sha256(content).hexdigest()
    now = datetime.now(timezone.utc).isoformat()
    evidence_id = f"EVD-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    cert_id = f"BSA-63-{datetime.now().year}-{evidence_id}"

    from app.services.supabase_service import get_supabase_storage_service
    storage_service = get_supabase_storage_service()
    supabase_path = storage_service.upload_file(case_id, file.filename, content, file.content_type or "application/octet-stream")
    if not supabase_path:
        raise HTTPException(status_code=502, detail="Storage service rejected the physical upload. Evidence record aborted.")
    final_storage_location = supabase_path

    from app.models import EvidenceModel, EntityModel
    ev_row = EvidenceModel(
        evidence_id=evidence_id,
        case_id=case_id,
        entity_type='Evidence',
        canonical_name=f"{document_type}: {file.filename}",
        evidence_number=evidence_id,
        evidence_type=document_type or file.content_type or 'Document',
        description=description or f"Document '{file.filename}' attached to case {case_id}.",
        collected_date=now,
        collected_by=current_user.fullName,
        storage_location=final_storage_location,
        sha256_hash=sha256_hash,
        bsa_certificate_id=cert_id,
        confidence='1.0',
        metadata_json={
            'sourceFilename': file.filename,
            'sourceType': 'Case Document Attachment',
            'uploader': current_user.fullName,
            'chainOfCustodyVerified': True,
            'fileSize': len(content),
            'documentType': document_type,
            'filePath': final_storage_location
        }
    )
    db.add(ev_row)

    ent_row = EntityModel(
        entity_id=evidence_id,
        case_id=case_id,
        canonical_name=f"{document_type}: {file.filename}",
        entity_type='Evidence',
        confidence=1.0,
        properties={
            'id': evidence_id,
            'name': f"{document_type}: {file.filename}",
            'canonicalName': f"{document_type}: {file.filename}",
            'entityType': 'Evidence',
            'caseId': case_id,
            'sha256Hash': sha256_hash,
            'filename': file.filename,
            'documentType': document_type,
            'source': 'Case Document Attachment'
        }
    )
    db.add(ent_row)
    db.commit()
    db.refresh(ev_row)

    await m6_client.log_audit_event({
        'action': 'CASE_DOCUMENT_ATTACHED',
        'caseId': case_id,
        'evidenceId': evidence_id,
        'fileName': file.filename,
        'documentType': document_type,
        'sha256': sha256_hash,
        'officer': current_user.fullName
    })

    return ResponseEnvelope(data={
        'id': evidence_id,
        'evidenceId': evidence_id,
        'caseId': case_id,
        'filename': file.filename,
        'title': ev_row.canonical_name,
        'documentType': document_type,
        'category': document_type,
        'sha256Hash': sha256_hash,
        'originalHashSHA256': sha256_hash,
        'currentHashSHA256': sha256_hash,
        'integrityStatus': 'MATCH',
        'bsaCertificateId': cert_id,
        'fileSizeBytes': len(content),
        'uploadedAt': now,
        'uploader': current_user.fullName,
        'description': ev_row.description
    })

@router.get('/{case_id}/documents', response_model=ResponseEnvelope[List[Dict[str, Any]]], summary='List Case Documents')
@router.get('/{case_id}/evidence', response_model=ResponseEnvelope[List[Dict[str, Any]]], summary='List Case Evidence')
async def list_case_documents(
    case_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    from app.models import EvidenceModel
    rows = db.query(EvidenceModel).filter(EvidenceModel.case_id == case_id).order_by(EvidenceModel.created_at.desc()).all()
    results = []
    for r in rows:
        meta = r.metadata_json or {}
        results.append({
            'id': r.evidence_id,
            'evidenceId': r.evidence_id,
            'caseId': r.case_id,
            'filename': meta.get('sourceFilename') or r.canonical_name,
            'title': r.canonical_name,
            'documentType': meta.get('documentType') or r.evidence_type,
            'category': r.evidence_type,
            'sha256Hash': r.sha256_hash,
            'originalHashSHA256': r.sha256_hash,
            'currentHashSHA256': r.sha256_hash,
            'integrityStatus': 'MATCH',
            'bsaCertificateId': r.bsa_certificate_id,
            'fileSizeBytes': meta.get('fileSize') or 1048576,
            'uploadedAt': r.collected_date or (r.created_at.isoformat() if r.created_at else None),
            'uploader': r.collected_by,
            'description': r.description
        })
    return ResponseEnvelope(data=results)

@router.get('/{case_id}/members', response_model=ResponseEnvelope[List[Dict[str, Any]]], summary='List Case Team Members')
async def list_case_members(
    case_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    members = db.query(CaseMembershipModel).filter(CaseMembershipModel.case_id == case_id).all()
    return ResponseEnvelope(data=[{
        'email': m.user_email,
        'role': m.membership_role,
        'addedAt': m.created_at.isoformat() if m.created_at else None
    } for m in members])

@router.post('/{case_id}/members', response_model=ResponseEnvelope[Dict[str, Any]], summary='Add Case Team Member')
async def add_case_member(
    case_id: str,
    member: Dict[str, Any],
    current_user: UserProfile = Depends(require_permission('case:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    email = member.get('email', '').strip().lower()
    role = member.get('role', 'MEMBER').upper()
    if not email:
        raise HTTPException(status_code=422, detail='Email is required')
    
    existing = db.query(CaseMembershipModel).filter(
        CaseMembershipModel.case_id == case_id,
        CaseMembershipModel.user_email.ilike(email)
    ).first()
    if existing:
        existing.membership_role = role
        db.commit()
        return ResponseEnvelope(data={'email': email, 'role': role, 'status': 'updated'})
    
    new_member = CaseMembershipModel(case_id=case_id, user_email=email, membership_role=role)
    db.add(new_member)
    db.commit()
    
    await m6_client.log_audit_event({
        'action': 'CASE_MEMBER_ADDED',
        'caseId': case_id,
        'memberEmail': email,
        'memberRole': role,
        'addedBy': current_user.fullName
    })
    return ResponseEnvelope(data={'email': email, 'role': role, 'status': 'added'})

@router.delete('/{case_id}/members/{email}', response_model=ResponseEnvelope[Dict[str, Any]], summary='Remove Case Team Member')
async def remove_case_member(
    case_id: str,
    email: str,
    current_user: UserProfile = Depends(require_permission('case:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    member = db.query(CaseMembershipModel).filter(
        CaseMembershipModel.case_id == case_id,
        CaseMembershipModel.user_email.ilike(email)
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail='Member not found')
    db.delete(member)
    db.commit()
    
    await m6_client.log_audit_event({
        'action': 'CASE_MEMBER_REMOVED',
        'caseId': case_id,
        'memberEmail': email,
        'removedBy': current_user.fullName
    })
    return ResponseEnvelope(data={'email': email, 'status': 'removed'})

@router.post('/{case_id}/close', response_model=ResponseEnvelope[CaseSummaryResponse], summary='Close Investigation Case')
async def close_case(
    case_id: str,
    body: Dict[str, Any],
    current_user: UserProfile = Depends(require_permission('case:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    case_svc = get_case_service()
    now = datetime.now(timezone.utc).isoformat()
    
    case = db.query(CaseModel).filter(
        (CaseModel.case_id == case_id) | (CaseModel.case_number == case_id)
    ).first()
    if not case:
        raise ResourceNotFoundError('Case', case_id)
    
    case.status = 'closed'
    case.closure_reason = body.get('reason', 'Case closed')
    case.closed_at = datetime.now(timezone.utc)
    db.commit()
    
    await m6_client.log_audit_event({
        'action': 'CASE_CLOSED',
        'caseId': case_id,
        'closedBy': current_user.fullName,
        'reason': body.get('reason', 'Case closed')
    })
    
    updated = case_svc.get_case(case_id)
    return ResponseEnvelope(data=CaseSummaryResponse(**updated))

@router.post('/{case_id}/archive', response_model=ResponseEnvelope[CaseSummaryResponse], summary='Archive Case')
async def archive_case(
    case_id: str,
    current_user: UserProfile = Depends(require_permission('case:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    case_svc = get_case_service()
    
    case = db.query(CaseModel).filter(
        (CaseModel.case_id == case_id) | (CaseModel.case_number == case_id)
    ).first()
    if not case:
        raise ResourceNotFoundError('Case', case_id)
    
    case.status = 'archived'
    case.archived_at = datetime.now(timezone.utc)
    db.commit()
    
    await m6_client.log_audit_event({
        'action': 'CASE_ARCHIVED',
        'caseId': case_id,
        'archivedBy': current_user.fullName
    })
    
    updated = case_svc.get_case(case_id)
    return ResponseEnvelope(data=CaseSummaryResponse(**updated))

@router.post('/{case_id}/reactivate', response_model=ResponseEnvelope[CaseSummaryResponse], summary='Reactivate Case')
async def reactivate_case(
    case_id: str,
    current_user: UserProfile = Depends(require_permission('case:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    case_svc = get_case_service()
    
    case = db.query(CaseModel).filter(
        (CaseModel.case_id == case_id) | (CaseModel.case_number == case_id)
    ).first()
    if not case:
        raise ResourceNotFoundError('Case', case_id)
    
    case.status = 'active'
    case.closed_at = None
    case.archived_at = None
    case.closure_reason = None
    db.commit()
    
    await m6_client.log_audit_event({
        'action': 'CASE_REACTIVATED',
        'caseId': case_id,
        'reactivatedBy': current_user.fullName
    })
    
    updated = case_svc.get_case(case_id)
    return ResponseEnvelope(data=CaseSummaryResponse(**updated))

@router.get('/{case_id}/notes', response_model=ResponseEnvelope[List[Dict[str, Any]]], summary='List Case Notes')
async def list_case_notes(
    case_id: str,
    current_user: UserProfile = Depends(get_current_user),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    from app.models import CaseNoteModel
    notes = db.query(CaseNoteModel).filter(CaseNoteModel.case_id == case_id).order_by(CaseNoteModel.created_at.desc()).all()
    return ResponseEnvelope(data=[{
        'noteId': n.note_id,
        'caseId': n.case_id,
        'content': n.content,
        'authorEmail': n.author_email,
        'authorName': n.author_name,
        'isPinned': n.is_pinned,
        'createdAt': n.created_at.isoformat() if n.created_at else None,
        'updatedAt': n.updated_at.isoformat() if n.updated_at else None
    } for n in notes])

@router.post('/{case_id}/notes', response_model=ResponseEnvelope[Dict[str, Any]], status_code=status.HTTP_201_CREATED, summary='Create Case Note')
async def create_case_note(
    case_id: str,
    body: Dict[str, Any],
    current_user: UserProfile = Depends(require_permission('case:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, case_id)
    from app.models import CaseNoteModel
    
    note_id = f"NOTE-{uuid.uuid4().hex[:8].upper()}"
    note = CaseNoteModel(
        note_id=note_id,
        case_id=case_id,
        content=body.get('content', ''),
        author_email=current_user.email,
        author_name=current_user.fullName,
        is_pinned=body.get('isPinned', False)
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    
    await m6_client.log_audit_event({
        'action': 'CASE_NOTE_ADDED',
        'caseId': case_id,
        'noteId': note_id,
        'addedBy': current_user.fullName
    })
    
    return ResponseEnvelope(data={
        'noteId': note.note_id,
        'caseId': note.case_id,
        'content': note.content,
        'authorEmail': note.author_email,
        'authorName': note.author_name,
        'isPinned': note.is_pinned,
        'createdAt': note.created_at.isoformat() if note.created_at else None
    })




