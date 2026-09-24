from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from .integrity import verify_evidence_integrity, calculate_sha256
from .ledger import append_to_ledger
from .bsa_certificate import generate_bsa_certificate
from ..auth.dependencies import get_current_user, require_permissions
from ..auth.supabase_client import get_supabase_client
from ..audit.logger import log_audit_event
from ..audit.models import AuditLogCreate
import os

router = APIRouter(prefix="/evidence", tags=["Evidence Integrity & Chain of Custody"])

@router.post("/{evidence_id}/verify", dependencies=[Depends(require_permissions(["verify_evidence"]))])
def verify_evidence(evidence_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    res = supabase.table("evidence").select("*").eq("id", evidence_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Evidence not found")
        
    evidence_data = res.data[0]
    file_path = evidence_data["file_path"]
    original_hash = evidence_data["original_sha256"]
    
    # In a real system, the file path would be retrieved from secure storage (e.g. S3/MinIO)
    # Here we mock the file path reading assuming local storage for demo.
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Evidence file missing from secure storage")
        
    current_hash = calculate_sha256(file_path)
    is_valid = (current_hash == original_hash)
    new_status = "VERIFIED" if is_valid else "TAMPERED"
    
    # Update status
    supabase.table("evidence").update({"verification_status": new_status}).eq("id", evidence_id).execute()
    
    # Append to Ledger
    append_to_ledger(
        evidence_id=evidence_id,
        action="VERIFY",
        actor_id=current_user["user_id"],
        current_evidence_hash=current_hash
    )
    
    return {
        "evidence_id": evidence_id,
        "status": new_status,
        "original_hash": original_hash,
        "current_hash": current_hash,
        "match": is_valid
    }

@router.get("/{evidence_id}/certificate", dependencies=[Depends(require_permissions(["export_evidence"]))])
def get_evidence_certificate(evidence_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    
    res = supabase.table("evidence").select("*").eq("id", evidence_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    evidence_data = res.data[0]
    
    # Check case level access here (if implemented as a separate table relation)
    # The RLS would naturally handle this if we were relying purely on frontend queries, 
    # but since this is a backend service endpoint, we ensure the query executes safely.
    
    ledger_res = supabase.table("evidence_ledger").select("*").eq("evidence_id", evidence_id).order("timestamp", desc=False).execute()
    
    # Generate PDF
    pdf_buffer = generate_bsa_certificate(evidence_data, ledger_res.data)
    
    # Audit log
    log_audit_event(AuditLogCreate(
        user_id=current_user["user_id"],
        action="GENERATE_BSA_CERTIFICATE",
        resource_type="EVIDENCE",
        resource_id=evidence_id,
        result="SUCCESS"
    ))
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=evidence_certificate_{evidence_id}.pdf"}
    )
