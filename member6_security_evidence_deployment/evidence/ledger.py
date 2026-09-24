from uuid import UUID
from datetime import datetime
import hashlib
from ..auth.supabase_client import get_supabase_client
from ..audit.logger import log_audit_event
from ..audit.models import AuditLogCreate

def append_to_ledger(evidence_id: str, action: str, actor_id: str, current_evidence_hash: str, chain_metadata: dict = None):
    """
    Appends a new cryptographically secure record to the evidence ledger.
    current_record_hash = SHA-256(previous_hash + evidence_hash + timestamp + action)
    """
    supabase = get_supabase_client()
    
    if chain_metadata is None:
        chain_metadata = {}
        
    # Get previous ledger entry for this evidence to chain the hash
    res = supabase.table("evidence_ledger").select("current_record_hash").eq("evidence_id", evidence_id).order("timestamp", desc=True).limit(1).execute()
    
    previous_hash = res.data[0]["current_record_hash"] if res.data else "GENESIS"
    
    timestamp = datetime.utcnow().isoformat()
    
    # Calculate new record hash
    raw_data = f"{previous_hash}{current_evidence_hash}{timestamp}{action}".encode('utf-8')
    current_record_hash = hashlib.sha256(raw_data).hexdigest()
    
    ledger_data = {
        "evidence_id": evidence_id,
        "action": action,
        "actor_id": actor_id,
        "timestamp": timestamp,
        "previous_hash": previous_hash,
        "evidence_hash": current_evidence_hash,
        "current_record_hash": current_record_hash,
        "chain_metadata": chain_metadata
    }
    
    supabase.table("evidence_ledger").insert(ledger_data).execute()
    
    # Audit log
    log_audit_event(AuditLogCreate(
        user_id=UUID(actor_id) if actor_id else None,
        action=f"LEDGER_APPEND_{action}",
        resource_type="EVIDENCE",
        resource_id=UUID(evidence_id),
        result="SUCCESS"
    ))
