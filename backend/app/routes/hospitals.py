"""
HOSPITALS & BLOOD BANKS DIRECTORY ROUTE
"""

from flask import Blueprint, request, jsonify, g, current_app
from pydantic import ValidationError
from backend.app.database.supabase_client import get_supabase_admin
from backend.app.utils.auth_guard import require_auth, require_roles
from backend.app.utils.audit_logger import log_audit_event
from backend.app.validators.schemas import HospitalCreate

hospitals_bp = Blueprint("hospitals", __name__)

# Fallback synthetic demo hospital dataset when running offline/unconfigured
DEMO_HOSPITALS = [
    {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "name": "City Care Super Specialty Hospital",
        "license_number": "DEMO-HOSP-2026-091",
        "address": "142 Medical Enclave, Central Ave",
        "city": "Metropolis",
        "latitude": 28.6145,
        "longitude": 77.2100,
        "emergency_phone": "+1 (555) 019-2831",
        "contact_person": "Dr. Arthur Vance",
        "has_blood_bank": True,
        "is_verified": True,
        "current_inventory_status": {"O-": 2, "B+": 8, "A+": 12, "AB+": 4}
    },
    {
        "id": "b1ffcd88-8b1a-4fe7-aa5c-5aa8ac270b22",
        "name": "Metro Central Trauma Center",
        "license_number": "DEMO-HOSP-2026-114",
        "address": "88 Emergency Bypass Blvd, Sector 4",
        "city": "Metropolis",
        "latitude": 28.6220,
        "longitude": 77.2005,
        "emergency_phone": "+1 (555) 019-4422",
        "contact_person": "Dr. Elena Rostova",
        "has_blood_bank": True,
        "is_verified": True,
        "current_inventory_status": {"O-": 1, "O+": 14, "B-": 3, "A-": 5}
    },
    {
        "id": "c2eedc77-7a2b-4ed6-994b-4bb7ab160c33",
        "name": "St. Jude Memorial Blood Bank",
        "license_number": "DEMO-BANK-2026-003",
        "address": "12 Harmony Square, South District",
        "city": "Metropolis",
        "latitude": 28.6080,
        "longitude": 77.2180,
        "emergency_phone": "+1 (555) 019-7788",
        "contact_person": "Chief Officer Marcus Brody",
        "has_blood_bank": True,
        "is_verified": True,
        "current_inventory_status": {"all_types": "Cold Storage Active"}
    }
]

@hospitals_bp.route("", methods=["GET"])
def list_hospitals():
    """
    Returns verified hospitals and blood banks with optional city filtering
    """
    city = request.args.get("city", "").strip()
    admin = get_supabase_admin()

    if not admin or current_app.config.get("TESTING"):
        filtered = [h for h in DEMO_HOSPITALS if not city or city.lower() in h.get("city", "").lower()]
        return jsonify({
            "success": True,
            "data": filtered,
            "message": "Hospitals directory retrieved (Synthetic demo mode)"
        }), 200

    try:
        query = admin.table("hospitals").select("*").eq("is_verified", True)
        if city:
            query = query.ilike("city", f"%{city}%")
        res = query.execute()
        return jsonify({
            "success": True,
            "data": res.data if res.data else [h for h in DEMO_HOSPITALS if not city or city.lower() in h.get("city", "").lower()],
            "message": "Verified hospitals retrieved successfully."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

@hospitals_bp.route("", methods=["POST"])
@require_roles("hospital", "admin")
def register_hospital():
    """
    Registers a new healthcare facility or blood bank.
    By default, requires admin verification before appearing on public feeds.
    """
    body = request.get_json() or {}
    # Bind user_id to authenticated caller if not admin
    if g.user.get("role") != "admin":
        body["user_id"] = g.user.get("id")

    try:
        data = HospitalCreate(**body)
    except ValidationError as err:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid hospital registration parameters.",
                "details": err.errors()
            }
        }), 400

    admin = get_supabase_admin()
    is_verified = True if g.user.get("role") == "admin" else False

    if not admin or current_app.config.get("TESTING") or g.user.get("is_demo"):
        new_hosp = data.model_dump()
        new_hosp["id"] = f"demo-hosp-{len(DEMO_HOSPITALS) + 1}"
        new_hosp["is_verified"] = is_verified
        DEMO_HOSPITALS.append(new_hosp)
        return jsonify({
            "success": True,
            "data": new_hosp,
            "message": "Hospital registered successfully (Demo mode)."
        }), 201

    try:
        hosp_record = data.model_dump()
        hosp_record["is_verified"] = is_verified
        res = admin.table("hospitals").insert(hosp_record).execute()
        created = res.data[0] if res.data else hosp_record

        log_audit_event(
            action="HOSPITAL_REGISTERED",
            entity_type="hospitals",
            entity_id=created.get("id"),
            actor_id=g.user.get("id"),
            client_ip=request.remote_addr,
            new_values={"name": data.name, "license_number": data.license_number}
        )

        return jsonify({
            "success": True,
            "data": created,
            "message": "Hospital registered successfully and queued for clinical accreditation."
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

@hospitals_bp.route("/<hospital_id>/verify", methods=["PATCH"])
@require_roles("admin")
def verify_hospital(hospital_id: str):
    """
    Clinical accreditation endpoint: Administrator approves a hospital or blood bank.
    """
    admin = get_supabase_admin()
    if not admin or current_app.config.get("TESTING") or g.user.get("is_demo"):
        for h in DEMO_HOSPITALS:
            if h.get("id") == hospital_id:
                h["is_verified"] = True
                return jsonify({
                    "success": True,
                    "data": h,
                    "message": "Hospital verified successfully (Demo mode)."
                }), 200
        return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Hospital not found."}}), 404

    try:
        res = admin.table("hospitals").update({"is_verified": True}).eq("id", hospital_id).execute()
        if not res.data:
            return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Hospital not found."}}), 404

        log_audit_event(
            action="HOSPITAL_VERIFIED",
            entity_type="hospitals",
            entity_id=hospital_id,
            actor_id=g.user.get("id"),
            client_ip=request.remote_addr
        )

        return jsonify({
            "success": True,
            "data": res.data[0],
            "message": "Hospital accreditation approved and verified successfully."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

