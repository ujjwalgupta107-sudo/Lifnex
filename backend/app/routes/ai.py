"""
AI & GEMINI ASSISTANT REST API ROUTES (PHASE 6)
Endpoints for:
- /api/v1/ai/triage (Emergency Request Assistant & Parameter Extraction)
- /api/v1/ai/summarize-request (Request Summary Generator)
- /api/v1/ai/donor-guidance (Educational Donor Coordination Assistant)
- /api/v1/ai/admin-insights (Analytics & High-demand summaries for admins)
Protected with rate limiting, input validation, role-based controls, and security sanitization.
"""

import time
from collections import defaultdict
from flask import Blueprint, request, jsonify, g
from backend.app.services.gemini_service import gemini_service
from backend.app.utils.auth_guard import require_auth, require_roles
from backend.app.utils.audit_logger import log_audit_event

ai_bp = Blueprint("ai", __name__)

# Lightweight in-memory sliding-window rate limiter per IP / User
RATE_LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS_PER_WINDOW = 30  # Max calls per minute
_request_records = defaultdict(list)

def check_rate_limit(client_id: str) -> bool:
    """Returns True if within rate limit, False if rate limited"""
    now = time.time()
    timestamps = _request_records[client_id]
    # Prune old timestamps
    _request_records[client_id] = [ts for ts in timestamps if now - ts < RATE_LIMIT_WINDOW]
    if len(_request_records[client_id]) >= MAX_REQUESTS_PER_WINDOW:
        return False
    _request_records[client_id].append(now)
    return True

@ai_bp.before_request
def enforce_rate_limiting():
    client_ip = request.remote_addr or "127.0.0.1"
    if not check_rate_limit(client_ip):
        return jsonify({
            "success": False,
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Too many AI assistance requests. Please wait a moment before trying again."
            }
        }), 429

# 1. Emergency Request Assistant (Triage)
@ai_bp.route("/triage", methods=["POST"])
def triage_emergency_request():
    """
    Assists patient/hospital in formulating emergency blood requests and extracting structured parameters.
    """
    payload = request.get_json() or {}
    clinical_text = payload.get("text", "").strip()

    if not clinical_text:
        return jsonify({
            "success": False,
            "error": {
                "code": "MISSING_INPUT",
                "message": "Field 'text' is required for AI triage analysis."
            }
        }), 400

    result = gemini_service.assist_emergency_request(clinical_text)
    return jsonify(result), 200

# 2. Requisition Summary Generator
@ai_bp.route("/summarize-request", methods=["POST"])
def summarize_blood_request():
    """
    Summarizes an existing emergency requisition for broadcast alerts without inventing patient details.
    """
    payload = request.get_json() or {}
    if not payload:
        return jsonify({
            "success": False,
            "error": {
                "code": "MISSING_INPUT",
                "message": "Request payload with requisition parameters is required."
            }
        }), 400

    result = gemini_service.summarize_request(payload)
    return jsonify(result), 200

# 3. Donor Educational Guidance Assistant
@ai_bp.route("/donor-guidance", methods=["POST"])
def donor_guidance():
    """
    Explains the voluntary donation process, preparation protocols, and directs clinical questions to doctors.
    """
    payload = request.get_json() or {}
    query = payload.get("query", "").strip()

    if not query:
        return jsonify({
            "success": False,
            "error": {
                "code": "MISSING_INPUT",
                "message": "Field 'query' is required for donor guidance."
            }
        }), 400

    result = gemini_service.get_donor_guidance(query)
    return jsonify(result), 200

# 4. Admin Insights & Demand Analytics
@ai_bp.route("/admin-insights", methods=["POST", "GET"])
@require_auth
@require_roles("admin")
def admin_insights():
    """
    Summarizes platform metrics, high-demand blood groups, and dispatch response velocities for administrators.
    """
    if request.method == "POST":
        payload = request.get_json() or {}
    else:
        # Default aggregate synthetic metrics
        payload = {
            "total_requests": 142,
            "fulfilled_requests": 128,
            "avg_response_minutes": 13.8,
            "high_demand_groups": ["O-", "B+", "O+"],
            "critical_urgency_ratio": 0.42
        }

    result = gemini_service.generate_admin_insights(payload)

    # Log audit event
    log_audit_event(
        action="AI_ADMIN_INSIGHTS_GENERATED",
        entity_type="analytics",
        entity_id=None,
        actor_id=g.user.get("id"),
        client_ip=request.remote_addr,
        new_values={"metrics_analyzed": payload}
    )

    return jsonify(result), 200
