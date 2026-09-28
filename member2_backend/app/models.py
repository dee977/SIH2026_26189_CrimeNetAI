from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint, Text, JSON
from app.database import Base
import datetime
from sqlalchemy.sql import func

class CaseModel(Base):
    __tablename__ = 'cases'

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True, nullable=False)
    case_number = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    assigned_investigator = Column(String, nullable=True)
    assigned_team = Column(String, nullable=True)
    status = Column(String, default='active')
    priority = Column(String, default='high')
    jurisdiction = Column(String, nullable=True)
    police_station = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

from sqlalchemy import Boolean
class UserProfileModel(Base):
    __tablename__ = 'user_profiles'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class CaseMembershipModel(Base):
    """Server-side case ACL.  A token never conveys case access by itself."""
    __tablename__ = 'case_memberships'
    __table_args__ = (UniqueConstraint('case_id', 'user_email', name='uq_case_member'),)
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, ForeignKey('cases.case_id'), nullable=False, index=True)
    user_email = Column(String, nullable=False, index=True)
    membership_role = Column(String, nullable=False, default='MEMBER')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WatchlistModel(Base):
    __tablename__ = 'watchlist_items'
    id = Column(Integer, primary_key=True)
    watch_id = Column(String, unique=True, nullable=False, index=True)
    case_id = Column(String, ForeignKey('cases.case_id'), nullable=False, index=True)
    entity_type = Column(String, nullable=False)
    identifier_value = Column(String, nullable=False)
    canonical_name = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    priority = Column(String, nullable=False)
    added_by = Column(String, nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)
    match_count = Column(Integer, default=0, nullable=False)

class AlertModel(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True)
    alert_id = Column(String, unique=True, nullable=False, index=True)
    case_id = Column(String, ForeignKey('cases.case_id'), nullable=False, index=True)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    related_entity_id = Column(String)
    related_entity_name = Column(String)
    evidence_id = Column(String)
    status = Column(String, default='UNRESOLVED', nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())

class EvidenceModel(Base):
    __tablename__ = 'evidence_items'
    id = Column(Integer, primary_key=True)
    evidence_id = Column(String, unique=True, nullable=False, index=True)
    case_id = Column(String, ForeignKey('cases.case_id'), nullable=False, index=True)
    entity_type = Column(String, default='Evidence', nullable=False)
    canonical_name = Column(String, nullable=False)
    evidence_number = Column(String, nullable=False)
    evidence_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    collected_date = Column(String, nullable=True)
    collected_by = Column(String, nullable=True)
    storage_location = Column(String, nullable=True)
    sha256_hash = Column(String, nullable=False, index=True)
    bsa_certificate_id = Column(String, nullable=True)
    confidence = Column(String, default='1.0')
    metadata_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class IngestJobModel(Base):
    __tablename__ = 'ingestion_jobs'
    id = Column(Integer, primary_key=True)
    job_id = Column(String, unique=True, nullable=False, index=True)
    file_id = Column(String, nullable=True, index=True)
    file_name = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)
    case_id = Column(String, ForeignKey('cases.case_id'), nullable=False, index=True)
    status = Column(String, default='UPLOADED', nullable=False)
    stage = Column(String, default='COMPLETED', nullable=False)
    progress_percent = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    records_processed = Column(Integer, default=0)
    records_created = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    invalid_rows = Column(Integer, default=0)
    entities_extracted = Column(Integer, default=0)
    relationships_extracted = Column(Integer, default=0)
    evidence_id = Column(String, nullable=True)
    sha256_hash = Column(String, nullable=True)
    schema_detected = Column(String, nullable=True)
    extraction_results = Column(JSON, default=dict, nullable=False)
    extracted_entities_list = Column(JSON, default=list, nullable=False)
    extracted_relationships_list = Column(JSON, default=list, nullable=False)
    sample_preview = Column(JSON, default=list, nullable=False)
    warnings_json = Column(JSON, default=list, nullable=False)
    errors_json = Column(JSON, default=list, nullable=False)
    source_provenance = Column(JSON, default=dict, nullable=False)
    uploader = Column(String, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_details = Column(Text, nullable=True)

