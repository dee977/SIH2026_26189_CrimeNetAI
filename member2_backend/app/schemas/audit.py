from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class AuditLogEntry(BaseModel):
    logId: str
    userId: str
    userName: str
    action: str
    endpoint: str
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    caseId: Optional[str] = None
    resourceId: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str

class AuditLogQuery(BaseModel):
    userId: Optional[str] = None
    caseId: Optional[str] = None
    action: Optional[str] = None
    fromDate: Optional[str] = None
    toDate: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=500)
    offset: int = Field(default=0, ge=0)
