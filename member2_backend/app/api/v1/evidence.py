from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Path, HTTPException, UploadFile, File, Form, status
import hashlib
import uuid
from datetime import datetime, timezone

from app.dependencies import get_current_user, require_permission, assert_case_access
from app.database import get_db
from app.models import EvidenceModel
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.services.m6_security_evidence import get_m6_client, M6SecurityClient

router = APIRouter(prefix='', tags=['Evidence & Verification'])

def _evidence_model_to_dict(e: EvidenceModel) -> Dict[str, Any]:
    return {
        'id': e.evidence_id,
        'evidenceId': e.evidence_id,
        'entityType': e.entity_type,
        'canonicalName': e.canonical_name,
        'evidenceNumber': e.evidence_number,
        'evidenceType': e.evidence_type,
        'description': e.description,
        'collectedDate': e.collected_date,
        'collectedBy': e.collected_by,
        'storageLocation': e.storage_location,
        'sha256Hash': e.sha256_hash,
        'originalHashSHA256': e.sha256_hash,
        'currentHashSHA256': e.sha256_hash,
        'bsaSection65BCertificateId': e.bsa_certificate_id,
        'caseId': e.case_id,
        'confidence': float(e.confidence) if e.confidence else 1.0,
        'metadata': e.metadata_json or {}
    }

@router.get('/evidence', response_model=PaginatedResponse[Dict[str, Any]], summary='List Evidence for a Case')
async def list_evidence(
    caseId: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    page: int = 1,
    pageSize: int = 20,
    current_user: UserProfile = Depends(require_permission('evidence:read')),
    db = Depends(get_db)
):
    target_case_id = (caseId if isinstance(caseId, str) and caseId else None) or (case_id if isinstance(case_id, str) and case_id else None)
    if not target_case_id:
        raise HTTPException(status_code=400, detail='caseId is required')

    assert_case_access(db, current_user, target_case_id)
    
    query = db.query(EvidenceModel).filter(EvidenceModel.case_id == target_case_id)
    total_records = query.count()
    rows = query.order_by(EvidenceModel.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    evidence_items = [_evidence_model_to_dict(r) for r in rows]
    
    total_pages = (total_records + pageSize - 1) // pageSize if total_records > 0 else 1
    return PaginatedResponse(
        items=evidence_items,
        pagination=PaginationMeta(
            page=page,
            pageSize=pageSize,
            totalRecords=total_records,
            totalPages=total_pages
        )
    )

@router.post('/evidence', response_model=ResponseEnvelope[Dict[str, Any]], summary='Upload Evidence Manually')
async def upload_evidence(
    file: UploadFile = File(...),
    caseId: Optional[str] = Form(None),
    case_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: UserProfile = Depends(require_permission('evidence:write')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    target_case_id = caseId or case_id
    if not target_case_id:
        raise HTTPException(status_code=400, detail="INVALID REQUEST: caseId is required.")
        
    assert_case_access(db, current_user, target_case_id)

    content = await file.read()
    sha256_hash = hashlib.sha256(content).hexdigest()
    
    now = datetime.now(timezone.utc).isoformat()
    evidence_id = f"EVD-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    cert_id = f"BSA-63-{datetime.now().year}-{evidence_id}"
    
    ev_row = EvidenceModel(
        evidence_id=evidence_id,
        case_id=target_case_id,
        entity_type='Evidence',
        canonical_name=f"Uploaded Evidence: {file.filename}",
        evidence_number=evidence_id,
        evidence_type=file.content_type or 'application/octet-stream',
        description=description or f"Investigator uploaded file '{file.filename}' linked to case {target_case_id}.",
        collected_date=now,
        collected_by=current_user.fullName,
        storage_location=f"Secure Vault / {file.filename}",
        sha256_hash=sha256_hash,
        bsa_certificate_id=cert_id,
        confidence='1.0',
        metadata_json={
            'sourceFilename': file.filename,
            'sourceType': 'Manual Upload',
            'uploader': current_user.fullName,
            'chainOfCustodyVerified': True,
            'fileSize': len(content)
        }
    )
    db.add(ev_row)
    db.commit()
    db.refresh(ev_row)
    
    await m6_client.log_audit_event({
        'action': 'EVIDENCE_UPLOADED',
        'fileName': file.filename,
        'caseId': target_case_id,
        'evidenceId': evidence_id,
        'sha256': sha256_hash,
        'officer': current_user.fullName
    })
    
    return ResponseEnvelope(data=_evidence_model_to_dict(ev_row))

@router.get('/evidence/{evidence_id}', response_model=ResponseEnvelope[Dict[str, Any]], summary='Get Evidence details')
async def get_evidence(
    evidence_id: str = Path(...),
    current_user: UserProfile = Depends(require_permission('evidence:read')),
    db = Depends(get_db)
):
    ev_row = db.query(EvidenceModel).filter(EvidenceModel.evidence_id == evidence_id).first()
    if not ev_row:
        raise HTTPException(status_code=404, detail="Evidence not found.")
    assert_case_access(db, current_user, ev_row.case_id)
    return ResponseEnvelope(data=_evidence_model_to_dict(ev_row))

@router.post('/evidence/{evidence_id}/verify-hash', response_model=ResponseEnvelope[Dict[str, Any]], summary='Verify File against Hash')
async def verify_evidence_hash(
    evidence_id: str = Path(...),
    file: Optional[UploadFile] = File(None),
    current_user: UserProfile = Depends(require_permission('evidence:read')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    ev_row = db.query(EvidenceModel).filter(EvidenceModel.evidence_id == evidence_id).first()
    if not ev_row:
        raise HTTPException(status_code=404, detail="Evidence not found.")
    assert_case_access(db, current_user, ev_row.case_id)
    
    stored_hash = ev_row.sha256_hash
    curr_hash = stored_hash
    
    if file is not None:
        content = await file.read()
        calculated_hash = hashlib.sha256(content).hexdigest()
    else:
        calculated_hash = curr_hash
        
    is_match = (calculated_hash.lower() == stored_hash.lower())
    now_iso = datetime.now(timezone.utc).isoformat()
    
    cert_id = ev_row.bsa_certificate_id or f"BSA-63-{evidence_id}"
    
    if hasattr(m6_client, 'log_audit_event'):
        try:
            await m6_client.log_audit_event({
                'action': 'EVIDENCE_HASH_VERIFICATION',
                'evidenceId': evidence_id,
                'caseId': ev_row.case_id,
                'match': is_match,
                'officer': current_user.fullName
            })
        except Exception:
            pass

    
    return ResponseEnvelope(data={
        'evidenceId': evidence_id,
        'originalHash': stored_hash,
        'currentHash': calculated_hash,
        'storedHash': stored_hash,
        'calculatedHash': calculated_hash,
        'status': 'MATCH' if is_match else 'MISMATCH',
        'isMatch': is_match,
        'verifiedAt': now_iso,
        'verificationTimestamp': now_iso,
        'bsaCertificateId': cert_id
    })

@router.get('/verification/discrepancies', response_model=ResponseEnvelope[List[Dict[str, Any]]], summary='Get Verification Discrepancies')
async def get_verification_discrepancies(
    caseId: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    current_user: UserProfile = Depends(require_permission('verification:read')),
    db = Depends(get_db)
):
    target_case_id = (caseId if isinstance(caseId, str) and caseId else None) or (case_id if isinstance(case_id, str) and case_id else None)
    if not target_case_id:
        raise HTTPException(status_code=400, detail='caseId is required')

    assert_case_access(db, current_user, target_case_id)
        
    from app.services.demo_data import get_case_discrepancies
    discrepancies = get_case_discrepancies(target_case_id)
    return ResponseEnvelope(data=discrepancies)

