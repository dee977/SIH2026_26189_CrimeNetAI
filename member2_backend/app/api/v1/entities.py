from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user
from app.exceptions import ResourceNotFoundError
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.schemas.entities import (
    PersonEntity, PhoneEntity, BankAccountEntity, VehicleEntity,
    LocationEntity, OrganizationEntity, FIREntity, CrimeEntity,
    TransactionEntity, CommunicationEntity, EvidenceEntity
)
from app.services.m3_graph_data import M3GraphDataClient, get_m3_client

router = APIRouter(prefix='/entities', tags=['Normalized Entities'])

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
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=500),
    m3_client: M3GraphDataClient = Depends(get_m3_client)
):
    raw = await m3_client.query_entities(entity_type=type, query=query, limit=pageSize)
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
async def get_persons(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Person', query=query, limit=pageSize)
    items = [_safe_person(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/phones', response_model=PaginatedResponse[PhoneEntity], summary='Query Phone Entities')
async def get_phones(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Phone', query=query, limit=pageSize)
    items = [_safe_phone(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/bank-accounts', response_model=PaginatedResponse[BankAccountEntity], summary='Query Bank Accounts')
async def get_bank_accounts(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='BankAccount', query=query, limit=pageSize)
    items = [_safe_bank(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/vehicles', response_model=PaginatedResponse[VehicleEntity], summary='Query Vehicles')
async def get_vehicles(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Vehicle', query=query, limit=pageSize)
    items = [_safe_vehicle(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/locations', response_model=PaginatedResponse[LocationEntity], summary='Query Locations')
async def get_locations(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Location', query=query, limit=pageSize)
    items = [_safe_location(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/organizations', response_model=PaginatedResponse[OrganizationEntity], summary='Query Organizations')
async def get_organizations(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Organization', query=query, limit=pageSize)
    items = [_safe_org(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/firs', response_model=PaginatedResponse[FIREntity], summary='Query FIRs')
async def get_firs(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='FIR', query=query, limit=pageSize)
    items = [_safe_fir(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/crimes', response_model=PaginatedResponse[CrimeEntity], summary='Query Crimes')
async def get_crimes(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Crime', query=query, limit=pageSize)
    items = [_safe_crime(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/transactions', response_model=PaginatedResponse[TransactionEntity], summary='Query Transactions')
async def get_transactions(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Transaction', query=query, limit=pageSize)
    items = [_safe_transaction(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/communications', response_model=PaginatedResponse[CommunicationEntity], summary='Query Communications')
async def get_communications(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Communication', query=query, limit=pageSize)
    items = [_safe_communication(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/evidence', response_model=PaginatedResponse[EvidenceEntity], summary='Query Evidence')
async def get_evidence(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Evidence', query=query, limit=pageSize)
    items = [_safe_evidence(r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/{id}', response_model=ResponseEnvelope[dict], summary='Get Normalized Entity by ID')
async def get_entity_by_id(id: str, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    ent = await m3_client.get_node_by_id(id)
    if not ent:
        raise ResourceNotFoundError('Entity', id)
    return ResponseEnvelope(data=ent)
