"""
BLOOD EMERGENCY REQUESTS REST API ROUTE (EXTENDED PHASE 5)
Handles requisition creation, cancellation, matching donor queries, and status tracking.
"""

import logging
from flask import Blueprint, request, jsonify, g, current_app
from backend.app.database.supabase_client import get_supabase_admin
from backend.app.utils.auth_guard import require_auth, require_roles
from backend.app.validators.schemas import BloodRequestCreate
from backend.app.utils.audit_logger import log_audit_event
from backend.app.services.matching_service import match_donors_for_request
from backend.app.services.notification_service import create_notification
from pydantic import ValidationError

logger = logging.getLogger(__name__)

blood_requests_bp = Blueprint("blood_requests", __name__)

DEMO_BLOOD_REQUESTS = [
    {
        "id": "c1f72944-e22e-4b47-975f-2a3b7c846d02",
        "patient_id": "demo-user-patient-id",
        "hospital_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "blood_group": "O-",
        "units_required": 2,
        "units_fulfilled": 0,
        "urgency_level": "critical",
        "status": "open",
        "verification_status": "verified",
        "hospital_name": "City Care Super Specialty Hospital",
        "city": "Metropolis",
        "latitude": 28.6145,
        "longitude": 77.2100,
        "clinical_notes": "Immediate trauma surgery resuscitation required.",
        "is_demo": True
    },
    {
        "id": "d2e83055-f33f-4c58-a86e-3b4c8d957e13",
        "patient_id": "demo-user-patient-id",
        "hospital_id": "b1ffcd88-8b1a-4fe7-aa5c-5aa8ac270b22",
        "blood_group": "B+",
        "units_required": 3,
        "units_fulfilled": 1,
        "urgency_level": "urgent",
        "status": "in_progress",
        "verification_status": "verified",
        "hospital_name": "Metro Central Trauma Center",
        "city": "Metropolis",
        "latitude": 28.6220,
        "longitude": 77.2005,
        "clinical_notes": "Orthopedic surgery preparation.",
        "is_demo": True
    }
]

@blood_requests_bp.route("", methods=["GET"])
def list_blood_requests():
    """
    Returns emergency blood requests scoped strictly by caller authorization:
    - Unauthenticated callers receive only sanitized public feed rows (no patient_id, clinical_notes, or GPS).
    - Authenticated demo accounts receive isolated DEMO_BLOOD_REQUESTS.
    - Authenticated patients receive their own requests; verified hospitals receive assigned requests; admins receive active requests.
    """
    admin = get_supabase_admin()
    if not admin or current_app.config.get("TESTING"):
        return jsonify({
            "success": True,
            "data": DEMO_BLOOD_REQUESTS,
            "message": "Emergency requests retrieved (Synthetic demo mode)"
        }), 200

    from backend.app.utils.auth_guard import get_auth_token_from_header, verify_token
    caller = None
    token = get_auth_token_from_header()
    if token:
        payload = verify_token(token)
        if payload and payload.get("sub"):
            try:
                u_res = admin.table("users").select("id, role, is_active, is_demo").eq("id", payload["sub"]).execute()
                if u_res.data and u_res.data[0].get("is_active") is not False:
                    caller = u_res.data[0]
            except Exception:
                caller = None

    if caller and caller.get("is_demo"):
        return jsonify({
            "success": True,
            "data": DEMO_BLOOD_REQUESTS,
            "message": "Emergency requests retrieved (Isolated demo mode)"
        }), 200

    try:
        if not caller:
            pub_res = admin.table("emergency_blood_requests_public_feed").select("*").order("created_at", desc=True).execute()
            return jsonify({
                "success": True,
                "data": pub_res.data or [],
                "message": "Sanitized public emergency feed retrieved."
            }), 200

        role = caller.get("role")
        uid = caller.get("id")
        query = admin.table("blood_requests").select("*, hospitals(name, city)").order("created_at", desc=True)
        if role == "patient":
            query = query.eq("patient_id", uid)
        elif role == "hospital":
            h_res = admin.table("hospitals").select("id").eq("user_id", uid).limit(1).execute()
            if not h_res.data:
                return jsonify({"success": True, "data": [], "message": "No hospital profile linked."}), 200
            query = query.eq("hospital_id", h_res.data[0]["id"])
        else:
            query = query.in_("status", ["open", "in_progress"])

        res = query.execute()
        return jsonify({
            "success": True,
            "data": res.data or [],
            "message": "Active emergency blood requests retrieved."
        }), 200
    except Exception as e:
        logger.warning(f"Error querying blood requests from database: {e}")
        return jsonify({
            "success": False,
            "error": {"code": "DB_ERROR", "message": "Could not retrieve emergency blood requests."}
        }), 500

@blood_requests_bp.route("", methods=["POST"])
@require_auth
@require_roles("patient", "hospital", "admin")
def create_blood_request():
    """
    Creates an emergency blood requisition record
    """
    payload = request.get_json() or {}
    # Enforce patient_id to match authenticated caller when patient or omitted by hospital/admin
    if g.user.get("role") == "patient" or not payload.get("patient_id"):
        payload["patient_id"] = g.user.get("id")

    # Security boundary: Client cannot toggle demo mode via payload
    payload["is_demo"] = bool(g.user.get("is_demo", False))

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
    if not admin or current_app.config.get("TESTING") or g.user.get("is_demo"):
        created = req_data.model_dump(mode="json")
        created["id"] = f"demo-req-{len(DEMO_BLOOD_REQUESTS) + 1}"
        created["status"] = "open"
        created["verification_status"] = "pending_verification"
        created["units_fulfilled"] = 0
        DEMO_BLOOD_REQUESTS.append(created)

        # Emit simulated notification
        create_notification(
            recipient_id=req_data.patient_id,
            title="Emergency Request Submitted",
            message=f"Your request for {req_data.units_required} units of {req_data.blood_group} has been logged.",
            notification_type="system",
            reference_request_id=created["id"]
        )

        return jsonify({
            "success": True,
            "data": created,
            "message": "Emergency request created successfully (Demo mode)."
        }), 201

    try:
        record = req_data.model_dump(mode="json")
        record["status"] = "open"
        record["verification_status"] = "pending_verification"
        record["units_fulfilled"] = 0
        res = admin.table("blood_requests").insert(record).execute()
        created = res.data[0] if res.data else record

        log_audit_event(
            action="REQUEST_CREATED",
            entity_type="blood_requests",
            entity_id=created.get("id"),
            actor_id=req_data.patient_id,
            client_ip=request.remote_addr,
            new_values={"blood_group": req_data.blood_group, "units": req_data.units_required}
        )

        return jsonify({
            "success": True,
            "data": created,
            "message": "Emergency blood requisition created successfully."
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_INSERT_ERROR", "message": str(e)}}), 500

@blood_requests_bp.route("/<request_id>/matching-donors", methods=["GET"])
@require_auth
@require_roles("patient", "hospital", "admin")
def get_matching_donors(request_id):
    """
    Returns ranked matching voluntary donors for an emergency request.
    Verifies that patient can only access their own request's matching pool.
    """
    admin = get_supabase_admin()
    is_demo_user = bool(g.user.get("is_demo"))
    req_item = None

    if not admin or current_app.config.get("TESTING") or is_demo_user:
        for r in DEMO_BLOOD_REQUESTS:
            if r.get("id") == request_id:
                req_item = r
                break
        if not req_item:
            return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Blood request not found."}}), 404
        caller_id = g.user.get("id")
        caller_role = g.user.get("role")
        if caller_role == "patient" and req_item.get("patient_id") != caller_id:
            return jsonify({"success": False, "error": {"code": "FORBIDDEN", "message": "You can only view matching donors for your own requests."}}), 403
        from backend.app.routes.donors import DEMO_DONORS
        matched = match_donors_for_request(req_item, DEMO_DONORS)
        return jsonify({
            "success": True,
            "request_id": request_id,
            "blood_group": req_item.get("blood_group"),
            "total_matched": len(matched),
            "data": matched,
            "disclaimer": "Final biological compatibility must always be confirmed on-site by certified healthcare professionals."
        }), 200

    try:
        res = admin.table("blood_requests").select("*").eq("id", request_id).execute()
        if res.data:
            req_item = res.data[0]
    except Exception:
        pass

    if not req_item:
        return jsonify({
            "success": False,
            "error": {"code": "NOT_FOUND", "message": "Blood request not found."}
        }), 404

    # Security check: patient owns request; hospital owns assigned hospital
    caller_id = g.user.get("id")
    caller_role = g.user.get("role")
    if caller_role == "patient" and req_item.get("patient_id") != caller_id:
        return jsonify({
            "success": False,
            "error": {"code": "FORBIDDEN", "message": "You can only view matching donors for your own requests."}
        }), 403
    if caller_role == "hospital":
        h_res = admin.table("hospitals").select("id").eq("user_id", caller_id).limit(1).execute()
        if not h_res.data or h_res.data[0]["id"] != req_item.get("hospital_id"):
            return jsonify({
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "You can only view matching donors for requests assigned to your hospital."}
            }), 403

    donors_pool = []
    try:
        d_res = admin.table("donor_profiles").select("id, blood_group, city, latitude, longitude, travel_radius_km, availability_status, is_verified").eq("availability_status", "available").execute()
        if d_res.data:
            donors_pool = d_res.data
    except Exception:
        pass

    matched = match_donors_for_request(req_item, donors_pool)
    return jsonify({
        "success": True,
        "request_id": request_id,
        "blood_group": req_item.get("blood_group"),
        "total_matched": len(matched),
        "data": matched,
        "disclaimer": "Final biological compatibility must always be confirmed on-site by certified healthcare professionals."
    }), 200

@blood_requests_bp.route("/<request_id>/cancel", methods=["PATCH"])
@require_auth
@require_roles("patient", "admin")
def cancel_blood_request(request_id):
    """
    Allows a patient to cancel their open requisition
    """
    admin = get_supabase_admin()
    caller_id = g.user.get("id")
    caller_role = g.user.get("role")

    if not admin or current_app.config.get("TESTING") or g.user.get("is_demo"):
        # Demo mode cancellation
        for r in DEMO_BLOOD_REQUESTS:
            if r.get("id") == request_id:
                if caller_role == "patient" and r.get("patient_id") != caller_id:
                    return jsonify({
                        "success": False,
                        "error": {"code": "FORBIDDEN", "message": "You can only cancel your own blood requests."}
                    }), 403
                r["status"] = "cancelled"
                return jsonify({
                    "success": True,
                    "data": r,
                    "message": "Blood request cancelled successfully (Demo mode)."
                }), 200

        return jsonify({
            "success": False,
            "error": {"code": "NOT_FOUND", "message": "Blood request not found."}
        }), 404

    try:
        # 1. Fetch request
        req_res = admin.table("blood_requests").select("*").eq("id", request_id).execute()
        if not req_res.data:
            return jsonify({
                "success": False,
                "error": {"code": "NOT_FOUND", "message": "Blood request not found."}
            }), 404

        req_item = req_res.data[0]
        if caller_role == "patient" and req_item.get("patient_id") != caller_id:
            return jsonify({
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "You can only cancel your own blood requests."}
            }), 403

        if req_item.get("status") not in ("open", "in_progress"):
            return jsonify({
                "success": False,
                "error": {"code": "INVALID_STATE", "message": f"Cannot cancel request in '{req_item.get('status')}' status."}
            }), 400

        res = admin.table("blood_requests").update({"status": "cancelled"}).eq("id", request_id).execute()
        return jsonify({
            "success": True,
            "data": res.data[0] if res.data else {},
            "message": "Blood request cancelled successfully."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_UPDATE_ERROR", "message": str(e)}}), 500

@blood_requests_bp.route("/<request_id>/responses", methods=["GET"])
@require_auth
@require_roles("patient", "hospital", "admin")
def get_request_responses(request_id):
    """
    Returns responses submitted by voluntary donors for this requisition
    """
    admin = get_supabase_admin()
    caller_id = g.user.get("id")
    caller_role = g.user.get("role")

    if not admin or current_app.config.get("TESTING") or g.user.get("is_demo"):
        from backend.app.routes.donors import DEMO_RESPONSES
        matched_responses = [r for r in DEMO_RESPONSES if r.get("request_id") == request_id]
        return jsonify({
            "success": True,
            "data": matched_responses,
            "message": "Donor responses retrieved (Demo mode)."
        }), 200

    try:
        # Check ownership
        req_res = admin.table("blood_requests").select("patient_id, hospital_id").eq("id", request_id).execute()
        if not req_res.data:
            return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Request not found."}}), 404

        if caller_role == "patient" and req_res.data[0].get("patient_id") != caller_id:
            return jsonify({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied."}}), 403

        res = admin.table("donor_responses").select("*, donor_profiles(blood_group, city, is_verified)").eq("request_id", request_id).execute()
        return jsonify({
            "success": True,
            "data": res.data if res.data else []
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500
