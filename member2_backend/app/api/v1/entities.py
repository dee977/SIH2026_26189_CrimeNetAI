from typing import Any, Dict, List, Optional
import hashlib
from fastapi import APIRouter, Depends, Query, HTTPException
from app.dependencies import get_current_user, require_permission
from app.exceptions import ResourceNotFoundError
from app.database import get_db
from app.models import EvidenceModel, RelationshipModel, EntityModel, TimelineEventModel, IngestJobModel
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.schemas.entities import (
    PersonEntity, PhoneEntity, BankAccountEntity, VehicleEntity,
    LocationEntity, OrganizationEntity, FIREntity, CrimeEntity,
    TransactionEntity, CommunicationEntity, EvidenceEntity
)
from app.services.m3_graph_data import M3GraphDataClient, get_m3_client

router = APIRouter(prefix='/entities', tags=['Normalized Entities'], dependencies=[Depends(require_permission('graph:read'))])

def _safe_person(r: dict) -> PersonEntity:
    c = dict(r)
    c.setdefault('fullName', c.get('canonicalName') or c.get('name') or c.get('id', 'Unknown Person'))
    c.setdefault('aliases', [])
    c.setdefault('associatedPhones', [])
    c.setdefault('associatedAccounts', [])
    if not c.get('address') and c.get('city'):
        c['address'] = str(c.get('city'))
    return PersonEntity(**c)

def _safe_phone(r: dict) -> PhoneEntity:
    c = dict(r)
    c.setdefault('phoneNumber', c.get('phoneNumber') or c.get('number') or c.get('canonicalName', '+91-0000000000'))
    return PhoneEntity(**c)

def _safe_bank(r: dict) -> BankAccountEntity:
    c = dict(r)
    c.setdefault('accountNumber', c.get('accountNumber') or c.get('account_number') or c.get('canonicalName', 'ACC-0000'))
    c.setdefault('bankName', c.get('bankName') or c.get('bank', 'HDFC Bank'))
    c.setdefault('accountHolder', c.get('accountHolder') or c.get('holder') or c.get('canonicalName', 'Unknown Holder'))
    return BankAccountEntity(**c)

def _safe_vehicle(r: dict) -> VehicleEntity:
    c = dict(r)
    c.setdefault('registrationNumber', c.get('registrationNumber') or c.get('license_plate') or c.get('canonicalName', 'MH-00-XX-0000'))
    return VehicleEntity(**c)

def _safe_location(r: dict) -> LocationEntity:
    c = dict(r)
    c.setdefault('locationName', c.get('locationName') or c.get('location') or c.get('canonicalName', 'Unknown Location'))
    props = c.get('properties') or {}
    if c.get('latitude') is None:
        c['latitude'] = props.get('latitude') or props.get('lat')
    if c.get('longitude') is None:
        c['longitude'] = props.get('longitude') or props.get('lng')
    if isinstance(c.get('latitude'), str):
        try:
            c['latitude'] = float(c['latitude'])
        except (ValueError, TypeError):
            c['latitude'] = None
    if isinstance(c.get('longitude'), str):
        try:
            c['longitude'] = float(c['longitude'])
        except (ValueError, TypeError):
            c['longitude'] = None
    return LocationEntity(**c)

def _safe_org(r: dict) -> OrganizationEntity:
    c = dict(r)
    c.setdefault('orgName', c.get('orgName') or c.get('name') or c.get('canonicalName', 'Unknown Organization'))
    return OrganizationEntity(**c)

def _safe_fir(r: dict) -> FIREntity:
    c = dict(r)
    c.setdefault('firNumber', c.get('firNumber') or c.get('fir_number') or c.get('canonicalName', 'FIR-0000'))
    c.setdefault('policeStation', c.get('policeStation', 'Port Police Station'))
    c.setdefault('filingDate', c.get('filingDate', '2024-03-01'))
    c.setdefault('incidentSummary', c.get('incidentSummary') or c.get('canonicalName', 'Recorded Incident'))
    return FIREntity(**c)

def _safe_crime(r: dict) -> CrimeEntity:
    c = dict(r)
    c.setdefault('crimeCode', c.get('crimeCode') or c.get('canonicalName', 'CR-001'))
    c.setdefault('crimeCategory', c.get('crimeCategory', 'Organized Crime'))
    c.setdefault('description', c.get('description') or c.get('canonicalName', 'Investigative Record'))
    c.setdefault('incidentDate', c.get('incidentDate', '2024-03-01'))
    return CrimeEntity(**c)

def _safe_transaction(r: dict) -> TransactionEntity:
    c = dict(r)
    c.setdefault('transactionId', c.get('transactionId') or c.get('id', 'TXN-001'))
    c.setdefault('sourceAccount', c.get('sourceAccount', 'ACC-001'))
    c.setdefault('destinationAccount', c.get('destinationAccount', 'ACC-002'))
    c.setdefault('amount', float(c.get('amount') or 0.0))
    c.setdefault('transactionDate', c.get('transactionDate', '2024-03-01'))
    return TransactionEntity(**c)

def _safe_communication(r: dict) -> CommunicationEntity:
    c = dict(r)
    c.setdefault('commId', c.get('commId') or c.get('id', 'COMM-001'))
    c.setdefault('callerPhone', c.get('callerPhone', '+91-9876543210'))
    c.setdefault('receiverPhone', c.get('receiverPhone', '+91-9123456780'))
    c.setdefault('timestamp', c.get('timestamp', '2024-03-01T12:00:00Z'))
    return CommunicationEntity(**c)

def _safe_evidence(r: dict) -> EvidenceEntity:
    c = dict(r)
    c.setdefault('evidenceNumber', c.get('evidenceNumber') or c.get('id', 'EVD-001'))
    c.setdefault('evidenceType', c.get('evidenceType', 'Document'))
    c.setdefault('description', c.get('description') or c.get('canonicalName', 'Evidence Item'))
    c.setdefault('collectedDate', c.get('collectedDate', '2024-03-01'))
    c.setdefault('collectedBy', c.get('collectedBy', 'Inspector Rajesh Kumar'))
    c.setdefault('storageLocation', c.get('storageLocation', 'Evidence Vault A-1'))
    c.setdefault('sha256Hash', c.get('sha256Hash', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'))
    return EvidenceEntity(**c)


@router.get('', summary='Query Entities by Type or Keyword')
async def get_all_entities(
    type: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    caseId: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(500, ge=1, le=2000),
    m3_client: M3GraphDataClient = Depends(get_m3_client)
):
    target_case = case_id or caseId or None
    raw = await m3_client.query_entities(entity_type=type, query=query, case_id=target_case, limit=pageSize)
    items = []
    for r in raw:
        lbl = r.get('entityType', 'Person')
        if lbl == 'Person':
            items.append(_safe_person(r))
        elif lbl == 'Transaction':
            items.append(_safe_transaction(r))
        elif lbl == 'Communication':
            items.append(_safe_communication(r))
        elif lbl == 'FIR':
            items.append(_safe_fir(r))
        elif lbl == 'Phone':
            items.append(_safe_phone(r))
        elif lbl == 'BankAccount':
            items.append(_safe_bank(r))
        elif lbl == 'Vehicle':
            items.append(_safe_vehicle(r))
        elif lbl == 'Location':
            items.append(_safe_location(r))
        elif lbl == 'Organization':
            items.append(_safe_org(r))
        elif lbl == 'Crime':
            items.append(_safe_crime(r))
        elif lbl == 'Evidence':
            items.append(_safe_evidence(r))
        else:
            items.append(r)
    return ResponseEnvelope(data=items)


@router.get('/persons', response_model=PaginatedResponse[PersonEntity], summary='Query Person Entities')
async def get_persons(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Person', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_person(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/phones', response_model=PaginatedResponse[PhoneEntity], summary='Query Phone Entities')
async def get_phones(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Phone', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_phone(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/bank-accounts', response_model=PaginatedResponse[BankAccountEntity], summary='Query Bank Accounts')
async def get_bank_accounts(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='BankAccount', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_bank(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/vehicles', response_model=PaginatedResponse[VehicleEntity], summary='Query Vehicles')
async def get_vehicles(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Vehicle', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_vehicle(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/locations', response_model=PaginatedResponse[LocationEntity], summary='Query Locations')
async def get_locations(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Location', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_location(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/organizations', response_model=PaginatedResponse[OrganizationEntity], summary='Query Organizations')
async def get_organizations(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Organization', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_org(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/firs', response_model=PaginatedResponse[FIREntity], summary='Query FIRs')
async def get_firs(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='FIR', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_fir(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/crimes', response_model=PaginatedResponse[CrimeEntity], summary='Query Crimes')
async def get_crimes(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Crime', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_crime(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/transactions', response_model=PaginatedResponse[TransactionEntity], summary='Query Transactions')
async def get_transactions(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Transaction', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_transaction(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/communications', response_model=PaginatedResponse[CommunicationEntity], summary='Query Communications')
async def get_communications(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Communication', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_communication(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/evidence', response_model=PaginatedResponse[EvidenceEntity], summary='Query Evidence')
async def get_evidence(query: Optional[str] = None, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Evidence', query=query, case_id=case_id or caseId, limit=pageSize)
    items = [_safe_evidence(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/{id}/documents', response_model=ResponseEnvelope[List[Dict[str, Any]]], summary='Get Source Documents Linked to an Entity')
async def get_entity_documents(
    id: str,
    case_id: Optional[str] = Query(None),
    caseId: Optional[str] = Query(None),
    db = Depends(get_db),
    current_user: UserProfile = Depends(require_permission('graph:read'))
):
    target_case_id = (case_id if isinstance(case_id, str) and case_id else None) or (caseId if isinstance(caseId, str) and caseId else None)
    
    docs_map: Dict[str, Dict[str, Any]] = {}
    
    # 1. Check if the entity itself is an Evidence item
    self_ev = db.query(EvidenceModel).filter(EvidenceModel.evidence_id == id).first()
    if self_ev:
        meta = self_ev.metadata_json or {}
        docs_map[self_ev.evidence_id] = {
            'id': self_ev.evidence_id,
            'evidenceId': self_ev.evidence_id,
            'documentId': self_ev.evidence_id,
            'fileName': self_ev.canonical_name,
            'title': self_ev.canonical_name,
            'fileType': self_ev.evidence_type,
            'category': meta.get('category') or self_ev.evidence_type,
            'description': self_ev.description or 'Direct forensic asset node',
            'sha256Hash': self_ev.sha256_hash,
            'uploadedAt': self_ev.collected_date or (self_ev.created_at.isoformat() if self_ev.created_at else None),
            'uploader': self_ev.collected_by or 'Forensics Lab',
            'custodian': self_ev.collected_by or meta.get('custodian') or 'Investigating Officer',
            'bsaCertificateId': self_ev.bsa_certificate_id or f'BSA-63-{self_ev.evidence_id}',
            'fileSizeBytes': meta.get('fileSizeBytes') or meta.get('fileSize') or 1048576,
            'storageUrl': f'/api/v1/evidence/{self_ev.evidence_id}/file',
            'previewUrl': meta.get('previewUrl') or meta.get('imageUrl') or f'/api/v1/evidence/{self_ev.evidence_id}/file',
            'relationship': 'SELF_EVIDENCE',
            'confidence': float(self_ev.confidence) if self_ev.confidence else 1.0,
            'caseId': self_ev.case_id,
        }

    # 2. Query relationships table for any link connecting this entity to an evidence item or FIR
    rel_query = db.query(RelationshipModel).filter(
        (RelationshipModel.source_id == id) | (RelationshipModel.target_id == id)
    )
    if target_case_id:
        rel_query = rel_query.filter((RelationshipModel.case_id == target_case_id) | (RelationshipModel.case_id.is_(None)))
        
    rels = rel_query.all()
    
    linked_evidence_ids: Dict[str, str] = {}
    linked_fir_ids: Dict[str, str] = {}
    
    for r in rels:
        other_id = r.target_id if r.source_id == id else r.source_id
        rel_type = r.relationship_type
        
        if other_id.startswith('EVD-') or 'EVIDENCE' in rel_type.upper() or 'DOCUMENT' in rel_type.upper():
            linked_evidence_ids[other_id] = rel_type
        elif other_id.startswith('FIR-') or 'FIR' in rel_type.upper():
            linked_fir_ids[other_id] = rel_type

    # 3. Fetch evidence items for linked_evidence_ids
    if linked_evidence_ids:
        ev_items = db.query(EvidenceModel).filter(EvidenceModel.evidence_id.in_(list(linked_evidence_ids.keys()))).all()
        for ev in ev_items:
            rel_type = linked_evidence_ids.get(ev.evidence_id, 'EVIDENCE_INCRIMINATES')
            meta = ev.metadata_json or {}
            docs_map[ev.evidence_id] = {
                'id': ev.evidence_id,
                'evidenceId': ev.evidence_id,
                'documentId': ev.evidence_id,
                'fileName': ev.canonical_name,
                'title': ev.canonical_name,
                'fileType': ev.evidence_type,
                'category': meta.get('category') or ev.evidence_type,
                'description': ev.description or f"Registered case evidence linked via {rel_type}",
                'sha256Hash': ev.sha256_hash,
                'uploadedAt': ev.collected_date or (ev.created_at.isoformat() if ev.created_at else None),
                'uploader': ev.collected_by or 'Forensics Lab',
                'custodian': ev.collected_by or meta.get('custodian') or 'Investigating Officer',
                'bsaCertificateId': ev.bsa_certificate_id or f'BSA-63-{ev.evidence_id}',
                'fileSizeBytes': meta.get('fileSizeBytes') or meta.get('fileSize') or 2048576,
                'storageUrl': f'/api/v1/evidence/{ev.evidence_id}/file',
                'previewUrl': meta.get('previewUrl') or meta.get('imageUrl') or f'/api/v1/evidence/{ev.evidence_id}/file',
                'relationship': rel_type,
                'confidence': float(ev.confidence) if ev.confidence else 1.0,
                'caseId': ev.case_id,
            }

    # 4. Fetch FIR items for linked_fir_ids
    if linked_fir_ids:
        fir_items = db.query(EntityModel).filter(EntityModel.entity_id.in_(list(linked_fir_ids.keys()))).all()
        for fir in fir_items:
            rel_type = linked_fir_ids.get(fir.entity_id, 'FIR_RECORD')
            props = fir.properties or {}
            docs_map[fir.entity_id] = {
                'id': fir.entity_id,
                'evidenceId': fir.entity_id,
                'documentId': fir.entity_id,
                'fileName': f"{fir.canonical_name} - First Information Report",
                'title': fir.canonical_name,
                'fileType': 'First Information Report (FIR)',
                'category': 'FIR Filing / Legal Mandate',
                'description': props.get('incidentSummary') or f"Jurisdiction: {props.get('policeStation', 'State Police')} | Acts: {', '.join(props.get('actsSections', [])) if isinstance(props.get('actsSections'), list) else props.get('actsSections', 'N/A')}",
                'sha256Hash': props.get('sha256') or hashlib.sha256(f"{fir.entity_id}:{fir.canonical_name}".encode()).hexdigest(),
                'uploadedAt': fir.created_at.isoformat() if fir.created_at else None,
                'uploader': props.get('policeStation') or 'Station House Officer',
                'custodian': props.get('policeStation') or 'State Police Department',
                'bsaCertificateId': f'BSA-65B-{fir.entity_id}',
                'fileSizeBytes': 156400,
                'storageUrl': None,
                'previewUrl': None,
                'relationship': rel_type,
                'confidence': float(fir.confidence) if fir.confidence else 1.0,
                'caseId': fir.case_id,
                'isFir': True,
                'firDetails': props
            }

    # 5. Check timeline events referencing this entity with evidence_id or source_document
    tl_query = db.query(TimelineEventModel).filter(
        (TimelineEventModel.primary_entity_id == id) | (TimelineEventModel.secondary_entity_id == id)
    )
    if target_case_id:
        tl_query = tl_query.filter(TimelineEventModel.case_id == target_case_id)
    tl_events = tl_query.all()
    for tl in tl_events:
        if tl.evidence_id and tl.evidence_id not in docs_map:
            ev = db.query(EvidenceModel).filter(EvidenceModel.evidence_id == tl.evidence_id).first()
            if ev:
                meta = ev.metadata_json or {}
                docs_map[ev.evidence_id] = {
                    'id': ev.evidence_id,
                    'evidenceId': ev.evidence_id,
                    'documentId': ev.evidence_id,
                    'fileName': ev.canonical_name,
                    'title': ev.canonical_name,
                    'fileType': ev.evidence_type,
                    'category': meta.get('category') or ev.evidence_type,
                    'description': f"Referenced in event: {tl.title} ({tl.timestamp})",
                    'sha256Hash': ev.sha256_hash,
                    'uploadedAt': ev.collected_date or (ev.created_at.isoformat() if ev.created_at else None),
                    'uploader': ev.collected_by or 'Forensics Team',
                    'custodian': ev.collected_by or meta.get('custodian') or 'Investigating Officer',
                    'bsaCertificateId': ev.bsa_certificate_id or f'BSA-63-{ev.evidence_id}',
                    'fileSizeBytes': meta.get('fileSizeBytes') or meta.get('fileSize') or 1048576,
                    'storageUrl': f'/api/v1/evidence/{ev.evidence_id}/file',
                    'previewUrl': meta.get('previewUrl') or meta.get('imageUrl') or f'/api/v1/evidence/{ev.evidence_id}/file',
                    'relationship': 'TIMELINE_EVIDENCE',
                    'confidence': 0.95,
                    'caseId': ev.case_id,
                }
        elif tl.source_document and tl.source_document not in docs_map:
            doc_id = f"DOC-{hashlib.md5(tl.source_document.encode()).hexdigest()[:8]}"
            docs_map[doc_id] = {
                'id': doc_id,
                'evidenceId': doc_id,
                'documentId': doc_id,
                'fileName': tl.source_document,
                'title': tl.source_document,
                'fileType': 'Source Intelligence Document',
                'category': 'Investigative Record',
                'description': f"Corroborating record cited in timeline event '{tl.title}'",
                'sha256Hash': hashlib.sha256(tl.source_document.encode()).hexdigest(),
                'uploadedAt': tl.timestamp or (tl.created_at.isoformat() if tl.created_at else None),
                'uploader': 'Lead Investigator',
                'custodian': 'Evidence Vault',
                'bsaCertificateId': f'BSA-65B-{doc_id}',
                'fileSizeBytes': 245760,
                'storageUrl': None,
                'previewUrl': None,
                'relationship': 'CITED_IN_EVENT',
                'confidence': 0.92,
                'caseId': tl.case_id,
            }

    # 6. Check IngestJobModel if any ingestion files generated entities for this case
    if target_case_id:
        ingest_jobs = db.query(IngestJobModel).filter(
            IngestJobModel.case_id == target_case_id,
            IngestJobModel.status == 'COMPLETED'
        ).all()
        for job in ingest_jobs:
            ent_list = job.extracted_entities_list or []
            is_in_job = any(e.get('id') == id or e.get('name') == id for e in ent_list if isinstance(e, dict))
            if is_in_job and job.file_name not in [d['fileName'] for d in docs_map.values()]:
                jid = f"INGEST-{job.job_id}"
                docs_map[jid] = {
                    'id': jid,
                    'evidenceId': job.evidence_id or jid,
                    'documentId': jid,
                    'fileName': job.file_name,
                    'title': job.file_name,
                    'fileType': job.doc_type or 'Ingested Source File',
                    'category': 'Ingested Source Dossier',
                    'description': f"Original data intake file processed via automated extraction pipeline ({job.records_processed} records)",
                    'sha256Hash': job.sha256_hash or hashlib.sha256(job.file_name.encode()).hexdigest(),
                    'uploadedAt': job.started_at.isoformat() if job.started_at else None,
                    'uploader': job.uploader or 'Data Ingestion Service',
                    'custodian': 'Forensic Intake Registry',
                    'bsaCertificateId': f'BSA-65B-ING-{job.job_id[:8]}',
                    'fileSizeBytes': 524288,
                    'storageUrl': None,
                    'previewUrl': None,
                    'relationship': 'INGESTION_SOURCE',
                    'confidence': 0.98,
                    'caseId': job.case_id,
                }

    doc_list = list(docs_map.values())
    return ResponseEnvelope(data=doc_list)

@router.get('/{id}', response_model=ResponseEnvelope[dict], summary='Get Normalized Entity by ID')
async def get_entity_by_id(id: str, case_id: Optional[str] = Query(None), caseId: Optional[str] = Query(None), m3_client: M3GraphDataClient = Depends(get_m3_client)):
    target_case = case_id or caseId or None
    ent = await m3_client.get_node_by_id(id, target_case)
    if not ent:
        raise ResourceNotFoundError('Entity', id)
    return ResponseEnvelope(data=ent)
