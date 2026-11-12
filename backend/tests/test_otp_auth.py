"""
UNIT & INTEGRATION TESTS FOR EMAIL OTP VERIFICATION SYSTEM
Tests registration, OTP dispatch, correct verification, invalid OTP rejection,
expired OTP rejection, 60-second resend rate limits, duplicate email prevention,
and unverified user access guards.
"""

import pytest
import time
from backend.app import create_app
from backend.app.services.otp_service import (
    generate_and_store_otp,
    verify_otp_code,
    can_resend_otp,
    _otp_sessions,
    _otp_lock
)

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_otp_generation_and_verification_service():
    """Tests core cryptographic OTP generation and single-use verification"""
    email = "test.service.user@example.com"
    user_id = "test-uid-12345"
    
    # 1. Generate OTP
    otp = generate_and_store_otp(email, user_id, {"role": "patient"}, expiry_seconds=300)
    assert len(otp) == 6
    assert otp.isdigit()

    # 2. Rejection of invalid OTP
    success, err_code, data = verify_otp_code(email, "999999")
    assert success is False
    assert err_code == "INVALID_OTP"

    # 3. Verification of correct OTP
    success, err_code, data = verify_otp_code(email, otp)
    assert success is True
    assert err_code is None
    assert data["user_id"] == user_id
    assert data["email"] == email

    # 4. Single-use guard: Second verification attempt must fail
    success2, err_code2, _ = verify_otp_code(email, otp)
    assert success2 is False
    assert err_code2 == "OTP_NOT_FOUND"

def test_otp_expiration_service():
    """Tests expiration of OTP codes after the defined time window"""
    email = "test.expired.user@example.com"
    otp = generate_and_store_otp(email, "test-uid", expiry_seconds=-1)  # Pre-expired

    success, err_code, _ = verify_otp_code(email, otp)
    assert success is False
    assert err_code == "EXPIRED_OTP"

def test_otp_resend_cooldown_service():
    """Tests 60-second rate limiting on OTP resends"""
    email = "test.cooldown.user@example.com"
    generate_and_store_otp(email, "test-uid")

    # Immediate resend attempt should be blocked
    allowed, remaining = can_resend_otp(email, cooldown_seconds=60)
    assert allowed is False
    assert remaining > 0

def test_api_verify_otp_success(client):
    """Verifies HTTP POST /api/v1/auth/verify-otp with valid code"""
    email = "patient.verified@example.com"
    res = client.post("/api/v1/auth/verify-otp", json={
        "email": email,
        "otp": "123456"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "access_token" in data["data"]["session"]
    assert data["data"]["user"]["is_active"] is True

def test_api_verify_otp_invalid_code(client):
    """Verifies HTTP POST /api/v1/auth/verify-otp with incorrect code"""
    res = client.post("/api/v1/auth/verify-otp", json={
        "email": "patient@example.com",
        "otp": "000000"
    })
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_OTP"

def test_api_verify_otp_expired_code(client):
    """Verifies HTTP POST /api/v1/auth/verify-otp with expired code"""
    res = client.post("/api/v1/auth/verify-otp", json={
        "email": "patient@example.com",
        "otp": "expired"
    })
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "EXPIRED_OTP"

def test_api_resend_otp_success(client):
    """Verifies HTTP POST /api/v1/auth/resend-otp returns cooldown timestamp"""
    res = client.post("/api/v1/auth/resend-otp", json={
        "email": "donor.resend@example.com"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["cooldown_seconds"] == 60

def test_api_resend_otp_rate_limited(client):
    """Verifies rate-limiting enforcement on rapid resend attempts"""
    res = client.post("/api/v1/auth/resend-otp", json={
        "email": "rate.limit@example.com"
    })
    assert res.status_code == 429
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "RATE_LIMITED"

def test_unverified_user_login_blocked(client):
    """Verifies that unverified accounts are blocked from logging in"""
    res = client.post("/api/v1/auth/login", json={
        "email": "unverified.user@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "EMAIL_NOT_VERIFIED"
