"""
PHASE 4.5 BACKEND & DATABASE COMPATIBILITY INTEGRATION TESTS
Tests all remaining Flask API routes:
- GET /api/v1/hospitals (Directory search & filtering)
- PATCH /api/v1/donors/availability (Availability status mutation & validation)
- GET /api/v1/matching/compatibility (Full matrix & specific blood type query)
- POST /api/v1/matching/distance-preview (Geospatial coordinate calculations)
- POST /api/v1/requests (Alias route compatibility)
- POST /api/v1/auth/logout (Session termination)
- POST /api/v1/auth/reset-password (Recovery password update)
"""

import pytest
from backend.app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

# 1. Hospitals API Tests
def test_list_hospitals_endpoint(client):
    """Verifies that the hospital directory endpoint returns verified facilities"""
    res = client.get("/api/v1/hospitals")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0
    # Every hospital returned must be marked is_verified = True
    for hosp in data["data"]:
        assert hosp["is_verified"] is True
        assert "name" in hosp
        assert "city" in hosp

def test_list_hospitals_filter_by_city(client):
    """Verifies hospital directory filtering by city query parameter"""
    res = client.get("/api/v1/hospitals?city=Metropolis")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]) > 0
    for hosp in data["data"]:
        assert hosp["city"] == "Metropolis"

# 2. Donors API Tests
def test_donor_availability_update_valid(client):
    """Verifies updating donor availability to a valid status"""
    payload = {
        "donor_id": "00000000-0000-0000-0000-000000000001",
        "availability_status": "busy"
    }
    res = client.patch("/api/v1/donors/availability", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["availability_status"] == "busy"

def test_donor_availability_update_invalid_status(client):
    """Verifies rejecting invalid availability status values"""
    payload = {
        "donor_id": "00000000-0000-0000-0000-000000000001",
        "availability_status": "super_active"  # Invalid status
    }
    res = client.patch("/api/v1/donors/availability", json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_STATUS"

# 3. Matching & Compatibility API Tests
def test_matching_compatibility_matrix(client):
    """Verifies full ABO compatibility matrix response"""
    res = client.get("/api/v1/matching/compatibility")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "O-" in data["data"]
    assert "AB+" in data["data"]
    # Universal donor: O- can donate to all 8 blood groups
    assert len(data["data"]["O-"]["can_donate_to"]) == 8

def test_matching_compatibility_specific_group(client):
    """Verifies compatibility lookup for a specific blood type"""
    res = client.get("/api/v1/matching/compatibility?blood_group=A%2B")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["blood_group"] == "A+"
    assert "can_donate_to" in data["data"]["compatibility"]
    assert "can_receive_from" in data["data"]["compatibility"]

def test_matching_compatibility_invalid_group(client):
    """Verifies error handling for non-existent blood types"""
    res = client.get("/api/v1/matching/compatibility?blood_group=Z_NEGATIVE")
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_GROUP"

def test_matching_distance_preview_endpoint(client):
    """Verifies distance preview calculation between GPS coordinates"""
    payload = {
        "lat1": 28.6139,
        "lon1": 77.2090,
        "lat2": 28.7041,
        "lon2": 77.1025
    }
    res = client.post("/api/v1/matching/distance-preview", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["distance_km"] > 0
    assert "estimated_driving_minutes" in data["data"]

def test_matching_distance_preview_invalid_coords(client):
    """Verifies error response when non-numeric coordinates are sent"""
    payload = {
        "lat1": "invalid_latitude",
        "lon1": 77.2090,
        "lat2": 28.7041,
        "lon2": 77.1025
    }
    res = client.post("/api/v1/matching/distance-preview", json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_COORDS"

# 4. Route Aliases & Auth Lifecycle
def test_blood_requests_alias_route(client):
    """Verifies that /api/v1/requests functions as a seamless alias for /api/v1/blood-requests"""
    res = client.get("/api/v1/requests")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert isinstance(data["data"], list)

def test_auth_logout_endpoint_requires_auth(client):
    """Verifies logout endpoint enforces authentication"""
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 401
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNAUTHORIZED"

def test_auth_logout_endpoint_with_valid_token(client):
    """Verifies logout succeeds when provided with a valid Bearer token"""
    from backend.tests.test_auth import create_test_jwt
    token = create_test_jwt(user_id="00000000-0000-0000-0000-000000000001", role="patient")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/v1/auth/logout", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "logged out" in data["message"].lower()

def test_auth_reset_password_missing_token(client):
    """Verifies password reset rejects payload without access token"""
    payload = {
        "new_password": "NewSecurePassword123!"
    }
    res = client.post("/api/v1/auth/reset-password", json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
