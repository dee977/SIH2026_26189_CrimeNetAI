from .models import AuditLogCreate
from ..auth.supabase_client import get_supabase_client
import logging

logger = logging.getLogger(__name__)

def log_audit_event(event: AuditLogCreate):
    """
    Logs an audit event to the database securely.
    If database logging fails, falls back to standard python logging.
    """
    try:
        supabase = get_supabase_client()
        data = {
            "user_id": str(event.user_id) if event.user_id else None,
            "action": event.action,
            "resource_type": event.resource_type,
            "resource_id": str(event.resource_id) if event.resource_id else None,
            "result": event.result,
            "context": event.context
        }
        supabase.table("audit_logs").insert(data).execute()
    except Exception as e:
        logger.error(f"Failed to write audit log to database: {str(e)}. Event: {event.dict()}")
