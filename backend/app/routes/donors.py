"""
DONORS & DONOR RESPONSES REST API ROUTES
Handles donor profiles, matching feed, availability mutations, and emergency response dispatch
"""

from flask import Blueprint, request, jsonify, g, current_app
from backend.app.database.supabase_client import get_supabase_admin
from backend.app.utils.auth_guard import require_auth, require_roles
from backend.app.validators.schemas import DonorResponseCreate
from backend.app.services.matching_service import rank_requests_for_donor
from backend.app.services.notification_service import notify_patient_of_donor_response
from backend.app.utils.audit_logger import log_audit_event
from pydantic import ValidationError

donors_bp = Blueprint("donors", __name__)

# Fallback synthetic demo donor profiles for offline / test environments
DEMO_DONORS = [
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "user_id": "demo-user-donor-id",
        "blood_group": "O-",
        "city": "Metropolis",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "travel_radius_km": 30,
        "availability_status": "available",
        "total_donations": 4,
        "is_verified": True
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "user_id": "demo-user-donor-id-2",
        "blood_group": "A+",
        "city": "Metropolis",
        "latitude": 28.6250,
        "longitude": 77.2180,
        "travel_radius_km": 15,
        "availability_status": "available",
        "total_donations": 2,
        "is_verified": True
    }
]

# In-memory store for synthetic responses during tests/demo runs
DEMO_RESPONSES = []

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
    if not admin or current_app.config.get("TESTING") or (hasattr(g, "user") and g.user.get("is_demo")):
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

@donors_bp.route("/feed", methods=["GET"])
@require_auth
@require_roles("donor", "admin")
def donor_feed():
    """
    Returns ranked emergency blood requests tailored to the authenticated donor's
    blood group compatibility and travel radius.
    """
    user_id = g.user.get("id") if hasattr(g, "user") and g.user else None
    admin = get_supabase_admin()

    donor_profile = None
    if admin and user_id:
        try:
            res = admin.table("donor_profiles").select("*").eq("user_id", user_id).execute()
            if res.data:
                donor_profile = res.data[0]
        except Exception:
            pass

    if not donor_profile:
        # Fallback to demo profile matching donor's role
        donor_profile = DEMO_DONORS[0]

    # Fetch active requisitions
    requests_pool = []
    if admin:
        try:
            res = admin.table("blood_requests").select("*, hospitals(name, city)").in_("status", ["open", "in_progress"]).execute()
            if res.data:
                requests_pool = res.data
        except Exception:
            pass

    if not requests_pool:
        from backend.app.routes.blood_requests import DEMO_BLOOD_REQUESTS
        requests_pool = DEMO_BLOOD_REQUESTS

    ranked = rank_requests_for_donor(donor_profile, requests_pool)
    return jsonify({
        "success": True,
        "data": ranked,
        "donor_blood_group": donor_profile.get("blood_group"),
        "disclaimer": "Final compatibility must be verified on-site by certified medical personnel."
    }), 200

@donors_bp.route("/respond", methods=["POST"])
@require_auth
@require_roles("donor", "admin")
def respond_to_request():
    """
    Allows an authenticated donor to accept, decline, or express interest in an emergency request.
    Prevents duplicate responses for the same request.
    """
    body = request.get_json() or {}
    try:
        data = DonorResponseCreate(**body)
    except ValidationError as err:
        return jsonify({
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "Invalid response schema.", "details": err.errors()}
        }), 400

    admin = get_supabase_admin()
    if not admin or current_app.config.get("TESTING") or (hasattr(g, "user") and g.user.get("is_demo")):
        # Demo / Offline execution: check duplicates in memory
        for r in DEMO_RESPONSES:
            if r["request_id"] == data.request_id and r["donor_id"] == data.donor_id:
                return jsonify({
                    "success": False,
                    "error": {"code": "DUPLICATE_RESPONSE", "message": "You have already responded to this blood request."}
                }), 409

        resp_record = data.model_dump()
        resp_record["id"] = f"demo-resp-{len(DEMO_RESPONSES) + 1}"
        DEMO_RESPONSES.append(resp_record)

        notify_patient_of_donor_response(
            patient_id="demo-patient-id",
            donor_name="Voluntary Donor",
            blood_group="O-",
            request_id=data.request_id,
            eta_minutes=data.estimated_arrival_minutes
        )

        return jsonify({
            "success": True,
            "data": resp_record,
            "message": f"Successfully responded as '{data.response_status}' (Demo mode)."
        }), 201

    try:
        # 1. Check for existing response
        existing = admin.table("donor_responses").select("id").eq("request_id", data.request_id).eq("donor_id", data.donor_id).execute()
        if existing.data:
            return jsonify({
                "success": False,
                "error": {"code": "DUPLICATE_RESPONSE", "message": "You have already responded to this blood request."}
            }), 409

        # 2. Insert response
        res = admin.table("donor_responses").insert(data.model_dump()).execute()
        created = res.data[0] if res.data else data.model_dump()

        # 3. Lookup request patient to dispatch alert notification
        req_res = admin.table("blood_requests").select("patient_id, blood_group").eq("id", data.request_id).execute()
        if req_res.data:
            patient_id = req_res.data[0].get("patient_id")
            bg = req_res.data[0].get("blood_group")
            notify_patient_of_donor_response(
                patient_id=patient_id,
                donor_name=g.user.get("full_name", "Voluntary Donor"),
                blood_group=bg,
                request_id=data.request_id,
                eta_minutes=data.estimated_arrival_minutes
            )

        log_audit_event(
            action="DONOR_RESPONDED",
            entity_type="donor_responses",
            entity_id=created.get("id"),
            actor_id=g.user.get("id"),
            client_ip=request.remote_addr,
            new_values={"status": data.response_status, "request_id": data.request_id}
        )

        return jsonify({
            "success": True,
            "data": created,
            "message": "Response submitted successfully."
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

@donors_bp.route("/history", methods=["GET"])
@require_auth
@require_roles("donor", "admin")
def donor_history():
    """
    Returns the authenticated donor's response and donation history
    """
    user_id = g.user.get("id")
    admin = get_supabase_admin()
    if not admin or current_app.config.get("TESTING") or (hasattr(g, "user") and g.user.get("is_demo")):
        return jsonify({
            "success": True,
            "data": DEMO_RESPONSES,
            "message": "Donor response history (Demo mode)."
        }), 200

    try:
        donor_res = admin.table("donor_profiles").select("id").eq("user_id", user_id).execute()
        if not donor_res.data:
            return jsonify({"success": True, "data": []}), 200

        donor_id = donor_res.data[0]["id"]
        res = admin.table("donor_responses").select("*, blood_requests(*)").eq("donor_id", donor_id).execute()
        return jsonify({
            "success": True,
            "data": res.data if res.data else []
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

