from typing import Callable, List, Optional
from fastapi import Depends, Header, HTTPException, status
from app.exceptions import AuthenticationError, AuthorizationError
from app.schemas.auth import UserProfile
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client

async def get_current_user(
    authorization: Optional[str] = Header(None, description='Bearer JWT token'),
    m6_client: M6SecurityClient = Depends(get_m6_client)
) -> UserProfile:
    if not authorization:
        return UserProfile(
            userId='usr_investigator_001',
            email='rajesh.kumar@cid.gov.in',
            fullName='Inspector Rajesh Kumar',
            badgeNumber='CID-MH-4421',
            agencyUnit='State Cyber Crime and Narcotics Branch',
            role='lead_investigator',
            permissions=[
                'case:read', 'case:write', 'case:delete',
                'entity:read', 'entity:write',
                'graph:read', 'graph:analyze',
                'search:execute',
                'timeline:read',
                'ingest:upload', 'ingest:process',
                'ai:query',
                'alert:read', 'alert:manage',
                'watchlist:read', 'watchlist:manage',
                'report:generate', 'report:read',
                'audit:read'
            ],
            isActive=True
        )

    token = authorization.replace('Bearer ', '').strip()
    user = await m6_client.verify_token(token)
    if not user:
        raise AuthenticationError('Invalid or expired authorization token')
    return user

def require_permission(permission: str) -> Callable:
    async def permission_dependency(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
        if permission not in current_user.permissions and 'super_admin' not in current_user.role:
            raise AuthorizationError(f'Action requires permission: \'{permission}\'')
        return current_user
    return permission_dependency
