from pydantic import BaseModel
from typing import Optional

class ProvenanceMixin(BaseModel):
    """Base fields for all data to preserve provenance."""
    id: str
    source_file: Optional[str] = None
    source_record_id: Optional[str] = None
    timestamp: Optional[str] = None
    case_id: Optional[str] = None
    evidence_id: Optional[str] = None
    confidence: Optional[float] = None

class PersonData(ProvenanceMixin):
    name: Optional[str] = None
    aliases: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None

class PhoneData(ProvenanceMixin):
    number: Optional[str] = None
    provider: Optional[str] = None

class BankAccountData(ProvenanceMixin):
    account_number: Optional[str] = None
    bank_name: Optional[str] = None

class VehicleData(ProvenanceMixin):
    license_plate: Optional[str] = None
    model: Optional[str] = None

class LocationData(ProvenanceMixin):
    address: Optional[str] = None
    coordinates: Optional[str] = None

class FIRData(ProvenanceMixin):
    fir_number: Optional[str] = None
    date: Optional[str] = None

class CrimeData(ProvenanceMixin):
    crime_type: Optional[str] = None
    description: Optional[str] = None

class OrganizationData(ProvenanceMixin):
    name: Optional[str] = None
    org_type: Optional[str] = None

class CommunicationData(ProvenanceMixin):
    type: Optional[str] = None

class TransactionData(ProvenanceMixin):
    amount: Optional[float] = None
    currency: Optional[str] = None

class EvidenceData(ProvenanceMixin):
    description: Optional[str] = None

class CaseData(ProvenanceMixin):
    title: Optional[str] = None
    status: Optional[str] = None

class EventData(ProvenanceMixin):
    event_type: Optional[str] = None
    description: Optional[str] = None

class RelationshipData(BaseModel):
    source_id: str
    target_id: str
    source_label: str
    target_label: str
    rel_type: str
    
    # Provenance
    source: Optional[str] = None
    timestamp: Optional[str] = None
    case_id: Optional[str] = None
    evidence_id: Optional[str] = None
    confidence: Optional[float] = None
