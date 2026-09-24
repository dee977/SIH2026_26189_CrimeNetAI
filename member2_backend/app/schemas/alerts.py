from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class AlertTypeEnum(str):
    WATCHLIST_MATCH = 'Watchlist Match'
    ANOMALY = 'Anomaly'
    CONTRADICTION = 'Contradiction'
    NEW_RELATIONSHIP = 'New Relationship'
    EVIDENCE_INTEGRITY_MISMATCH = 'Evidence Integrity Mismatch'
    COMMUNICATION_PATTERN = 'Communication Pattern'
    TRANSACTION_PATTERN = 'Transaction Pattern'
    RELEVANT_CASE_CONNECTION = 'Relevant Case Connection'

class AlertSeverityEnum(str):
    CRITICAL = 'CRITICAL'
    HIGH = 'HIGH'
    MEDIUM = 'MEDIUM'
    LOW = 'LOW'

class AlertResponse(BaseModel):
    alertId: str
    alertType: str
    severity: str
    title: str
    description: str
    relatedEntityId: Optional[str] = None
    relatedEntityName: Optional[str] = None
    caseId: Optional[str] = None
    evidenceId: Optional[str] = None
    status: str = 'UNRESOLVED'
    triggeredAt: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AlertFilterRequest(BaseModel):
    alertType: Optional[str] = None
    severity: Optional[str] = None
    caseId: Optional[str] = None
    status: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=500)

class AlertAcknowledgeRequest(BaseModel):
    resolutionNotes: str
    status: str = 'RESOLVED'
