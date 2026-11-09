"""
LIFNEX BACKEND PYTEST SUITE
Tests API responses, Pydantic schemas, Haversine formula, and compatibility engine
"""

import pytest
from backend.app import create_app
from backend.app.services.matching_engine import calculate_haversine_distance, is_blood_compatible
from backend.app.models.schemas import BloodRequestCreate
from datetime import datetime, timezone

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Verifies the health status API returns 200 and schema definitions"""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "Lifnex" in data["platform"]
    assert "users" in data["tables_defined"]
    assert "blood_requests" in data["tables_defined"]
    assert len(data["tables_defined"]) == 9

def test_blood_compatibility_logic():
    """Verifies biological ABO/Rh compatibility rules"""
    # Universal donor: O- can donate to all
    assert is_blood_compatible("O-", "O-") is True
    assert is_blood_compatible("O-", "AB+") is True
    assert is_blood_compatible("O-", "A+") is True

    # Universal recipient: AB+ can receive from all, but cannot donate to O-
    assert is_blood_compatible("AB+", "O-") is False
    assert is_blood_compatible("AB+", "AB+") is True

    # Specific matches
    assert is_blood_compatible("B+", "B+") is True
    assert is_blood_compatible("B+", "A+") is False

def test_haversine_distance_calculation():
    """Verifies great-circle math precision"""
    # Delhi to Gurgaon coordinates approx 28-30 km
    dist = calculate_haversine_distance(28.6139, 77.2090, 28.4595, 77.0266)
    assert 20.0 < dist < 35.0

    # Same location must be 0.0 km
    assert calculate_haversine_distance(28.6139, 77.2090, 28.6139, 77.2090) == 0.0

def test_distance_preview_endpoint(client):
    """Verifies the distance preview REST API"""
    payload = {
        "lat1": 28.6139,
        "lon1": 77.2090,
        "lat2": 28.4595,
        "lon2": 77.0266
    }
    res = client.post("/api/v1/matching/distance-preview", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["distance_km"] > 0

def test_blood_requests_get(client):
    """Verifies retrieving active emergency requests"""
    res = client.get("/api/v1/requests")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert isinstance(data["data"], list)

def test_request_validation_failure(client):
    """Verifies rejection of invalid request schemas when authenticated"""
    from backend.tests.test_auth import create_test_jwt
    token = create_test_jwt(user_id="00000000-0000-0000-0000-000000000001", role="patient")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "blood_group": "INVALID_TYPE",
        "units_required": 999  # Exceeds max 20
    }
    res = client.post("/api/v1/requests", json=payload, headers=headers)
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"

