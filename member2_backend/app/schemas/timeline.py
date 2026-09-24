from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class TimelineEvent(BaseModel):
    eventId: str
    timestamp: str
    eventType: str
    title: str
    description: str
    primaryEntityId: str
    primaryEntityName: str
    secondaryEntityId: Optional[str] = None
    secondaryEntityName: Optional[str] = None
    location: Optional[str] = None
    sourceDocument: str
    evidenceId: Optional[str] = None
    caseId: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class TimelineFilterRequest(BaseModel):
    entityId: Optional[str] = None
    caseId: Optional[str] = None
    eventTypes: Optional[List[str]] = None
    fromDate: Optional[str] = None
    toDate: Optional[str] = None
    location: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=1000)

class TimelinePlaybackFrame(BaseModel):
    frameIndex: int
    timestamp: str
    activeEvents: List[TimelineEvent] = Field(default_factory=list)
    activeNodes: List[str] = Field(default_factory=list)
    activeEdges: List[str] = Field(default_factory=list)

class TimelinePlaybackResponse(BaseModel):
    totalFrames: int
    startDate: str
    endDate: str
    frames: List[TimelinePlaybackFrame] = Field(default_factory=list)
