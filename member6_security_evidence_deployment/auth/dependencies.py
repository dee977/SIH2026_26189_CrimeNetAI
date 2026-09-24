from fastapi import Depends, HTTPException, status, Header
from typing import List, Callable
from .supabase_client import get_supabase_client
import jwt
import os

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def get_token(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token")
    return authorization.split(" ")[1]

def get_current_user(token: str = Depends(get_token)):
    try:
        # We verify the JWT using the Supabase JWT secret
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return {"user_id": user_id, "email": payload.get("email")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

def require_permissions(required_permissions: List[str]) -> Callable:
    def permission_checker(current_user: dict = Depends(get_current_user)):
        supabase = get_supabase_client()
        user_id = current_user["user_id"]
        
        # In a real heavy-load scenario, this would be cached in Redis.
        # For security compliance, we check against the DB.
        
        # 1. Get role permissions
        res_profile = supabase.table("user_profiles").select("active_role_id").eq("user_id", user_id).execute()
        if not res_profile.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User profile not found")
            
        role_id = res_profile.data[0].get("active_role_id")
        
        granted_perms = set()
        
        if role_id:
            res_role_perms = supabase.table("role_permissions").select("permissions(name)").eq("role_id", role_id).execute()
            for rp in res_role_perms.data:
                perm = rp.get("permissions")
                if perm:
                    granted_perms.add(perm.get("name"))
                    
        # 2. Get custom permissions
        res_custom_perms = supabase.table("user_custom_permissions").select("permissions(name)").eq("user_id", user_id).execute()
        for cp in res_custom_perms.data:
            perm = cp.get("permissions")
            if perm:
                granted_perms.add(perm.get("name"))
                
        # 3. Check if user has ALL required permissions
        for req_perm in required_permissions:
            if req_perm not in granted_perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permission: {req_perm}"
                )
                
        return current_user
    return permission_checker
