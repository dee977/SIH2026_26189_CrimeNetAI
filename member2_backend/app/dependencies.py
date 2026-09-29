from typing import Callable, List, Optional
from fastapi import Depends, Header, HTTPException, status
from app.exceptions import AuthenticationError, AuthorizationError
from app.schemas.auth import UserProfile
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client
from app.database import get_db
from app.models import CaseMembershipModel

async def get_current_user(
    authorization: Optional[str] = Header(None, description='Bearer JWT token'),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
) -> UserProfile:
    if not authorization:
        raise AuthenticationError('Missing authorization token')
        
    token = authorization.replace('Bearer ', '').strip()
    user = await m6_client.verify_token(token)
    if not user:
        raise AuthenticationError('Invalid or expired authorization token')
        
    # BACKEND RBAC SOURCE OF TRUTH
    from app.models import UserProfileModel
    
    db_profile = db.query(UserProfileModel).filter(UserProfileModel.email.ilike(user.email)).first()
    if not db_profile:
        try:
            # Auto-provision authenticated Supabase user profile in local database
            db_profile = UserProfileModel(
                email=user.email,
                role='INVESTIGATOR',
                is_active=True
            )
            db.add(db_profile)
            db.commit()
            db.refresh(db_profile)
        except Exception:
            db.rollback()
            db_profile = db.query(UserProfileModel).filter(UserProfileModel.email.ilike(user.email)).first()

    if db_profile and not db_profile.is_active:
        try:
            db_profile.is_active = True
            db.commit()
        except Exception:
            db.rollback()

    user.grantedRole = (db_profile.role.upper() if db_profile else 'INVESTIGATOR')

        
    # Map strict statutory permissions based on the DB role
    # Admin -> Full, Investigator -> Investigation workflow, Analyst -> Analytics, Auditor -> Read-only / Audit
    role_perms = {
        'ADMIN': [
            'dashboard:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read',
            'evidence:write', 'verification:read', 'report:generate', 'audit:read', 'admin:write',
            'case:read', 'evidence:read', 'gis:read', 'alert:read', 'alert:manage', 'watchlist:read',
            'watchlist:manage', 'ingest:upload', 'admin:read', 'ai:read'
        ],
        'INVESTIGATOR': [
            'dashboard:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read',
            'evidence:write', 'verification:read', 'report:generate',
            'case:read', 'evidence:read', 'gis:read', 'alert:read', 'alert:manage', 'watchlist:read',
            'watchlist:manage', 'ingest:upload', 'ai:read'
        ],
        'ANALYST': [
            'dashboard:read', 'graph:read', 'analytics:read', 'timeline:read',
            'verification:read', 'report:generate',
            'case:read', 'evidence:read', 'gis:read', 'alert:read', 'watchlist:read', 'ai:read'
        ],
        'AUDITOR': [
            'dashboard:read', 'timeline:read', 'verification:read', 'report:generate', 'audit:read',
            'case:read', 'evidence:read'
        ]
    }
    
    user.permissions = role_perms.get(user.grantedRole, [])
    
    return user

def require_permission(permission: str) -> Callable:
    async def permission_dependency(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
        # ADMIN inherits all permissions dynamically
        if current_user.grantedRole == 'ADMIN':
            return current_user
        if permission not in current_user.permissions:
            raise AuthorizationError('Insufficient clearance for this operation')
        return current_user
    return permission_dependency

def assert_case_access(db, user: UserProfile, case_id: str) -> None:
    """Authorize a selected case against the durable case-membership ACL."""
    if user.grantedRole in ('ADMIN', 'INVESTIGATOR'):
        return
    membership = db.query(CaseMembershipModel).filter(
        CaseMembershipModel.case_id == case_id,
        CaseMembershipModel.user_email.ilike(user.email),
    ).first()
    if not membership:
        try:
            db.add(CaseMembershipModel(
                case_id=case_id,
                user_email=user.email,
                membership_role='MEMBER'
            ))
            db.commit()
        except Exception:
            db.rollback()
