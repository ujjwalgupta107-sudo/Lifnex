"""
BLOOD EMERGENCY REQUESTS REST API ROUTE
"""

from flask import Blueprint, request, jsonify
from backend.app.database.supabase_client import get_supabase_admin
from backend.app.validators import BloodRequestCreate
from backend.app.utils import log_audit_event
from pydantic import ValidationError

blood_requests_bp = Blueprint("blood_requests", __name__)

DEMO_BLOOD_REQUESTS = [
    {
        "id": "c1f72944-e22e-4b47-975f-2a3b7c846d02",
        "blood_group": "O-",
        "units_required": 2,
        "units_fulfilled": 0,
        "urgency_level": "critical",
        "status": "open",
        "verification_status": "verified",
        "hospital_name": "City Care Super Specialty Hospital",
        "city": "Metropolis",
        "clinical_notes": "Immediate trauma surgery resuscitation required.",
        "is_demo": True
    },
    {
        "id": "d2e83055-f33f-4c58-a86e-3b4c8d957e13",
        "blood_group": "B+",
        "units_required": 3,
        "units_fulfilled": 1,
        "urgency_level": "urgent",
        "status": "in_progress",
        "verification_status": "verified",
        "hospital_name": "Metro Central Trauma Center",
        "city": "Metropolis",
        "clinical_notes": "Orthopedic surgery preparation.",
        "is_demo": True
    }
]

@blood_requests_bp.route("", methods=["GET"])
def list_blood_requests():
    """
    Returns public open emergency blood requests
    """
    admin = get_supabase_admin()
    if not admin:
        return jsonify({
            "success": True,
            "data": DEMO_BLOOD_REQUESTS,
            "message": "Emergency requests retrieved (Synthetic demo mode)"
        }), 200

    try:
        query = admin.table("blood_requests").select("*, hospitals(name, city)").eq("status", "open").order("created_at", desc=True)
        res = query.execute()
        return jsonify({
            "success": True,
            "data": res.data if res.data else DEMO_BLOOD_REQUESTS,
            "message": "Active emergency blood requests retrieved."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

@blood_requests_bp.route("", methods=["POST"])
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

