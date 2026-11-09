"""
DONOR PROFILE & AVAILABILITY REST API ROUTE
"""

from flask import Blueprint, request, jsonify
from backend.app.core.supabase_client import get_supabase_admin
from backend.app.models.schemas import DonorProfileCreate, DonorProfileUpdate
from pydantic import ValidationError

donors_bp = Blueprint("donors", __name__)

@donors_bp.route("/availability", methods=["PATCH"])
def update_availability():
    """
    Toggles donor availability status (available, busy, inactive)
    """
    payload = request.get_json() or {}
    status = payload.get("availability_status")
    donor_id = payload.get("donor_id")

    if not status or status not in ['available', 'busy', 'inactive']:
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_STATUS", "message": "Status must be 'available', 'busy', or 'inactive'."}
        }), 400

    admin = get_supabase_admin()
    if not admin:
        return jsonify({
            "success": True,
            "data": {"donor_id": donor_id, "availability_status": status},
            "message": f"Availability updated to {status} (Demo mode)."
        }), 200

    try:
        res = admin.table("donor_profiles").update({"availability_status": status}).eq("id", donor_id).execute()
        return jsonify({
            "success": True,
            "data": res.data[0] if res.data else {},
            "message": "Availability status updated successfully."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_UPDATE_ERROR", "message": str(e)}}), 500

