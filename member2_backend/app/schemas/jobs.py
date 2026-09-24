from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

class BackgroundJobCreateResponse(BaseModel):
    jobId: str
    jobType: str
    status: str = 'Queued'
    queuedAt: str
    message: str

class BackgroundJobStatusResponse(BaseModel):
    jobId: str
    jobType: str
    status: str
    progressPercent: int = 0
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    errorInfo: Optional[str] = None
    resultData: Optional[Dict[str, Any]] = None
