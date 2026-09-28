from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.schemas.auth import UserLoginRequest, TokenResponse, UserProfile, PermissionCheckRequest
from app.schemas.common import ResponseEnvelope
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client
from datetime import datetime, timedelta
from jose import jwt
from app.config import settings

router = APIRouter(prefix='/auth', tags=['Authentication & RBAC Integration'])

@router.post('/login', response_model=ResponseEnvelope[TokenResponse], summary='Investigator Authentication')
async def login(login_req: UserLoginRequest, m6_client: M6SecurityClient = Depends(get_m6_client)):
    # Supabase is the source of truth for login now.
    # The frontend should call Supabase signInWithPassword directly, not this endpoint.
    raise HTTPException(status_code=501, detail="Please use Supabase directly for authentication")

@router.get('/me', response_model=ResponseEnvelope[UserProfile], summary='Current User Profile')
async def get_me(current_user: UserProfile = Depends(get_current_user)):
    return ResponseEnvelope(data=current_user)

@router.post('/check-permission', response_model=ResponseEnvelope[dict], summary='RBAC Permission Evaluation')
async def check_permission(perm_req: PermissionCheckRequest, current_user: UserProfile = Depends(get_current_user)):
    has_perm = perm_req.requiredPermission in current_user.permissions or 'super_admin' in current_user.role
    return ResponseEnvelope(data={'hasPermission': has_perm, 'permission': perm_req.requiredPermission})
