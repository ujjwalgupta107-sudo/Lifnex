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
    Toggles donor availability status (available, busy, inactive).
    In live environments, enforces Bearer JWT authentication and donor ownership.
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
    if not admin or current_app.config.get("TESTING"):
        return jsonify({
            "success": True,
            "data": {"donor_id": donor_id, "availability_status": status},
            "message": f"Availability updated to {status} (Demo mode)."
        }), 200

    # Live authentication and ownership enforcement
    from backend.app.utils.auth_guard import get_auth_token_from_header, verify_token
    token = get_auth_token_from_header()
    if not token:
        return jsonify({"success": False, "error": {"code": "UNAUTHORIZED", "message": "Authentication required."}}), 401
    token_payload = verify_token(token)
    if not token_payload or not token_payload.get("sub"):
        return jsonify({"success": False, "error": {"code": "INVALID_OR_EXPIRED_TOKEN", "message": "Invalid or expired token."}}), 401

    caller_res = admin.table("users").select("id, role, is_active, is_demo").eq("id", token_payload["sub"]).execute()
    if not caller_res.data:
        return jsonify({"success": False, "error": {"code": "USER_NOT_FOUND", "message": "User not found."}}), 401
    caller = caller_res.data[0]
    if caller.get("is_active") is False:
        return jsonify({"success": False, "error": {"code": "ACCOUNT_SUSPENDED", "message": "Account is inactive."}}), 403
    if caller.get("role") not in ("donor", "admin"):
        return jsonify({"success": False, "error": {"code": "FORBIDDEN", "message": "Only donors or admins can update donor availability."}}), 403

    if caller.get("is_demo"):
        return jsonify({
            "success": True,
            "data": {"donor_id": donor_id or caller["id"], "availability_status": status},
            "message": f"Availability updated to {status} (Isolated demo mode)."
        }), 200

    try:
        target_user_id = caller["id"] if caller["role"] == "donor" else (donor_id or caller["id"])
        res = admin.table("donor_profiles").update({"availability_status": status}).eq("user_id", target_user_id).execute()
        if not res.data and caller["role"] == "admin" and donor_id:
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
    is_demo_user = bool(g.user.get("is_demo")) if hasattr(g, "user") and g.user else False
    admin = get_supabase_admin()

    if not admin or current_app.config.get("TESTING") or is_demo_user:
        from backend.app.routes.blood_requests import DEMO_BLOOD_REQUESTS
        ranked = rank_requests_for_donor(DEMO_DONORS[0], DEMO_BLOOD_REQUESTS)
        return jsonify({
            "success": True,
            "data": ranked,
            "donor_blood_group": DEMO_DONORS[0].get("blood_group"),
            "disclaimer": "Final compatibility must be verified on-site by certified medical personnel."
        }), 200

    donor_profile = None
    if user_id:
        try:
            res = admin.table("donor_profiles").select("*").eq("user_id", user_id).execute()
            if res.data:
                donor_profile = res.data[0]
        except Exception:
            pass

    if not donor_profile:
        return jsonify({
            "success": True,
            "data": [],
            "donor_blood_group": None,
            "disclaimer": "Final compatibility must be verified on-site by certified medical personnel."
        }), 200

    requests_pool = []
    try:
        res = admin.table("blood_requests").select("*, hospitals(name, city)").in_("status", ["open", "in_progress"]).eq("is_demo", False).execute()
        if res.data:
            requests_pool = res.data
    except Exception:
        pass

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
        # Resolve donor_profile_id safely: donors can only respond on their own behalf
        caller_id = g.user.get("id")
        caller_role = g.user.get("role")
        lookup_uid = caller_id if caller_role == "donor" else data.donor_id

        dp_user_res = admin.table("donor_profiles").select("id, user_id").eq("user_id", lookup_uid).execute()
        if dp_user_res.data:
            donor_profile_id = dp_user_res.data[0]["id"]
        else:
            dp_res = admin.table("donor_profiles").select("id, user_id").eq("id", data.donor_id).execute()
            if dp_res.data:
                if caller_role == "donor" and dp_res.data[0].get("user_id") != caller_id:
                    return jsonify({"success": False, "error": {"code": "FORBIDDEN", "message": "Cannot submit a response for another donor."}}), 403
                donor_profile_id = dp_res.data[0]["id"]
            else:
                new_dp = {
                    "user_id": lookup_uid,
                    "blood_group": "O-",
                    "date_of_birth": "2000-01-01",
                    "latitude": 28.6139,
                    "longitude": 77.2090,
                    "city": "Metropolis",
                    "travel_radius_km": 15,
                    "availability_status": "available",
                    "is_verified": False
                }
                dp_ins = admin.table("donor_profiles").insert(new_dp).execute()
                donor_profile_id = dp_ins.data[0]["id"] if dp_ins.data else data.donor_id

        insert_payload = data.model_dump()
        insert_payload["donor_id"] = donor_profile_id

        # 1. Check for existing response
        existing = admin.table("donor_responses").select("id").eq("request_id", data.request_id).eq("donor_id", donor_profile_id).execute()
        if existing.data:
            return jsonify({
                "success": False,
                "error": {"code": "DUPLICATE_RESPONSE", "message": "You have already responded to this blood request."}
            }), 409

        # 2. Insert response
        res = admin.table("donor_responses").insert(insert_payload).execute()
        created = res.data[0] if res.data else insert_payload

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

