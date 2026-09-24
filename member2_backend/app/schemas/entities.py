from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class BaseEntity(BaseModel):
    id: str
    entityType: str
    canonicalName: str
    source: str = 'M3_GRAPH_DATA'
    caseId: Optional[str] = None
    evidenceId: Optional[str] = None
    confidence: Optional[float] = Field(default=0.95, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PersonEntity(BaseEntity):
    entityType: str = 'Person'
    fullName: str
    aliases: List[str] = Field(default_factory=list)
    dateOfBirth: Optional[str] = None
    nationalId: Optional[str] = None
    passportNumber: Optional[str] = None
    address: Optional[str] = None
    associatedPhones: List[str] = Field(default_factory=list)
    associatedAccounts: List[str] = Field(default_factory=list)

class PhoneEntity(BaseEntity):
    entityType: str = 'Phone'
    phoneNumber: str
    imei: Optional[str] = None
    carrier: Optional[str] = None
    subscriberName: Optional[str] = None
    callCount: Optional[int] = 0
    smsCount: Optional[int] = 0

class BankAccountEntity(BaseEntity):
    entityType: str = 'BankAccount'
    accountNumber: str
    bankName: str
    branch: Optional[str] = None
    ifscCode: Optional[str] = None
    accountHolder: str
    totalCredits: Optional[float] = 0.0
    totalDebits: Optional[float] = 0.0

class VehicleEntity(BaseEntity):
    entityType: str = 'Vehicle'
    registrationNumber: str
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    chassisNumber: Optional[str] = None
    engineNumber: Optional[str] = None
    ownerName: Optional[str] = None

class LocationEntity(BaseEntity):
    entityType: str = 'Location'
    locationName: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = 'India'
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    locationType: Optional[str] = 'Transit Point'

class OrganizationEntity(BaseEntity):
    entityType: str = 'Organization'
    orgName: str
    registrationNumber: Optional[str] = None
    orgType: Optional[str] = 'Shell Corporation'
    directors: List[str] = Field(default_factory=list)
    registeredAddress: Optional[str] = None

class FIREntity(BaseEntity):
    entityType: str = 'FIR'
    firNumber: str
    policeStation: str
    filingDate: str
    actsSections: List[str] = Field(default_factory=list)
    complainant: Optional[str] = None
    accusedPersons: List[str] = Field(default_factory=list)
    incidentSummary: str

class CrimeEntity(BaseEntity):
    entityType: str = 'Crime'
    crimeCode: str
    crimeCategory: str
    description: str
    incidentDate: str
    location: Optional[str] = None
    status: str = 'Under Investigation'

class TransactionEntity(BaseEntity):
    entityType: str = 'Transaction'
    transactionId: str
    sourceAccount: str
    destinationAccount: str
    amount: float
    currency: str = 'INR'
    transactionDate: str
    paymentChannel: str = 'NEFT/RTGS'
    referenceNumber: Optional[str] = None

class CommunicationEntity(BaseEntity):
    entityType: str = 'Communication'
    commId: str
    callerPhone: str
    receiverPhone: str
    commType: str = 'Voice Call'
    timestamp: str
    durationSeconds: Optional[int] = 0
    towerLocation: Optional[str] = None

class EvidenceEntity(BaseEntity):
    entityType: str = 'Evidence'
    evidenceNumber: str
    evidenceType: str
    description: str
    collectedDate: str
    collectedBy: str
    storageLocation: str
    sha256Hash: str
    bsaSection65BCertificateId: Optional[str] = None

class AliasEntity(BaseModel):
    aliasId: str
    primaryPersonId: str
    aliasName: str
    context: Optional[str] = None
    source: str = 'M4_NLP_EXTRACTION'

class EntityFilter(BaseModel):
    entityType: Optional[str] = None
    query: Optional[str] = None
    caseId: Optional[str] = None
    location: Optional[str] = None
    fromDate: Optional[str] = None
    toDate: Optional[str] = None
    source: Optional[str] = None
