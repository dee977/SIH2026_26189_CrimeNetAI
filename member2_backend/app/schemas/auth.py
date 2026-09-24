from typing import List, Optional
from pydantic import BaseModel, Field

class RoleEnum(str):
    SUPER_ADMIN = 'super_admin'
    CHIEF_INVESTIGATOR = 'chief_investigator'
    LEAD_INVESTIGATOR = 'lead_investigator'
    ANALYST = 'analyst'
    FORENSIC_AUDITOR = 'forensic_auditor'
    VIEWER = 'viewer'

class UserLoginRequest(BaseModel):
    email: str = Field(..., description='Investigator email address')
    password: str = Field(..., description='Investigator password')

class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = 'Bearer'
    expiresInSeconds: int = 28800
    user: 'UserProfile'

class RoleDefinition(BaseModel):
    roleId: str
    roleName: str
    permissions: List[str] = Field(default_factory=list)

class UserProfile(BaseModel):
    userId: str
    email: str
    fullName: str
    badgeNumber: Optional[str] = None
    agencyUnit: str
    role: str
    permissions: List[str] = Field(default_factory=list)
    isActive: bool = True

class PermissionCheckRequest(BaseModel):
    userId: str
    requiredPermission: str
