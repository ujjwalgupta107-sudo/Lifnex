"""
NOTIFICATIONS REST API ROUTE (PHASE 7)
Allows authenticated users (patients, donors, hospitals, admins) to:
- List their in-app notifications
- Mark individual notifications as read
- Mark all notifications as read
- Query unread notification count
Enforces strict owner-access verification.
"""

from flask import Blueprint, request, jsonify, g
from backend.app.database.supabase_client import get_supabase_admin
from backend.app.utils.auth_guard import require_auth
from backend.app.services.notification_service import create_notification

notifications_bp = Blueprint("notifications", __name__)

# Fallback synthetic notifications store for demo/test modes
DEMO_NOTIFICATIONS = [
    {
        "id": "notif-uuid-1",
        "recipient_id": "demo-user-patient-id",
        "title": "Donor Dispatched",
        "message": "A verified O- donor accepted your requisition and is en route (ETA ~25 mins).",
        "notification_type": "response_update",
        "reference_request_id": "c1f72944-e22e-4b47-975f-2a3b7c846d02",
        "is_read": False,
        "created_at": "2026-11-09T18:00:00Z"
    },
    {
        "id": "notif-uuid-2",
        "recipient_id": "demo-user-donor-id",
        "title": "Matching Emergency Request",
        "message": "New critical emergency requisition for O- blood within 4.2 km.",
        "notification_type": "emergency_alert",
        "reference_request_id": "c1f72944-e22e-4b47-975f-2a3b7c846d02",
        "is_read": False,
        "created_at": "2026-11-09T17:50:00Z"
    }
]

@notifications_bp.route("", methods=["GET"])
@require_auth
def get_user_notifications():
    """
    Returns notifications for the current authenticated user.
    Supports query parameter: ?unread_only=true
    """
    user_id = g.user.get("id")
    unread_only = request.args.get("unread_only", "").lower() == "true"

    admin = get_supabase_admin()
    if not admin:
        user_notifs = [n for n in DEMO_NOTIFICATIONS if n.get("recipient_id") == user_id]
        if unread_only:
            user_notifs = [n for n in user_notifs if not n.get("is_read")]
        unread_count = sum(1 for n in user_notifs if not n.get("is_read"))
        return jsonify({
            "success": True,
            "data": user_notifs,
            "unread_count": unread_count
        }), 200

    try:
        query = admin.table("notifications").select("*").eq("recipient_id", user_id).order("created_at", desc=True)
        if unread_only:
            query = query.eq("is_read", False)
        res = query.execute()

        notifications = res.data or []
        unread_count = sum(1 for n in notifications if not n.get("is_read"))

        return jsonify({
            "success": True,
            "data": notifications,
            "unread_count": unread_count
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

@notifications_bp.route("/<notification_id>/read", methods=["PATCH"])
@require_auth
def mark_notification_read(notification_id: str):
    """
    Marks a single notification as read, ensuring the user owns the notification.
    """
    user_id = g.user.get("id")

    admin = get_supabase_admin()
    if not admin:
        for n in DEMO_NOTIFICATIONS:
            if n["id"] == notification_id:
                if n["recipient_id"] != user_id and g.user.get("role") != "admin":
                    return jsonify({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied."}}), 403
                n["is_read"] = True
                return jsonify({"success": True, "message": "Notification marked as read."}), 200
        return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Notification not found."}}), 404

    try:
        # Check ownership
        res = admin.table("notifications").select("recipient_id").eq("id", notification_id).execute()
        if not res.data:
            return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Notification not found."}}), 404

        if res.data[0]["recipient_id"] != user_id and g.user.get("role") != "admin":
            return jsonify({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied."}}), 403

        admin.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
        return jsonify({"success": True, "message": "Notification marked as read."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

@notifications_bp.route("/mark-all-read", methods=["PATCH"])
@require_auth
def mark_all_notifications_read():
    """
    Marks all notifications for the current authenticated user as read.
    """
    user_id = g.user.get("id")

    admin = get_supabase_admin()
    if not admin:
        for n in DEMO_NOTIFICATIONS:
            if n.get("recipient_id") == user_id:
                n["is_read"] = True
        return jsonify({"success": True, "message": "All notifications marked as read."}), 200

    try:
        admin.table("notifications").update({"is_read": True}).eq("recipient_id", user_id).eq("is_read", False).execute()
        return jsonify({"success": True, "message": "All notifications marked as read."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

