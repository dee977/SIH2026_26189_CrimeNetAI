from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime

class AuditLogCreate(BaseModel):
    user_id: Optional[UUID] = None
    action: str
    resource_type: str
    resource_id: Optional[UUID] = None
    result: str
    context: Optional[dict] = {}
