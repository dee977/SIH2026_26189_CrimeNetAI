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

@router.get('/persons', response_model=PaginatedResponse[PersonEntity], summary='Query Person Entities')
async def get_persons(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Person', query=query, limit=pageSize)
    items = [PersonEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/phones', response_model=PaginatedResponse[PhoneEntity], summary='Query Phone Entities')
async def get_phones(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Phone', query=query, limit=pageSize)
    items = [PhoneEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/bank-accounts', response_model=PaginatedResponse[BankAccountEntity], summary='Query Bank Accounts')
async def get_bank_accounts(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='BankAccount', query=query, limit=pageSize)
    items = [BankAccountEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/vehicles', response_model=PaginatedResponse[VehicleEntity], summary='Query Vehicles')
async def get_vehicles(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Vehicle', query=query, limit=pageSize)
    items = [VehicleEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/locations', response_model=PaginatedResponse[LocationEntity], summary='Query Locations')
async def get_locations(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Location', query=query, limit=pageSize)
    items = [LocationEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/organizations', response_model=PaginatedResponse[OrganizationEntity], summary='Query Organizations')
async def get_organizations(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Organization', query=query, limit=pageSize)
    items = [OrganizationEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/firs', response_model=PaginatedResponse[FIREntity], summary='Query FIRs')
async def get_firs(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='FIR', query=query, limit=pageSize)
    items = [FIREntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/crimes', response_model=PaginatedResponse[CrimeEntity], summary='Query Crimes')
async def get_crimes(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Crime', query=query, limit=pageSize)
    items = [CrimeEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/transactions', response_model=PaginatedResponse[TransactionEntity], summary='Query Transactions')
async def get_transactions(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Transaction', query=query, limit=pageSize)
    items = [TransactionEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/communications', response_model=PaginatedResponse[CommunicationEntity], summary='Query Communications')
async def get_communications(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Communication', query=query, limit=pageSize)
    items = [CommunicationEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/evidence', response_model=PaginatedResponse[EvidenceEntity], summary='Query Evidence')
async def get_evidence(query: Optional[str] = None, page: int = 1, pageSize: int = 20, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    raw = await m3_client.query_entities(entity_type='Evidence', query=query, limit=pageSize)
    items = [EvidenceEntity(**r) for r in raw]
    return PaginatedResponse(items=items, pagination=PaginationMeta(page=page, pageSize=pageSize, totalRecords=len(items), totalPages=1))

@router.get('/{id}', response_model=ResponseEnvelope[dict], summary='Get Normalized Entity by ID')
async def get_entity_by_id(id: str, m3_client: M3GraphDataClient = Depends(get_m3_client)):
    ent = await m3_client.get_node_by_id(id)
    if not ent:
        raise ResourceNotFoundError('Entity', id)
    return ResponseEnvelope(data=ent)
