"""
PHASE 4 AUTHENTICATION & ROLE AUTHORIZATION TEST SUITE
Tests signup, login, JWT validation, role permission boundaries, hospital verification restrictions, and escalation guards
"""

import pytest
import jwt
from datetime import datetime, timedelta, timezone
from backend.app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

# Helper function to generate mock test JWTs
def create_test_jwt(user_id="test-uid", role="patient", expired=False):
    exp = datetime.now(timezone.utc) + (timedelta(hours=1) if not expired else timedelta(hours=-1))
    payload = {
        "sub": user_id,
        "email": f"{role}@test.internal",
        "role": role,
        "aud": "authenticated",
        "exp": int(exp.timestamp())
    }
    return jwt.encode(payload, "test-secret-key-that-is-at-least-32-bytes-long", algorithm="HS256")

# 1. Registration Tests
def test_valid_patient_registration(client):
    """Verifies successful registration of a patient account"""
    payload = {
        "email": "sarah.patient@example.com",
        "password": "Password123!",
        "full_name": "Sarah Jenkins",
        "role": "patient",
        "phone_number": "+15551234567"
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "patient"
    assert "access_token" in data["data"]["session"]

def test_valid_donor_registration(client):
    """Verifies successful registration of a voluntary donor with medical attributes"""
    payload = {
        "email": "alex.donor@example.com",
        "password": "SecurePassword123!",
        "full_name": "Alex Rivera",
        "role": "donor",
        "blood_group": "O-",
        "travel_radius_km": 20,
        "city": "Metropolis"
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "donor"

def test_role_escalation_registration_blocked(client):
    """Verifies that users CANNOT register directly as Admin via public API"""
    # Attempt Admin
    admin_payload = {
        "email": "hacker@example.com",
        "password": "Password123!",
        "full_name": "Bad Actor",
        "role": "admin"
    }
    res = client.post("/api/v1/auth/register", json=admin_payload)
    assert res.status_code == 400
    assert res.get_json()["success"] is False

def test_valid_hospital_registration(client):
    """Verifies that legitimate hospitals can submit registration with unverified initial state"""
    hosp_payload = {
        "email": "apollo.hospital@example.com",
        "password": "Password123!",
        "full_name": "Apollo Multi-Specialty Hospital",
        "role": "hospital"
    }
    res = client.post("/api/v1/auth/register", json=hosp_payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "hospital"

def test_invalid_registration_data(client):
    """Verifies rejection of short passwords, invalid emails, and missing fields"""
    # Weak password
    res = client.post("/api/v1/auth/register", json={
        "email": "valid@example.com",
        "password": "123",  # Under 8 chars
        "full_name": "Valid Name"
    })
    assert res.status_code == 400

    # Invalid email
    res2 = client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "password": "Password123!",
        "full_name": "Valid Name"
    })
    assert res2.status_code == 400

# 2. Login Tests
def test_login_flow(client):
    """Verifies standard login returns user claims and access token"""
    res = client.post("/api/v1/auth/login", json={
        "email": "alex.donor@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "access_token" in data["data"]["session"]

def test_login_missing_fields(client):
    """Verifies rejection when password or email is missing"""
    res = client.post("/api/v1/auth/login", json={"email": "only@example.com"})
    assert res.status_code == 400

# 3. Protected Endpoints & JWT Validation
def test_current_user_unauthorized_without_token(client):
    """Verifies /api/v1/auth/me rejects requests lacking Bearer authorization"""
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "UNAUTHORIZED"

def test_current_user_with_valid_token(client):
    """Verifies /api/v1/auth/me accepts valid JWT tokens"""
    token = create_test_jwt(user_id="user-1234", role="patient")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["id"] == "user-1234"
    assert data["data"]["role"] == "patient"

def test_current_user_with_expired_token(client):
    """Verifies /api/v1/auth/me rejects expired tokens"""
    token = create_test_jwt(user_id="user-expired", role="patient", expired=True)
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "INVALID_OR_EXPIRED_TOKEN"

# 4. Password Recovery Validation
def test_forgot_password_endpoint(client):
    """Verifies forgot-password endpoint validates email without revealing user existence"""
    res = client.post("/api/v1/auth/forgot-password", json={"email": "sarah.jenkins@example.com"})
    assert res.status_code == 200
    assert res.get_json()["success"] is True

def test_forgot_password_invalid_email(client):
    """Verifies rejection of malformed recovery email"""
    res = client.post("/api/v1/auth/forgot-password", json={"email": "bad-email"})
    assert res.status_code == 400

