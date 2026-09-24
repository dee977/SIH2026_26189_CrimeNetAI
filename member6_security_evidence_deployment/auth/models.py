from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class RoleRequestSubmit(BaseModel):
    requested_role_id: UUID
    request_reason: str

class RoleRequestReview(BaseModel):
    request_id: UUID
    status: str # 'APPROVED' or 'REJECTED'
    rejection_reason: Optional[str] = None
    custom_permissions: Optional[List[UUID]] = []

class UserProfileResponse(BaseModel):
    user_id: UUID
    first_name: str
    last_name: str
    department: str
    badge_number: str
    active_role_id: Optional[UUID]
    status: str
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
