from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from .models import RoleRequestSubmit, RoleRequestReview
from .dependencies import get_current_user, require_permissions
from .supabase_client import get_supabase_client
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])

@router.post("/role-request", status_code=status.HTTP_201_CREATED)
def submit_role_request(request: RoleRequestSubmit, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    # Check if a pending request already exists
    existing = supabase.table("role_requests").select("id").eq("user_id", current_user["user_id"]).eq("status", "PENDING_APPROVAL").execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="You already have a pending role request.")
        
    data = {
        "user_id": current_user["user_id"],
        "requested_role_id": str(request.requested_role_id),
        "request_reason": request.request_reason,
        "status": "PENDING_APPROVAL"
    }
    
    res = supabase.table("role_requests").insert(data).execute()
    return {"message": "Role request submitted successfully", "request": res.data[0]}


@router.post("/role-request/review", dependencies=[Depends(require_permissions(["approve_role_requests"]))])
def review_role_request(review: RoleRequestReview, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    # Fetch request
    req_res = supabase.table("role_requests").select("*").eq("id", str(review.request_id)).execute()
    if not req_res.data:
        raise HTTPException(status_code=404, detail="Role request not found")
        
    role_request = req_res.data[0]
    if role_request["status"] != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail="Request is already processed")
        
    target_user_id = role_request["user_id"]
    requested_role_id = role_request["requested_role_id"]
    
    update_data = {
        "status": review.status,
        "reviewer_id": current_user["user_id"],
        "rejection_reason": review.rejection_reason,
        "reviewed_at": datetime.utcnow().isoformat()
    }
    
    # Update request status
    supabase.table("role_requests").update(update_data).eq("id", str(review.request_id)).execute()
    
    if review.status == "APPROVED":
        # 1. Update user profile active role
        supabase.table("user_profiles").update({
            "active_role_id": requested_role_id,
            "status": "ACTIVE"
        }).eq("user_id", target_user_id).execute()
        
        # 2. Insert custom permissions if any
        if review.custom_permissions:
            custom_perms_data = [
                {
                    "user_id": target_user_id,
                    "permission_id": str(p_id),
                    "granted_by": current_user["user_id"]
                }
                for p_id in review.custom_permissions
            ]
            supabase.table("user_custom_permissions").insert(custom_perms_data).execute()
            
    # Audit log should be triggered here or via DB triggers.
    return {"message": f"Role request {review.status.lower()} successfully."}
