from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_permission
from app.exceptions import AuthorizationError, ResourceNotFoundError
from app.models import AccessRequestModel, UserProfileModel
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client

router = APIRouter(prefix='/access-requests', tags=['Access & Clearance Requests'])

class AccessRequestCreate(BaseModel):
    requestedRole: Optional[str] = None
    requested_role: Optional[str] = None
    role: Optional[str] = None
    reason: Optional[str] = None
    justification: Optional[str] = None
    warrantRef: Optional[str] = None
    warrant_ref: Optional[str] = None
    assignedCaseId: Optional[str] = None
    assigned_case_id: Optional[str] = None
    assignedCaseTitle: Optional[str] = None
    assigned_case_title: Optional[str] = None
    department: Optional[str] = None
    officerName: Optional[str] = None
    officer_name: Optional[str] = None
    badgeNumber: Optional[str] = None
    badge_number: Optional[str] = None
    userEmail: Optional[str] = None
    user_email: Optional[str] = None
    email: Optional[str] = None
    userId: Optional[str] = None
    user_id: Optional[str] = None
    phone: Optional[str] = None

class RejectRequest(BaseModel):
    reason: Optional[str] = None

def _model_to_dict(req: AccessRequestModel) -> Dict[str, Any]:
    role = (req.requested_role or 'INVESTIGATOR').upper()
    clearance = (
        'LEVEL 3 (TOP SECRET)' if role in ('ADMIN', 'INVESTIGATOR')
        else 'LEVEL 2 (CONFIDENTIAL)' if role == 'ANALYST'
        else 'LEVEL 1 (RESTRICTED)'
    )
    return {
        'id': req.id,
        'userId': req.user_id,
        'userEmail': req.user_email,
        'email': req.user_email,
        'officerName': req.officer_name or (req.user_email.split('@')[0].replace('.', ' ').title() if req.user_email else 'Officer'),
        'badgeNumber': req.badge_number or 'LEO-7729',
        'department': req.department or 'CrimeNet State Bureau',
        'phone': '+91 98201 55412',
        'requestedRole': role,
        'clearanceLevel': clearance,
        'status': (req.status or 'PENDING').upper(),
        'reason': req.reason or 'Field operational necessity under BNSS §94',
        'justification': req.reason or 'Field operational necessity under BNSS §94',
        'warrantRef': req.warrant_ref or 'WARRANT-PENDING',
        'assignedCaseId': req.assigned_case_id or 'CASE-2025-M3-DATASET',
        'assignedCaseTitle': req.assigned_case_title or 'National Contraband & Financial Intercept',
        'reviewedBy': req.reviewed_by,
        'reviewedAt': req.reviewed_at.isoformat() if req.reviewed_at else None,
        'submittedAt': req.created_at.strftime('%Y-%m-%d %H:%M IST') if req.created_at else 'Just now',
        'createdAt': req.created_at.isoformat() if req.created_at else None,
        'requestedPermissions': (
            ['case:write', 'evidence:write', 'graph:read', 'timeline:read'] if role == 'INVESTIGATOR'
            else ['graph:read', 'analytics:read', 'timeline:read'] if role == 'ANALYST'
            else ['audit:read', 'timeline:read', 'verification:read', 'report:generate'] if role == 'AUDITOR'
            else ['dashboard:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read', 'evidence:write', 'verification:read', 'report:generate', 'audit:read', 'admin:write']
        )
    }

def _seed_initial_requests(db: Session):
    existing = db.query(AccessRequestModel).count()
    if existing > 0:
        return

    seeds = [
        AccessRequestModel(
            id='REQ-2026-0891',
            user_id='usr-pooja-verma',
            user_email='pooja.verma@mumbaipolice.gov.in',
            officer_name='Sub-Inspector Pooja Verma',
            badge_number='LEO-8841',
            department='Cyber Crime Investigation Cell (Bandra Kurla Complex)',
            requested_role='INVESTIGATOR',
            status='pending',
            reason='Appointed as Investigating Officer for seizing overseas Frankfurt Tor exit relay traffic and Telegram phishing bot tokens under Section 94 of Bharatiya Nagarik Suraksha Sanhita (BNSS). Requires Evidence Write and Graph Analysis clearance.',
            warrant_ref='Chief Metropolitan Magistrate Subpoena #CR-2026-CY-991',
            assigned_case_id='CASE-VIDEO-003',
            assigned_case_title='Operation DarkByte - Cyber Banking Phishing Syndicate'
        ),
        AccessRequestModel(
            id='REQ-2026-0892',
            user_id='usr-anand-kulkarni',
            user_email='anand.kulkarni@gov.in',
            officer_name='ACP Anand Kulkarni',
            badge_number='LEO-3104',
            department='Anti-Narcotics Control Bureau (ANC Coastal Maritime Wing)',
            requested_role='INVESTIGATOR',
            status='pending',
            reason='Coordinating high-seas maritime interdiction with Indian Coast Guard. Requires telecom handover decryption, vessel AIS radar telemetry cross-verification, and emergency suspect watchlist alerting under NDPS Section 67.',
            warrant_ref='NDPS Special Court Urgent Warrant #NCB-WZ-402',
            assigned_case_id='CASE-VIDEO-002',
            assigned_case_title='Operation White Dust - Coastal Maritime Narcotics Intercept'
        ),
        AccessRequestModel(
            id='REQ-2026-0893',
            user_id='usr-meera-sen',
            user_email='meera.sen@cfsl.gov.in',
            officer_name='Senior Forensic Scientist Meera Sen',
            badge_number='CIV-9022',
            department='Central Forensic Science Laboratory (CFSL Digital Forensics)',
            requested_role='ANALYST',
            status='pending',
            reason='Tasked with verifying bitstream physical image integrity of seized OnePlus 11 mobile hardware clone. Requires read access to M6 Cryptographic SHA-256 Ledger and Section 65B electronic record hash validation.',
            warrant_ref='Panchnama Requisition #EVD-2025-M3-01 / Panchnama #09',
            assigned_case_id='CASE-2025-M3-DATASET',
            assigned_case_title='Nhava Sheva Port Contraband Intercept'
        ),
        AccessRequestModel(
            id='REQ-2026-0894',
            user_id='usr-vikram-rathore',
            user_email='v.rathore@statepolice.gov.in',
            officer_name='DySP Vikram Rathore',
            badge_number='LEO-5510',
            department='Anti-Human Trafficking Unit (AHTU State Special Operations Cell)',
            requested_role='INVESTIGATOR',
            status='approved',
            reviewed_by='admin123@gov.in (Admin Command)',
            reviewed_at=datetime.now(timezone.utc),
            reason='Supervising highway checkpost raids along NH4 corridor. Granted temporary emergency clearance for Fastag toll camera ingestion and vehicle GPS tracker triangulation.',
            warrant_ref='High Court Special Leave Warrant #SLP-881',
            assigned_case_id='CASE-VIDEO-004',
            assigned_case_title='Operation Iron Shield - Highway Transit Route Intercept'
        )
    ]
    try:
        db.add_all(seeds)
        db.commit()
    except Exception as e:
        db.rollback()

@router.get('', summary='List Access & Clearance Requests')
async def list_access_requests(
    status_filter: Optional[str] = Query(None, alias='status'),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _seed_initial_requests(db)
    
    query = db.query(AccessRequestModel)
    
    # If not admin, only show own requests
    if current_user.grantedRole != 'ADMIN':
        query = query.filter(AccessRequestModel.user_email.ilike(current_user.email))
    elif status_filter and status_filter.upper() != 'ALL':
        query = query.filter(AccessRequestModel.status.ilike(status_filter))
        
    requests = query.order_by(AccessRequestModel.created_at.desc()).all()
    return ResponseEnvelope(data=[_model_to_dict(r) for r in requests])

@router.post('', summary='Submit Role Clearance Request')
async def create_access_request(
    req_in: AccessRequestCreate,
    authorization: Optional[str] = Header(None, description='Bearer JWT token'),
    db: Session = Depends(get_db),
    m6_client: M6SecurityClient = Depends(get_m6_client)
):
    current_user: Optional[UserProfile] = None
    if authorization:
        try:
            token = authorization.replace('Bearer ', '').strip()
            current_user = await m6_client.verify_token(token)
        except Exception:
            current_user = None

    email = (
        (current_user.email if current_user else None) or
        req_in.user_email or
        req_in.userEmail or
        req_in.email
    )
    if not email:
        raise HTTPException(status_code=400, detail='User email is required to submit an access request')

    role_raw = req_in.requested_role or req_in.requestedRole or req_in.role or 'INVESTIGATOR'
    role_normalized = role_raw.upper()
    if role_normalized not in ['ADMIN', 'INVESTIGATOR', 'ANALYST', 'AUDITOR']:
        role_normalized = 'INVESTIGATOR'

    user_id = (
        (current_user.userId if current_user else None) or
        req_in.user_id or
        req_in.userId or
        f"usr-{uuid.uuid4().hex[:8]}"
    )
    officer_name = (
        req_in.officer_name or
        req_in.officerName or
        (current_user.fullName if current_user else None) or
        email.split('@')[0].replace('.', ' ').title()
    )
    badge_number = (
        req_in.badge_number or
        req_in.badgeNumber or
        (current_user.badgeNumber if current_user else None) or
        f"LEO-{uuid.uuid4().hex[:4].upper()}"
    )
    department = (
        req_in.department or
        (current_user.agencyUnit if current_user else None) or
        'CrimeNet State Bureau'
    )
    reason = (
        req_in.reason or
        req_in.justification or
        f'New user enrolment / access clearance for {email}'
    )
    warrant_ref = (
        req_in.warrant_ref or
        req_in.warrantRef or
        'ENROLMENT-VERIFICATION-PENDING'
    )
    assigned_case_id = (
        req_in.assigned_case_id or
        req_in.assignedCaseId or
        'CASE-2025-M3-DATASET'
    )
    assigned_case_title = (
        req_in.assigned_case_title or
        req_in.assignedCaseTitle or
        'Operation Falcon Web - Contraband Intercept'
    )

    req_id = f"REQ-2026-{uuid.uuid4().hex[:4].upper()}"
    new_req = AccessRequestModel(
        id=req_id,
        user_id=user_id,
        user_email=email,
        officer_name=officer_name,
        badge_number=badge_number,
        department=department,
        requested_role=role_normalized,
        status='pending',
        reason=reason,
        warrant_ref=warrant_ref,
        assigned_case_id=assigned_case_id,
        assigned_case_title=assigned_case_title
    )
    
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    try:
        await m6_client.log_audit_event({
            'action': 'ACCESS_REQUEST_SUBMITTED',
            'requestId': req_id,
            'user': email,
            'requestedRole': role_normalized
        })
    except Exception as audit_err:
        print("Audit notice on request submit:", audit_err)
    
    return ResponseEnvelope(data=_model_to_dict(new_req))

@router.post('/{request_id}/approve', summary='Approve Access Request and Grant Role')
async def approve_access_request(
    request_id: str,
    current_user: UserProfile = Depends(require_permission('admin:write')),
    db: Session = Depends(get_db),
    m6_client: M6SecurityClient = Depends(get_m6_client)
):
    req = db.query(AccessRequestModel).filter(AccessRequestModel.id == request_id).first()
    if not req:
        raise ResourceNotFoundError('AccessRequest', request_id)
        
    target_role = req.requested_role.upper()
    req.status = 'approved'
    req.reviewed_by = f"{current_user.fullName or current_user.email} (Administrator)"
    req.reviewed_at = datetime.now(timezone.utc)
    
    # 1. Authoritative Role Promotion in local UserProfileModel
    db_profile = db.query(UserProfileModel).filter(UserProfileModel.email.ilike(req.user_email)).first()
    if not db_profile:
        db_profile = UserProfileModel(
            email=req.user_email,
            role=target_role,
            is_active=True
        )
        db.add(db_profile)
    else:
        db_profile.role = target_role
        db_profile.is_active = True
        
    db.commit()
    db.refresh(req)

    # 2. Update auth.users in Supabase Postgres directly
    try:
        from sqlalchemy import text
        db.execute(text("""
            UPDATE auth.users
            SET 
                raw_user_meta_data = jsonb_set(
                    COALESCE(raw_user_meta_data, '{}'::jsonb),
                    '{role}',
                    to_jsonb(:role::text)
                ),
                raw_app_meta_data = jsonb_set(
                    COALESCE(raw_app_meta_data, '{}'::jsonb),
                    '{role}',
                    to_jsonb(:role::text)
                )
            WHERE LOWER(email) = LOWER(:email)
        """), {"role": target_role, "email": req.user_email})
        db.commit()
    except Exception as sql_err:
        print("Notice: Direct auth.users metadata sync exception:", sql_err)
    
    # 3. Tamper-evident Audit log
    try:
        await m6_client.log_audit_event({
            'action': 'ROLE_GRANTED_APPROVED',
            'requestId': request_id,
            'targetUser': req.user_email,
            'grantedRole': target_role,
            'approvedBy': current_user.email,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    except Exception as audit_err:
        print("Audit notice on request approve:", audit_err)
    
    return ResponseEnvelope(
        data=_model_to_dict(req),
        message=f"Access request {request_id} approved. Target user {req.user_email} granted {target_role} role."
    )

@router.post('/{request_id}/reject', summary='Reject Access Request')
async def reject_access_request(
    request_id: str,
    body: RejectRequest = None,
    current_user: UserProfile = Depends(require_permission('admin:write')),
    db: Session = Depends(get_db),
    m6_client: M6SecurityClient = Depends(get_m6_client)
):
    req = db.query(AccessRequestModel).filter(AccessRequestModel.id == request_id).first()
    if not req:
        raise ResourceNotFoundError('AccessRequest', request_id)
        
    req.status = 'rejected'
    req.reviewed_by = f"{current_user.fullName or current_user.email} (Administrator)"
    req.reviewed_at = datetime.now(timezone.utc)
    if body and body.reason:
        req.reason = f"{req.reason}\n[Rejection Note: {body.reason}]"
        
    db.commit()
    db.refresh(req)
    
    await m6_client.log_audit_event({
        'action': 'ROLE_REQUEST_REJECTED',
        'requestId': request_id,
        'targetUser': req.user_email,
        'rejectedBy': current_user.email,
        'reason': body.reason if body else 'Clearance criteria not met'
    })
    
    return ResponseEnvelope(
        data=_model_to_dict(req),
        message=f"Access request {request_id} rejected."
    )

@router.get('/users/manifest', summary='Admin User Management List')
async def list_admin_users(
    current_user: UserProfile = Depends(require_permission('admin:write')),
    db: Session = Depends(get_db)
):
    profiles = db.query(UserProfileModel).all()
    user_list = []
    seen_emails = set()
    
    for p in profiles:
        seen_emails.add(p.email.lower())
        user_list.append({
            'id': f"USR-{p.id:03d}",
            'email': p.email,
            'name': p.email.split('@')[0].replace('.', ' ').title(),
            'badgeNumber': f"LEO-{1000 + p.id}",
            'role': p.role.upper(),
            'unit': 'CrimeNet State Bureau',
            'status': 'ACTIVE' if p.is_active else 'RESTRICTED',
            'lastLogin': 'Recent Active Session',
            'permissions': (
                ['dashboard:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read', 'evidence:write', 'verification:read', 'report:generate', 'audit:read', 'admin:write']
                if p.role.upper() == 'ADMIN'
                else ['dashboard:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read', 'evidence:write', 'verification:read', 'report:generate']
                if p.role.upper() == 'INVESTIGATOR'
                else ['dashboard:read', 'graph:read', 'analytics:read', 'timeline:read', 'verification:read', 'report:generate']
                if p.role.upper() == 'ANALYST'
                else ['dashboard:read', 'timeline:read', 'verification:read', 'report:generate', 'audit:read']
            )
        })
        
    return ResponseEnvelope(data=user_list)
