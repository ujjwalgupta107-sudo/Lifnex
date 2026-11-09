"""
AUDIT LOGGING SERVICE
Writes tamper-evident audit records to public.audit_logs via Supabase client
"""

import logging
from typing import Optional, Dict, Any
from backend.app.core.supabase_client import get_supabase_admin

logger = logging.getLogger(__name__)

def log_audit_event(
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    client_ip: Optional[str] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Records an immutable audit entry in PostgreSQL.
    """
    admin = get_supabase_admin()
    if not admin:
        logger.warning(f"Audit log skipped (Supabase unconfigured): {action} on {entity_type}")
        return False

    try:
        admin.table("audit_logs").insert({
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "actor_id": actor_id,
            "client_ip": client_ip,
            "old_values": old_values,
            "new_values": new_values
        }).execute()
        return True
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        return False

