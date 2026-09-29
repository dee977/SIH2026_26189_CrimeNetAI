from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class CaseStatusEnum(str):
    ACTIVE = 'active'
    UNDER_REVIEW = 'under_review'
    CLOSED = 'closed'
    ARCHIVED = 'archived'

class CaseCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = Field(default='Case investigation record.')
    caseId: Optional[str] = None
    caseNumber: Optional[str] = None
    assignedInvestigator: Optional[str] = 'Inspector Vikramaditya Rao (LEO-7729)'
    assignedTeam: Optional[str] = 'Special Investigation Team'
    policeStation: Optional[str] = 'Central Police Station'
    jurisdiction: Optional[str] = 'State Police CID'
    caseType: Optional[str] = 'Organized Crime Network'
    priority: Optional[str] = 'high'
    status: Optional[str] = 'active'
    accessClassification: Optional[str] = 'RESTRICTED'
    initialEntityIds: Optional[List[str]] = Field(default_factory=list)
    initialEvidenceIds: Optional[List[str]] = Field(default_factory=list)

class CaseUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignedInvestigator: Optional[str] = None
    assignedTeam: Optional[str] = None
    policeStation: Optional[str] = None
    jurisdiction: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None

class CaseAccessMetadata(BaseModel):
    classificationLevel: str = 'CONFIDENTIAL - LAW ENFORCEMENT ONLY'
    jurisdiction: str = 'State Police CID and Cyber Crime Division'
    accessRoleRequired: str = 'investigator'
    auditTrackingEnabled: bool = True
    retentionPeriodYears: int = 10

class CaseActivity(BaseModel):
    activityId: str
    caseId: str
    action: str
    performedBy: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    details: Dict[str, Any] = Field(default_factory=dict)

class CaseSummaryResponse(BaseModel):
    caseId: str
    title: str
    description: str
    assignedInvestigator: str
    assignedTeam: str
    status: str
    priority: str
    entityCount: int = 0
    relationshipCount: int = 0
    evidenceCount: int = 0
    reportCount: int = 0
    createdAt: str
    updatedAt: str

class CaseDetailResponse(BaseModel):
    caseId: str
    title: str
    description: str
    assignedInvestigator: str
    assignedTeam: str
    status: str
    priority: str
    entities: List[Dict[str, Any]] = Field(default_factory=list)
    relationships: List[Dict[str, Any]] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    reports: List[Dict[str, Any]] = Field(default_factory=list)
    recentActivity: List[CaseActivity] = Field(default_factory=list)
    accessMetadata: CaseAccessMetadata = Field(default_factory=CaseAccessMetadata)
    createdAt: str
    updatedAt: str
