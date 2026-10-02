import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from app.dependencies import get_current_user, require_permission
from app.dependencies import assert_case_access
from app.database import get_db
from app.models import WatchlistModel
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.schemas.watchlist import WatchlistAddRequest, WatchlistRemoveRequest, WatchlistItemResponse

router = APIRouter(prefix='/watchlist', tags=['Target Watchlist Management'])

DEFAULT_WATCHLIST: List[Dict[str, Any]] = [
    # CASE-2025-M3-DATASET (National Contraband & Communications Syndicate)
    {
        'watchId': 'WCH-M3-001',
        'entityType': 'Person',
        'identifierValue': 'P00004',
        'canonicalName': 'Person_00004 (Syndicate Courier Lead)',
        'reason': 'Central coordination node in inter-state contraband movement; high call density prior to shipment.',
        'priority': 'critical',
        'caseId': 'CASE-2025-M3-DATASET',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-01-10T08:30:00Z',
        'isActive': True,
        'matchCount': 14
    },
    {
        'watchId': 'WCH-M3-002',
        'entityType': 'Phone',
        'identifierValue': '+91-98201-44912',
        'canonicalName': 'Burner MSISDN #44912',
        'reason': 'Direct cellular link to P00005 handler under BNS §111 telecommunication surveillance.',
        'priority': 'high',
        'caseId': 'CASE-2025-M3-DATASET',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-01-12T11:15:00Z',
        'isActive': True,
        'matchCount': 8
    },
    {
        'watchId': 'WCH-M3-003',
        'entityType': 'BankAccount',
        'identifierValue': 'ACC-90218821',
        'canonicalName': 'ICICI Escrow Mule #8821',
        'reason': 'Suspicious rapid cash withdrawal patterns immediately post-transit events under PMLA §3.',
        'priority': 'high',
        'caseId': 'CASE-2025-M3-DATASET',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-01-15T14:20:00Z',
        'isActive': True,
        'matchCount': 5
    },

    # CASE-VIDEO-001 (Financial Hawala)
    {
        'watchId': 'WCH-V1-001',
        'entityType': 'BankAccount',
        'identifierValue': 'ACC-HDFC-9921',
        'canonicalName': 'HDFC Layering Corp #9921',
        'reason': 'Primary aggregator account receiving smurfed deposits for overseas hawala remittance.',
        'priority': 'critical',
        'caseId': 'CASE-VIDEO-001',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-01-05T09:00:00Z',
        'isActive': True,
        'matchCount': 22
    },
    {
        'watchId': 'WCH-V1-002',
        'entityType': 'Person',
        'identifierValue': 'P00101',
        'canonicalName': 'Person_00101 (Hawala Booker)',
        'reason': 'Enforcement Directorate suspect coordinating off-ledger cash-token compensations.',
        'priority': 'high',
        'caseId': 'CASE-VIDEO-001',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-01-08T10:00:00Z',
        'isActive': True,
        'matchCount': 6
    },

    # CASE-VIDEO-002 (Narcotics Ring)
    {
        'watchId': 'WCH-V2-001',
        'entityType': 'Phone',
        'identifierValue': 'SAT-THURAYA-881',
        'canonicalName': 'Thuraya Satellite Unit #881',
        'reason': 'Encrypted voice packet bursts intercepted along Arabian Sea coastal landing route.',
        'priority': 'critical',
        'caseId': 'CASE-VIDEO-002',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-02-01T12:00:00Z',
        'isActive': True,
        'matchCount': 9
    },
    {
        'watchId': 'WCH-V2-002',
        'entityType': 'Person',
        'identifierValue': 'P00201',
        'canonicalName': 'Person_00201 (Dockside Receiver)',
        'reason': 'Flagged under NDPS Act §29 for organizing off-shore drop vessel rendezvous.',
        'priority': 'high',
        'caseId': 'CASE-VIDEO-002',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-02-03T16:30:00Z',
        'isActive': True,
        'matchCount': 4
    },

    # CASE-VIDEO-003 (Cyber Fraud)
    {
        'watchId': 'WCH-V3-001',
        'entityType': 'Alias',
        'identifierValue': '198.51.100.42',
        'canonicalName': 'C2 Phish Proxy Node',
        'reason': 'Active backend proxy hosting fake net-banking credential phishing panels.',
        'priority': 'critical',
        'caseId': 'CASE-VIDEO-003',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-02-10T14:00:00Z',
        'isActive': True,
        'matchCount': 31
    },
    {
        'watchId': 'WCH-V3-002',
        'entityType': 'Person',
        'identifierValue': 'P00301',
        'canonicalName': 'Person_00301 (Mule Recruiter)',
        'reason': 'Recruits college students to open KYC-verified current accounts for cyber proceeds.',
        'priority': 'high',
        'caseId': 'CASE-VIDEO-003',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-02-12T17:45:00Z',
        'isActive': True,
        'matchCount': 12
    },

    # CASE-VIDEO-004 (Human Trafficking)
    {
        'watchId': 'WCH-V4-001',
        'entityType': 'Person',
        'identifierValue': 'P00401',
        'canonicalName': 'Person_00401 (Safehouse Custodian)',
        'reason': 'Operates intermediate staging safehouses and handles forged departure stamps.',
        'priority': 'critical',
        'caseId': 'CASE-VIDEO-004',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-03-01T09:30:00Z',
        'isActive': True,
        'matchCount': 7
    },
    {
        'watchId': 'WCH-V4-002',
        'entityType': 'Alias',
        'identifierValue': 'PASSPORT-Z992144',
        'canonicalName': 'Counterfeit Passport Serial #Z992144',
        'reason': 'Intercepted duplicate travel document utilized for illegal border crossings.',
        'priority': 'high',
        'caseId': 'CASE-VIDEO-004',
        'addedBy': 'Inspector Sharma (LEO-7729)',
        'addedAt': '2026-03-02T13:20:00Z',
        'isActive': True,
        'matchCount': 3
    }
]

LIVE_WATCHLIST: List[Dict[str, Any]] = list(DEFAULT_WATCHLIST)


@router.post('', response_model=ResponseEnvelope[WatchlistItemResponse], status_code=status.HTTP_201_CREATED, summary='Add Entity to Target Watchlist')
async def add_to_watchlist(
    req: WatchlistAddRequest,
    current_user: UserProfile = Depends(require_permission('watchlist:manage')),
    db = Depends(get_db)
):
    target_case = req.caseId or 'CASE-2024-001'
    assert_case_access(db, current_user, target_case)
    watch_id = f'WCH-{uuid.uuid4().hex[:6].upper()}'
    now = datetime.now(timezone.utc).isoformat()
    row = WatchlistModel(
        watch_id=watch_id, case_id=target_case, entity_type=req.entityType,
        identifier_value=req.identifierValue, canonical_name=req.identifierValue,
        reason=req.reason, priority=req.priority, added_by=current_user.fullName,
        match_count=0,
    )
    db.add(row); db.commit(); db.refresh(row)
    new_item = {
        'watchId': watch_id,
        'entityType': req.entityType,
        'identifierValue': req.identifierValue,
        'canonicalName': req.identifierValue,
        'reason': req.reason,
        'priority': req.priority,
        'caseId': target_case,
        'addedBy': current_user.fullName or 'Inspector Sharma (LEO-7729)',
        'addedAt': row.added_at.isoformat() if row.added_at else now,
        'isActive': True,
        'matchCount': row.match_count
    }
    return ResponseEnvelope(data=WatchlistItemResponse(**new_item))


@router.get('', response_model=PaginatedResponse[WatchlistItemResponse], summary='List Active Watchlist Targets')
async def list_watchlist(
    caseId: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    entityType: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(require_permission('watchlist:read')),
    db = Depends(get_db)
):
    target_case = (caseId if isinstance(caseId, str) and caseId else None) or (case_id if isinstance(case_id, str) and case_id else None) or 'CASE-2024-001'
    assert_case_access(db, current_user, target_case)
    rows = db.query(WatchlistModel).filter(WatchlistModel.case_id == target_case, WatchlistModel.is_active.is_(True))

    if entityType and entityType != 'ALL':
        rows = rows.filter(WatchlistModel.entity_type.ilike(entityType))

    from app.models import EntityModel, CaseMembershipModel
    watchlist_items = rows.all()
    search_names = list(set([w.identifier_value for w in watchlist_items] + [w.canonical_name for w in watchlist_items]))

    entity_cases = db.query(EntityModel.canonical_name, EntityModel.case_id).filter(
        EntityModel.canonical_name.in_(search_names)
    ).distinct().all()

    entity_case_map = {}
    for name, cid in entity_cases:
        if cid:
            entity_case_map.setdefault(name, set()).add(cid)

    all_case_ids = set()
    for cids in entity_case_map.values():
        all_case_ids.update(cids)

    if current_user.grantedRole in ('ADMIN', 'INVESTIGATOR'):
        authorized_case_set = all_case_ids
    else:
        memberships = db.query(CaseMembershipModel.case_id).filter(
            CaseMembershipModel.case_id.in_(list(all_case_ids)),
            CaseMembershipModel.user_email.ilike(current_user.email)
        ).all()
        authorized_case_set = set([m[0] for m in memberships])

    filtered = []
    for w in watchlist_items:
        cids = entity_case_map.get(w.identifier_value, set()).union(entity_case_map.get(w.canonical_name, set()))
        auth_cids = list(cids.intersection(authorized_case_set))
        filtered.append({
            'watchId': w.watch_id, 'entityType': w.entity_type, 'identifierValue': w.identifier_value, 
            'canonicalName': w.canonical_name, 'reason': w.reason, 'priority': w.priority, 
            'caseId': w.case_id, 'addedBy': w.added_by, 'addedAt': w.added_at.isoformat() if w.added_at else '', 
            'isActive': w.is_active, 'matchCount': w.match_count,
            'authorizedCaseCount': len(auth_cids),
            'authorizedCases': auth_cids
        })

    start = (page - 1) * pageSize
    items_slice = filtered[start:start + pageSize]
    items = [WatchlistItemResponse(**w) for w in items_slice]
    total = len(filtered)
    pages = max(1, (total + pageSize - 1) // pageSize)

    return PaginatedResponse(
        items=items,
        pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=total, totalPages=pages)
    )


@router.get('/entity/{identifier_value}/cases', response_model=ResponseEnvelope[dict], summary='Get Authorized Cases for Entity')
async def get_entity_cases(
    identifier_value: str,
    current_user: UserProfile = Depends(require_permission('watchlist:read')),
    db = Depends(get_db)
):
    from app.models import EntityModel, CaseMembershipModel
    
    cases = db.query(EntityModel.case_id).filter(
        EntityModel.canonical_name == identifier_value
    ).distinct().all()
    
    case_ids = [c[0] for c in cases if c[0]]
    
    if current_user.grantedRole in ('ADMIN', 'INVESTIGATOR'):
        authorized_cases = case_ids
    else:
        memberships = db.query(CaseMembershipModel.case_id).filter(
            CaseMembershipModel.case_id.in_(case_ids),
            CaseMembershipModel.user_email.ilike(current_user.email)
        ).all()
        authorized_cases = [m[0] for m in memberships]
        
    return ResponseEnvelope(data={
        'authorizedCaseCount': len(authorized_cases),
        'authorizedCases': authorized_cases
    })


@router.get('/search', response_model=ResponseEnvelope[list], summary='Search Entities Across Authorized Cases')
async def search_entities(
    query: str = Query(..., min_length=2),
    current_user: UserProfile = Depends(require_permission('watchlist:read')),
    db = Depends(get_db)
):
    from app.models import EntityModel, CaseMembershipModel
    
    if current_user.grantedRole in ('ADMIN', 'INVESTIGATOR'):
        case_filter = True
    else:
        memberships = db.query(CaseMembershipModel.case_id).filter(
            CaseMembershipModel.user_email.ilike(current_user.email)
        ).all()
        authorized_case_ids = [m[0] for m in memberships]
        case_filter = EntityModel.case_id.in_(authorized_case_ids)
        
    results = db.query(
        EntityModel.canonical_name,
        EntityModel.entity_type
    ).filter(
        EntityModel.canonical_name.ilike(f"%{query}%"),
        case_filter
    ).distinct().limit(50).all()
    
    return ResponseEnvelope(data=[
        {'canonicalName': r[0], 'entityType': r[1]} for r in results
    ])

@router.delete('/{watchId}', response_model=ResponseEnvelope[dict], summary='Remove Target from Watchlist')
async def remove_watchlist_item(
    watchId: str,
    current_user: UserProfile = Depends(require_permission('watchlist:manage')),
    db = Depends(get_db)
):
    row = db.query(WatchlistModel).filter(WatchlistModel.watch_id == watchId).first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail='Watchlist item not found')
    assert_case_access(db, current_user, row.case_id)
    row.is_active = False; db.commit()
    return ResponseEnvelope(data={'success': True, 'watchId': watchId, 'status': 'ARCHIVED'})
