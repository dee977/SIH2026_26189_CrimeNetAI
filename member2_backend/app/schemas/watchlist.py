from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class WatchlistAddRequest(BaseModel):
    entityType: str = Field(..., description='Person | Phone | BankAccount | Vehicle | Organization')
    identifierValue: str = Field(..., description='Name, Phone number, Account number, Registration, or Org Name')
    reason: str = Field(..., description='Investigative reason for monitoring')
    priority: str = Field(default='high', description='low | medium | high | critical')
    caseId: Optional[str] = None

class WatchlistRemoveRequest(BaseModel):
    watchId: str
    removalReason: str

class WatchlistItemResponse(BaseModel):
    watchId: str
    entityType: str
    identifierValue: str
    canonicalName: str
    reason: str
    priority: str
    caseId: Optional[str] = None
    addedBy: str
    addedAt: str
    isActive: bool = True
    matchCount: int = 0
    authorizedCaseCount: int = 0
    authorizedCases: List[str] = Field(default_factory=list)

class WatchlistHistoryItem(BaseModel):
    historyId: str
    watchId: str
    action: str
    performedBy: str
    timestamp: str
    details: Dict[str, Any] = Field(default_factory=dict)
