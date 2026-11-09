"""
NOTIFICATION SERVICE MODULE
Handles internal alerts, dispatch notifications, and activity broadcasts
"""

import logging
from typing import Dict, Any, Optional
from backend.app.database.supabase_client import get_supabase_admin

logger = logging.getLogger(__name__)

def create_notification(
    recipient_id: str,
    title: str,
    message: str,
    notification_type: str = "emergency_alert",
    reference_request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Creates an in-app notification record in public.notifications
    """
    notif_record = {
        "recipient_id": recipient_id,
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "reference_request_id": reference_request_id,
        "is_read": False
    }

    admin = get_supabase_admin()
    if not admin:
        logger.info(f"[Demo Notification] To: {recipient_id} | Type: {notification_type} | Message: {message}")
        notif_record["id"] = "demo-notif-uuid"
        return notif_record

    try:
        res = admin.table("notifications").insert(notif_record).execute()
        return res.data[0] if res.data else notif_record
    except Exception as e:
        logger.error(f"Failed to persist notification: {e}")
        return notif_record

def notify_patient_of_donor_response(
    patient_id: str,
    donor_name: str,
    blood_group: str,
    request_id: str,
    eta_minutes: Optional[int] = None
) -> Dict[str, Any]:
    """
    Alerts patient when a donor accepts their emergency request
    """
    eta_text = f" ETA is approximately {eta_minutes} mins." if eta_minutes else ""
    title = f"Donor Matched ({blood_group})"
    message = f"Voluntary donor {donor_name} has accepted your emergency request for {blood_group} blood.{eta_text}"
    return create_notification(
        recipient_id=patient_id,
        title=title,
        message=message,
        notification_type="response_update",
        reference_request_id=request_id
    )

