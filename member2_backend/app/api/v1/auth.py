from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.schemas.auth import UserLoginRequest, TokenResponse, UserProfile, PermissionCheckRequest
from app.schemas.common import ResponseEnvelope
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client

router = APIRouter(prefix='/auth', tags=['Authentication & RBAC Integration'])

@router.post('/login', response_model=ResponseEnvelope[TokenResponse], summary='Investigator Authentication')
async def login(login_req: UserLoginRequest, m6_client: M6SecurityClient = Depends(get_m6_client)):
    role = login_req.role or ('System Administrator' if 'admin' in login_req.email.lower() else ('Senior Authority' if 'authority' in login_req.email.lower() else 'Senior Investigator'))
    token = f'mock-jwt-role:{role.replace(" ", "_")}'
    user = await m6_client.verify_token(token)
    if not user:
        user = UserProfile(
            userId='usr_investigator_001',
            email=login_req.email,
            fullName=f'Authorized Officer ({role})',
            badgeNumber='CID-MH-4421',
            agencyUnit='State Cyber Crime and Narcotics Branch',
            role='super_admin' if 'admin' in role.lower() else 'lead_investigator',
            grantedRole=role,
            permissions=['cases', 'graph', 'evidence', 'timeline', 'ai', 'export', 'alerts', 'gis', 'search', 'admin', 'authority'] if 'admin' in role.lower() else ['cases', 'graph', 'evidence', 'timeline', 'ai', 'export', 'alerts', 'gis', 'search'],
            isActive=True
        )

    token_resp = TokenResponse(
        accessToken=token,
        tokenType='Bearer',
        expiresInSeconds=28800,
        user=user
    )
    await m6_client.log_audit_event({
        'logId': 'LOG-AUTH-01',
        'userId': user.userId,
        'userName': user.fullName,
        'action': 'USER_LOGIN',
        'endpoint': '/api/v1/auth/login',
        'details': {'email': login_req.email, 'role': role}
    })
    return ResponseEnvelope(data=token_resp)

@router.get('/me', response_model=ResponseEnvelope[UserProfile], summary='Current User Profile')
async def get_me(current_user: UserProfile = Depends(get_current_user)):
    return ResponseEnvelope(data=current_user)

@router.post('/check-permission', response_model=ResponseEnvelope[dict], summary='RBAC Permission Evaluation')
async def check_permission(perm_req: PermissionCheckRequest, current_user: UserProfile = Depends(get_current_user)):
    has_perm = perm_req.requiredPermission in current_user.permissions or 'super_admin' in current_user.role
    return ResponseEnvelope(data={'hasPermission': has_perm, 'permission': perm_req.requiredPermission})
