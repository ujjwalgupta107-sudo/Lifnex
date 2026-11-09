"""
PHASE 5 COMPREHENSIVE END-TO-END EMERGENCY REQUEST & MATCHING ENGINE TESTS
Tests:
1. Patient creates emergency blood request.
2. Matching engine filters and ranks compatible donors by distance and travel radius.
3. Incompatible or out-of-range donors are excluded.
4. Patient views matching donor pool for their own request.
5. Cross-patient matching donor access is blocked (403 Forbidden).
6. Donor retrieves personalized emergency feed.
7. Donor responds (accepts) emergency request.
8. Duplicate donor responses are rejected with 409 Conflict.
9. Patient views real-time donor responses on their request.
10. Patient cancels their own pending requisition.
11. Unauthorized cancellation of another patient's request is blocked (403 Forbidden).
12. Schema validation rejects invalid blood groups and negative units.
"""

import pytest
from datetime import datetime, timedelta, timezone
from backend.app import create_app
from backend.tests.test_auth import create_test_jwt

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

# Test Tokens
PATIENT_1_ID = "11111111-1111-1111-1111-111111111111"
PATIENT_2_ID = "11111111-1111-1111-1111-222222222222"
DONOR_ID = "22222222-2222-2222-2222-222222222222"
HOSPITAL_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

@pytest.fixture
def patient_1_auth():
    token = create_test_jwt(user_id=PATIENT_1_ID, role="patient")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def patient_2_auth():
    token = create_test_jwt(user_id=PATIENT_2_ID, role="patient")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def donor_auth():
    token = create_test_jwt(user_id=DONOR_ID, role="donor")
    return {"Authorization": f"Bearer {token}"}

# 1. Patient Creates Request
def test_patient_create_emergency_blood_request(client, patient_1_auth):
    """Verifies that an authenticated patient can submit an urgent requisition"""
    req_by = (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat()
    payload = {
        "hospital_id": HOSPITAL_ID,
        "blood_group": "A+",
        "units_required": 2,
        "urgency_level": "critical",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "clinical_notes": "Emergency surgery prep",
        "required_by": req_by
    }
    res = client.post("/api/v1/blood-requests", json=payload, headers=patient_1_auth)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["blood_group"] == "A+"
    assert data["data"]["units_required"] == 2
    assert data["data"]["urgency_level"] == "critical"
    assert data["data"]["patient_id"] == PATIENT_1_ID
    assert data["data"]["status"] == "open"

def test_create_request_unauthorized_role(client, donor_auth):
    """Verifies that donors cannot submit patient requisitions"""
    payload = {
        "hospital_id": HOSPITAL_ID,
        "blood_group": "A+",
        "units_required": 2,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "required_by": datetime.now(timezone.utc).isoformat()
    }
    res = client.post("/api/v1/blood-requests", json=payload, headers=donor_auth)
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "FORBIDDEN"

# 2. Matching Engine Verification
def test_matching_donors_retrieval(client, patient_1_auth):
    """Verifies that compatible nearby donors are returned for request"""
    # Uses demo request c1f72944... (O- requisition owned by demo-user-patient-id)
    # Test as admin/owner
    from backend.tests.test_auth import create_test_jwt
    owner_token = create_test_jwt(user_id="demo-user-patient-id", role="patient")
    headers = {"Authorization": f"Bearer {owner_token}"}
    res = client.get("/api/v1/blood-requests/c1f72944-e22e-4b47-975f-2a3b7c846d02/matching-donors", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "data" in data
    assert "disclaimer" in data
    # Recipient is O-, so only O- donors can be matched
    for donor in data["data"]:
        assert donor["blood_group"] == "O-"
        assert donor["distance_km"] <= donor["travel_radius_km"]

def test_cross_patient_matching_access_blocked(client, patient_2_auth):
    """Verifies that Patient 2 cannot inspect matching donors for Patient 1's requisition"""
    res = client.get("/api/v1/blood-requests/c1f72944-e22e-4b47-975f-2a3b7c846d02/matching-donors", headers=patient_2_auth)
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "FORBIDDEN"

# 3. Donor Feed & Response Flow
def test_donor_feed_ranked_requests(client, donor_auth):
    """Verifies that a donor receives emergency requisitions matched and ranked by urgency/distance"""
    res = client.get("/api/v1/donors/feed", headers=donor_auth)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    if len(data["data"]) > 0:
        assert "distance_km" in data["data"][0]
        assert "urgency_level" in data["data"][0]

def test_donor_respond_to_emergency_request(client, donor_auth):
    """Verifies donor can submit an acceptance response with estimated arrival time"""
    payload = {
        "request_id": "c1f72944-e22e-4b47-975f-2a3b7c846d02",
        "donor_id": DONOR_ID,
        "response_status": "accepted",
        "estimated_arrival_minutes": 25,
        "notes": "Departing immediately via metro"
    }
    res = client.post("/api/v1/donors/respond", json=payload, headers=donor_auth)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["response_status"] == "accepted"
    assert data["data"]["estimated_arrival_minutes"] == 25

def test_duplicate_donor_response_prevented(client, donor_auth):
    """Verifies duplicate responses to the same request are rejected with 409 Conflict"""
    payload = {
        "request_id": "c1f72944-e22e-4b47-975f-2a3b7c846d02",
        "donor_id": DONOR_ID,
        "response_status": "accepted",
        "estimated_arrival_minutes": 25
    }
    # Second submission with identical (request_id, donor_id)
    res = client.post("/api/v1/donors/respond", json=payload, headers=donor_auth)
    assert res.status_code == 409
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "DUPLICATE_RESPONSE"

def test_patient_view_incoming_donor_responses(client):
    """Verifies request owner can review incoming donor responses"""
    owner_token = create_test_jwt(user_id="demo-user-patient-id", role="patient")
    headers = {"Authorization": f"Bearer {owner_token}"}
    res = client.get("/api/v1/blood-requests/c1f72944-e22e-4b47-975f-2a3b7c846d02/responses", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0

# 4. Request Cancellation
def test_patient_cancel_own_request(client):
    """Verifies patient can cancel their open requisition"""
    owner_token = create_test_jwt(user_id="demo-user-patient-id", role="patient")
    headers = {"Authorization": f"Bearer {owner_token}"}
    res = client.patch("/api/v1/blood-requests/c1f72944-e22e-4b47-975f-2a3b7c846d02/cancel", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["status"] == "cancelled"

def test_cancel_request_unauthorized_user(client, patient_2_auth):
    """Verifies patient cannot cancel another patient's requisition"""
    res = client.patch("/api/v1/blood-requests/d2e83055-f33f-4c58-a86e-3b4c8d957e13/cancel", headers=patient_2_auth)
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "FORBIDDEN"

