from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user, require_permission
from app.schemas.alerts import AlertResponse, AlertFilterRequest, AlertAcknowledgeRequest
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta

router = APIRouter(prefix='/alerts', tags=['Real-Time Network Alerts'])

# In-memory repository for alerts across all demo & dataset cases
DEFAULT_ALERTS: List[Dict[str, Any]] = [
    # CASE-2025-M3-DATASET (National Contraband & Communications Syndicate)
    {
        "alertId": "ALT-M3-001",
        "alertType": "Communication Pattern",
        "severity": "CRITICAL",
        "title": "High-Frequency Pre-Transit Call Burst Intercepted",
        "description": "14 short-duration encrypted voice calls recorded between P00004 and P00005 within a 45-minute window preceding suspected contraband shipment dispatch.",
        "relatedEntityId": "P00004",
        "relatedEntityName": "Person_00004 (Syndicate Courier Lead)",
        "caseId": "CASE-2025-M3-DATASET",
        "evidenceId": "EVD-2025-M3-01",
        "status": "UNRESOLVED",
        "triggeredAt": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
        "metadata": {
            "source": "M3 Telecom Carrier Feed & CDR Analyzer",
            "category": "New Communication Pattern",
            "linkedEntities": [
                {"id": "P00004", "label": "P00004 (Logistics)", "type": "Person"},
                {"id": "P00005", "label": "P00005 (Handler)", "type": "Person"}
            ]
        }
    },
    {
        "alertId": "ALT-M3-002",
        "alertType": "Cross-source Contradiction",
        "severity": "HIGH",
        "title": "Cross-Source Tower Geolocation Contradiction",
        "description": "Cellular tower sector azimuth places handset (+91-98201-44912) at Cargo Terminal 2, whereas regional police checkpoint log records suspect claiming physical presence at Sector 4.",
        "relatedEntityId": "P00004",
        "relatedEntityName": "Person_00004 (Suspect Device)",
        "caseId": "CASE-2025-M3-DATASET",
        "evidenceId": "EVD-2025-M3-02",
        "status": "UNRESOLVED",
        "triggeredAt": (datetime.now(timezone.utc) - timedelta(hours=7)).isoformat(),
        "metadata": {
            "source": "M6 Cross-Verification Forensic Engine",
            "category": "Cross-source Contradiction",
            "linkedEntities": [
                {"id": "P00004", "label": "P00004 (Courier)", "type": "Person"}
            ]
        }
    },
    {
        "alertId": "ALT-M3-003",
        "alertType": "Unusual Transaction Pattern",
        "severity": "HIGH",
        "title": "Layering & Smurfing Transaction Velocity Spike",
        "description": "INR 18,50,000 dispersed across 4 intermediary bank accounts (including ACC-90218821) in under 12 minutes, indicative of automated money laundering layering under PMLA §3.",
        "relatedEntityId": "ACC-90218821",
        "relatedEntityName": "ICICI Mule Account #8821",
        "caseId": "CASE-2025-M3-DATASET",
        "evidenceId": "EVD-2025-M3-03",
        "status": "UNRESOLVED",
        "triggeredAt": (datetime.now(timezone.utc) - timedelta(hours=14)).isoformat(),
        "metadata": {
            "source": "M5 Financial Graph Analytics Engine",
            "category": "Unusual Transaction Pattern",
            "linkedEntities": [
                {"id": "ACC-90218821", "label": "ACC-90218821", "type": "BankAccount"},
                {"id": "P00008", "label": "P00008 (Receiver)", "type": "Person"}
            ]
        }
    },

    # CASE-VIDEO-001 (Financial Hawala Syndicate)
    {
        "alertId": "ALT-V1-001",
        "alertType": "Unusual Transaction Pattern",
        "severity": "CRITICAL",
        "title": "Multi-Hop RTGS Hawala Inflow Surge",
        "description": "Surge of INR 45,00,000 channeled into HDFC account #99214430 from 6 unrelated shell corporate entities followed by immediate overseas outward wire request.",
        "relatedEntityId": "ACC-HDFC-9921",
        "relatedEntityName": "HDFC Aggregator #99214430",
        "caseId": "CASE-VIDEO-001",
        "evidenceId": "EVD-VIDEO-001",
        "status": "UNRESOLVED",
        "triggeredAt": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
        "metadata": {
            "source": "M5 Graph Anomaly Detection",
            "category": "Unusual Transaction Pattern",
            "linkedEntities": [
                {"id": "ACC-HDFC-9921", "label": "ACC-99214430", "type": "BankAccount"},
                {"id": "P00101", "label": "Person_00101", "type": "Person"}
            ]
        }
    },
    {
        "alertId": "ALT-V1-002",
        "alertType": "Watchlist Match",
        "severity": "HIGH",
        "title": "Target Watchlist Active Match - Designated Hawala Operator",
        "description": "Entity P00101 enrolled in ED Watchlist surfaced as ultimate beneficial signatory for newly registered offshore entity.",
        "relatedEntityId": "P00101",
        "relatedEntityName": "Person_00101 (Hawala Booker)",
        "caseId": "CASE-VIDEO-001",
        "evidenceId": "EVD-VIDEO-001-B",
        "status": "UNRESOLVED",
        "triggeredAt": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
        "metadata": {
            "source": "M3 Target Surveillance Matcher",
            "category": "Watchlist Match",
            "linkedEntities": [
                {"id": "P00101", "label": "P00101", "type": "Person"}
            ]
        }
    },

    # CASE-VIDEO-002 (Narcotics Trafficking Cartel)
    {
        "alertId": "ALT-V2-001",
        "alertType": "Communication Pattern",
        "severity": "CRITICAL",
        "title": "Encrypted Satellite Intercept on Coastal Landing Corridor",
        "description": "Satellite communicator SAT-THURAYA-881 registered burst data telemetry at 02:40 AM coinciding with maritime AIS vessel transponder deactivation.",
        "relatedEntityId": "SAT-THURAYA-881",
        "relatedEntityName": "Thuraya Handset #881",
        "caseId": "CASE-VIDEO-002",
        "evidenceId": "EVD-VIDEO-002",
        "status": "UNRESOLVED",
        "triggeredAt": (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat(),
        "metadata": {
            "source": "Coast Guard & M3 Telecom Intercept Feed",
            "category": "New Communication Pattern",
            "linkedEntities": [
                {"id": "P00201", "label": "P00201 (Maritime Pilot)", "type": "Person"}
            ]
        }
    },
    {
        "alertId": "ALT-V2-002",
        "alertType": "Evidence Integrity Mismatch",
        "severity": "HIGH",
        "title": "Evidence Hash Ledger Verification Passed",
        "description": "Routine automated re-hash check confirmed zero bitrot or tampering on 14GB audio intercept payload. Genesis hash validated under BSA §63.",
        "relatedEntityId": "EVD-VIDEO-002",
        "relatedEntityName": "Evidence #EVD-VIDEO-002",
        "caseId": "CASE-VIDEO-002",
        "evidenceId": "EVD-VIDEO-002",
        "status": "RESOLVED",
        "triggeredAt": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat(),
        "metadata": {
            "source": "M6 Cryptographic Ledger Service",
            "category": "Evidence Integrity Mismatch",
            "linkedEntities": []
        }
    },

    # CASE-VIDEO-003 (Cyber Fraud & Phishing Syndicate)
    {
        "alertId": "ALT-V3-001",
        "alertType": "Watchlist Match",
        "severity": "CRITICAL",
        "title": "C2 Phishing Domain Infrastructure Link Discovered",
        "description": "Host IP 198.51.100.42 detected communicating with 12 mule bank accounts, matching blacklisted CERT-In malicious spoofing hashes.",
        "relatedEntityId": "P00301",
        "relatedEntityName": "Person_00301 (Mule Recruiter)",
        "caseId": "CASE-VIDEO-003",
        "evidenceId": "EVD-VIDEO-003",
        "status": "UNRESOLVED",
        "triggeredAt": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        "metadata": {
            "source": "M5 Cyber Threat Intelligence Graph",
            "category": "Watchlist Match",
            "linkedEntities": [
                {"id": "P00301", "label": "P00301", "type": "Person"}
            ]
        }
    },

    # CASE-VIDEO-004 (Human Trafficking Ring)
    {
        "alertId": "ALT-V4-001",
        "alertType": "Cross-source Contradiction",
        "severity": "CRITICAL",
        "title": "Immigration Gate Passport ID Sequence Contradiction",
        "description": "Passport serial #PASSPORT-Z992144 logged at Land Customs Station while biometric database reports same identity currently detained in state custody.",
        "relatedEntityId": "P00401",
        "relatedEntityName": "Person_00401 (Safehouse Custodian)",
        "caseId": "CASE-VIDEO-004",
        "evidenceId": "EVD-VIDEO-004",
        "status": "UNRESOLVED",
        "triggeredAt": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(),
        "metadata": {
            "source": "Bureau of Immigration & M6 Cross-Verification",
            "category": "Cross-source Contradiction",
            "linkedEntities": [
                {"id": "P00401", "label": "P00401", "type": "Person"}
            ]
        }
    }
]

# Live in-memory alerts registry
LIVE_ALERTS: List[Dict[str, Any]] = list(DEFAULT_ALERTS)


from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException, Path
from app.dependencies import get_current_user, require_permission, assert_case_access
from app.database import get_db
from app.models import AlertModel
from app.schemas.alerts import AlertResponse, AlertFilterRequest, AlertAcknowledgeRequest, AlertMarkReadRequest
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta

router = APIRouter(prefix='/alerts', tags=['Real-Time Network Alerts'])

def _alert_model_to_dict(a: AlertModel) -> Dict[str, Any]:
    return {
        'alertId': a.alert_id,
        'alertType': a.alert_type,
        'severity': a.severity,
        'title': a.title,
        'description': a.description,
        'relatedEntityId': a.related_entity_id,
        'relatedEntityName': a.related_entity_name,
        'caseId': a.case_id,
        'evidenceId': a.evidence_id,
        'status': a.status,
        'isRead': getattr(a, 'is_read', False),
        'triggeredAt': a.triggered_at.isoformat() if a.triggered_at else datetime.now(timezone.utc).isoformat(),
        'metadata': a.metadata_json or {}
    }

@router.get('', response_model=PaginatedResponse[AlertResponse], summary='List Network Alerts')
async def list_alerts(
    alertType: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    caseId: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(require_permission('alert:read')),
    db = Depends(get_db)
):
    target_case = (caseId if isinstance(caseId, str) and caseId else None) or (case_id if isinstance(case_id, str) and case_id else None)

    query = db.query(AlertModel)
    if target_case:
        assert_case_access(db, current_user, target_case)
        query = query.filter(AlertModel.case_id == target_case)
    elif current_user.grantedRole != 'ADMIN':
        from app.models import CaseMembershipModel
        memberships = db.query(CaseMembershipModel.case_id).filter(CaseMembershipModel.user_email.ilike(current_user.email)).all()
        allowed = {row[0] for row in memberships}
        query = query.filter(AlertModel.case_id.in_(allowed))

    if severity and severity.upper() != 'ALL':
        query = query.filter(AlertModel.severity.ilike(severity))
    if status and status.upper() != 'ALL':
        query = query.filter(AlertModel.status.ilike(status))
    if alertType and alertType.upper() != 'ALL':
        query = query.filter(AlertModel.alert_type.ilike(f'%{alertType}%'))

    total = query.count()
    rows = query.order_by(AlertModel.triggered_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    items = [AlertResponse(**_alert_model_to_dict(a)) for a in rows]
    pages = max(1, (total + pageSize - 1) // pageSize)

    return PaginatedResponse(
        items=items,
        pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages)
    )

@router.post('/{alertId}/acknowledge', response_model=ResponseEnvelope[AlertResponse], summary='Acknowledge / Resolve Alert')
async def acknowledge_alert(
    alertId: str = Path(...),
    ack: AlertAcknowledgeRequest = ...,
    current_user: UserProfile = Depends(require_permission('alert:manage')),
    db = Depends(get_db)
):
    alert = db.query(AlertModel).filter(AlertModel.alert_id == alertId).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
        
    assert_case_access(db, current_user, alert.case_id)

    alert.status = ack.status or "RESOLVED"
    meta = dict(alert.metadata_json or {})
    meta['reviewedBy'] = current_user.fullName
    meta['reviewedAt'] = datetime.now(timezone.utc).isoformat()
    meta['reviewNotes'] = ack.resolutionNotes or "Corroborated with case diary logs."
    alert.metadata_json = meta
    db.commit()
    db.refresh(alert)

    return ResponseEnvelope(data=AlertResponse(**_alert_model_to_dict(alert)))

@router.get('/unread_count', summary='Count Unread Alerts')
async def get_unread_count(
    current_user: UserProfile = Depends(require_permission('alert:read')),
    db = Depends(get_db)
):
    query = db.query(AlertModel).filter(AlertModel.is_read == False)
    if current_user.grantedRole != 'ADMIN':
        from app.models import CaseMembershipModel
        memberships = db.query(CaseMembershipModel.case_id).filter(CaseMembershipModel.user_email.ilike(current_user.email)).all()
        allowed = {row[0] for row in memberships}
        query = query.filter(AlertModel.case_id.in_(allowed))

    count = query.count()
    return {"count": count}

@router.post('/mark_read', summary='Mark Alerts as Read')
async def mark_alerts_read(
    req: Optional[AlertMarkReadRequest] = None,
    current_user: UserProfile = Depends(require_permission('alert:manage')),
    db = Depends(get_db)
):
    query = db.query(AlertModel).filter(AlertModel.is_read == False)
    if current_user.grantedRole != 'ADMIN':
        from app.models import CaseMembershipModel
        memberships = db.query(CaseMembershipModel.case_id).filter(CaseMembershipModel.user_email.ilike(current_user.email)).all()
        allowed = {row[0] for row in memberships}
        query = query.filter(AlertModel.case_id.in_(allowed))

    if req and req.alertIds:
        query = query.filter(AlertModel.alert_id.in_(req.alertIds))

    alerts_to_update = query.all()
    for alert in alerts_to_update:
        alert.is_read = True
    
    db.commit()
    return {"success": True, "updated": len(alerts_to_update)}
