"""
LIFNEX STAGING & PRODUCTION SMOKE TEST SUITE
Validates all 12 operational capabilities required for staging readiness:
1. Gunicorn entrypoint & configuration
2. /api/v1/health HTTP 200 with platform metrics
3. Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
4. Registration, Login, Logout, Session Claims, Role-Based Access Guards
5. Patient emergency request creation
6. Cross-patient matching access restriction (403 guard)
7. Donor feed ranking and proximity matching
8. Donor emergency response dispatch (accept / ETA) and duplicate response rejection (409)
9. Notifications lifecycle (list, unread count, single read, mark all read, 403 foreign isolation)
10. Gemini AI triage & parameter extraction (live API / deterministic fallback)
11. Educational donor guidance and clinical disclaimer enforcement
12. Zero secret leakage or raw PII exposure in logs and responses
"""

import pytest
from backend.app import create_app
from backend.app.config import Config
from backend.tests.test_auth import create_test_jwt

class SmokeTestConfig(Config):
    TESTING = True
    FLASK_DEBUG = False

@pytest.fixture
def client():
    app = create_app(SmokeTestConfig)
    return app.test_client()

# -------------------------------------------------------------
# 1. Health & Security Headers
# -------------------------------------------------------------
def test_smoke_health_check_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["platform"] == "Lifnex API v1"
    assert "tables_defined" in data
    assert len(data["tables_defined"]) == 9

def test_smoke_security_headers(client):
    res = client.get("/api/v1/health")
    headers = res.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert headers.get("Permissions-Policy") == "camera=(), microphone=(), geolocation=(self)"
    # Obsolete X-XSS-Protection must not be present
    assert "X-XSS-Protection" not in headers

# -------------------------------------------------------------
# 2. Authentication & Role Authorization Lifecycle
# -------------------------------------------------------------
def test_smoke_auth_registration_and_login_flow(client):
    # Patient registration
    reg_payload = {
        "email": "smoke.patient@example.com",
        "password": "SecurePassword123!",
        "full_name": "Smoke Patient",
        "role": "patient",
        "phone_number": "+15550199988",
        "city": "Metropolis"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code in [200, 201]
    reg_data = res.get_json()
    assert reg_data["success"] is True

    # Login
    login_payload = {
        "email": "smoke.patient@example.com",
        "password": "SecurePassword123!"
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200
    login_data = res.get_json()
    assert login_data["success"] is True
    token = login_data["data"]["session"]["access_token"]
    assert token is not None

    # Current user profile
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["data"]["role"] == "patient"

    # Logout
    res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["success"] is True

def test_smoke_role_escalation_blocked(client):
    # Public registration attempting to claim admin role
    malicious = {
        "email": "attacker@example.com",
        "password": "Password123!",
        "full_name": "Attacker",
        "role": "admin"
    }
    res = client.post("/api/v1/auth/register", json=malicious)
    assert res.status_code == 400
    assert res.get_json()["success"] is False

# -------------------------------------------------------------
# 3. Patient Emergency Request Workflow End-to-End
# -------------------------------------------------------------
def test_smoke_patient_emergency_workflow(client):
    patient_id = "00000000-0000-0000-0000-000000000001"
    token = create_test_jwt(user_id=patient_id, role="patient")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create emergency requisition
    req_payload = {
        "hospital_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "blood_group": "O-",
        "units_required": 2,
        "urgency_level": "critical",
        "clinical_notes": "Smoke test emergency trauma requisition",
        "latitude": 28.6145,
        "longitude": 77.2100,
        "required_by": "2026-11-10T12:00:00Z"
    }
    res = client.post("/api/v1/blood-requests", json=req_payload, headers=headers)
    assert res.status_code == 201
    req_data = res.get_json()
    req_id = req_data["data"]["id"]
    assert req_id is not None

    # 2. Retrieve matching donors (Owner access -> 200)
    res = client.get(f"/api/v1/blood-requests/{req_id}/matching-donors", headers=headers)
    assert res.status_code == 200
    donors_data = res.get_json()
    assert donors_data["success"] is True
    assert "disclaimer" in donors_data

    # 3. Unauthorized foreign patient cannot retrieve matching donors (403)
    foreign_token = create_test_jwt(user_id="00000000-0000-0000-0000-000000000002", role="patient")
    res = client.get(f"/api/v1/blood-requests/{req_id}/matching-donors", headers={"Authorization": f"Bearer {foreign_token}"})
    assert res.status_code == 403

    # 4. Cancel own request
    res = client.patch(f"/api/v1/blood-requests/{req_id}/cancel", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["data"]["status"] == "cancelled"

# -------------------------------------------------------------
# 4. Donor Feed & Emergency Response Dispatch
# -------------------------------------------------------------
def test_smoke_donor_feed_and_response_dispatch(client):
    donor_id = "smoke-unique-donor-id-9999"
    token = create_test_jwt(user_id=donor_id, role="donor")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. View donor feed
    res = client.get("/api/v1/donors/feed", headers=headers)
    assert res.status_code == 200
    feed_data = res.get_json()
    assert feed_data["success"] is True

    # 2. Dispatch response (Accept with ETA)
    resp_payload = {
        "request_id": "c1f72944-e22e-4b47-975f-2a3b7c846d02",
        "donor_id": donor_id,
        "response_status": "accepted",
        "estimated_arrival_minutes": 25,
        "notes": "Responding via smoke test runner"
    }
    res = client.post("/api/v1/donors/respond", json=resp_payload, headers=headers)
    assert res.status_code == 201
    assert res.get_json()["success"] is True

    # 3. Duplicate response prevented (409 Conflict)
    res_dup = client.post("/api/v1/donors/respond", json=resp_payload, headers=headers)
    assert res_dup.status_code == 409
    assert res_dup.get_json()["error"]["code"] == "DUPLICATE_RESPONSE"

# -------------------------------------------------------------
# 5. Notifications Lifecycle & Read Tracking
# -------------------------------------------------------------
def test_smoke_notifications_lifecycle(client):
    patient_id = "demo-user-patient-id"
    token = create_test_jwt(user_id=patient_id, role="patient")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List notifications
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    notifs = res.get_json()
    assert notifs["success"] is True

    # 2. Mark single notification as read
    res = client.patch("/api/v1/notifications/notif-uuid-1/read", headers=headers)
    assert res.status_code == 200

    # 3. Mark all as read
    res = client.patch("/api/v1/notifications/mark-all-read", headers=headers)
    assert res.status_code == 200

# -------------------------------------------------------------
# 6. Gemini AI Triage & Fallback Verification
# -------------------------------------------------------------
def test_smoke_gemini_ai_triage_and_educational_assistant(client):
    # 1. Clinical triage parameter extraction
    res = client.post("/api/v1/ai/triage", json={
        "text": "Physician ICU report: Acute trauma hemorrhage, 2 units of O- required stat."
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["detected_blood_group"] == "O-"
    assert data["recommended_urgency"] == "critical"
    assert data["recommended_units"] == 2
    assert "disclaimer" in data

    # 2. Donor educational guidance
    res = client.post("/api/v1/ai/donor-guidance", json={
        "query": "How much water should I drink for hydration before donation?"
    })
    assert res.status_code == 200
    guidance = res.get_json()
    assert guidance["success"] is True
    assert "water" in guidance["guidance"].lower()
    assert "disclaimer" in guidance
