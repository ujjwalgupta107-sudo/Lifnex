"""
BLOOD EMERGENCY REQUESTS REST API ROUTE
"""

from flask import Blueprint, request, jsonify
from backend.app.core.supabase_client import get_supabase_admin, get_supabase_anon
from backend.app.models.schemas import BloodRequestCreate
from backend.app.services.audit_service import log_audit_event
from pydantic import ValidationError

requests_bp = Blueprint("requests", __name__)

@requests_bp.route("", methods=["GET"])
def list_blood_requests():
    """
    Returns public open emergency blood requests
    """
    admin = get_supabase_admin()
    if not admin:
        # Return fallback structured demo response if credentials not yet linked
        return jsonify({
            "success": True,
            "data": [
                {
                    "id": "REQ-701-DEMO",
                    "blood_group": "O-",
                    "units_required": 2,
                    "units_fulfilled": 0,
                    "urgency_level": "critical",
                    "status": "open",
                    "verification_status": "verified",
                    "hospital_name": "City Care Super Specialty Hospital",
                    "city": "Metropolis",
                    "is_demo": True
                }
            ],
            "message": "Public emergency requests retrieved (Demo mode)"
        }), 200

    try:
        query = admin.table("blood_requests").select("*, hospitals(name, city)").eq("status", "open").order("created_at", desc=True)
        res = query.execute()
        return jsonify({
            "success": True,
            "data": res.data,
            "message": "Active emergency blood requests retrieved."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

@requests_bp.route("", methods=["POST"])
def create_blood_request():
    """
    Creates an emergency blood requisition record
    """
    payload = request.get_json() or {}
    try:
        req_data = BloodRequestCreate(**payload)
    except ValidationError as err:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request schema parameters.",
                "details": err.errors()
            }
        }), 400

    admin = get_supabase_admin()
    if not admin:
        return jsonify({
            "success": True,
            "data": req_data.model_dump(),
            "message": "Emergency request validated successfully (Demo dry-run mode)."
        }), 201

    try:
        res = admin.table("blood_requests").insert(req_data.model_dump()).execute()
        created = res.data[0] if res.data else req_data.model_dump()
        log_audit_event(
            action="REQUEST_CREATED",
            entity_type="blood_requests",
            entity_id=created.get("id"),
            actor_id=req_data.patient_id,
            client_ip=request.remote_addr,
            new_values=created
        )
        return jsonify({
            "success": True,
            "data": created,
            "message": "Emergency blood request broadcast successfully."
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_INSERT_ERROR", "message": str(e)}}), 500

