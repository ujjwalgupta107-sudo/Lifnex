"""
UNIT & INTEGRATION TESTS FOR EMAIL OTP VERIFICATION SYSTEM
Tests registration, OTP dispatch, correct verification, invalid OTP rejection,
expired OTP rejection, 60-second resend rate limits, duplicate email prevention,
and unverified user access guards.
"""

import pytest
import time
import jwt
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


# ==============================================================================
# LIVE-MODE (NON-TESTING) MOCKED SUPABASE ARCHITECTURE & SECURITY TESTS
# Exercises production code paths in auth.py with SMTP absent.
# ==============================================================================

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from backend.app.config import Config
from backend.app.services.otp_service import check_persistent_resend_cooldown


def _make_mock_query(data=None):
    q = MagicMock()
    for method in ("select", "eq", "ilike", "in_", "contains", "order", "limit", "insert", "update", "upsert"):
        getattr(q, method).return_value = q
    q.execute.return_value = SimpleNamespace(data=data if data is not None else [])
    return q


def _make_live_app_and_clients(monkeypatch):
    monkeypatch.setattr(Config, "SMTP_HOST", "")
    monkeypatch.setattr(Config, "SMTP_USERNAME", "")
    monkeypatch.setattr(Config, "SMTP_USER", "")
    monkeypatch.setattr(Config, "SMTP_PASSWORD", "")

    app = create_app()
    app.config["TESTING"] = False

    admin = MagicMock()
    anon = MagicMock()
    admin.auth.admin.list_users.return_value = []
    admin.table.return_value = _make_mock_query([])

    return app, admin, anon


def test_site_url_without_origin_or_referer_uses_config_frontend_url(monkeypatch):
    """Regression: _get_site_url must not crash when Origin and Referer headers are absent."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)
    anon.auth.sign_up.side_effect = Exception("email_address_not_authorized")

    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon):
        with app.test_client() as c:
            res = c.post("/api/v1/auth/register", json={
                "email": "test@example.com",
                "password": "Password123!",
                "full_name": "Test User",
                "role": "patient",
            })
            assert res.status_code == 403
            assert res.get_json()["error"]["code"] == "EMAIL_NOT_AUTHORIZED"


def test_live_register_authorized_email_without_smtp_succeeds_pending_otp(monkeypatch, caplog):
    """Authorized email accepted by Supabase native mailer creates unverified account and logs no OTP."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)
    anon.auth.sign_up.return_value = SimpleNamespace(
        user=SimpleNamespace(id="11111111-1111-1111-1111-111111111111", identities=[{"id": "1"}])
    )

    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon), \
         patch("backend.app.routes.auth.log_audit_event") as mock_audit:
        with app.test_client() as c:
            res = c.post("/api/v1/auth/register", json={
                "email": "Authorized.Team@example.com",
                "password": "Password123!",
                "full_name": "Authorized Member",
                "role": "patient",
            })

    assert res.status_code == 201
    body = res.get_json()
    assert body["success"] is True
    assert body["otp_required"] is True
    assert body["data"]["user"]["is_active"] is False
    assert body["data"]["email"] == "authorized.team@example.com"
    assert body["data"]["email_delivery"] == "SUPABASE_NATIVE_EMAIL"
    assert "otp" not in str(body).lower().replace("otp_required", "")
    admin.auth.admin.generate_link.assert_not_called()
    mock_audit.assert_called_once()


def test_live_register_unauthorized_email_returns_403(monkeypatch):
    """Built-in Supabase mailer rejecting unauthorized recipient returns honest 403 EMAIL_NOT_AUTHORIZED."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)
    anon.auth.sign_up.side_effect = Exception("Email address public.user@gmail.com cannot be used as it is not authorized")

    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon):
        with app.test_client() as c:
            res = c.post("/api/v1/auth/register", json={
                "email": "public.user@gmail.com",
                "password": "Password123!",
                "full_name": "Public User",
                "role": "donor",
                "blood_group": "O+",
            })

    assert res.status_code == 403
    body = res.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "EMAIL_NOT_AUTHORIZED"
    admin.auth.admin.generate_link.assert_not_called()


def test_live_register_rate_limited_without_smtp_never_calls_generate_link(monkeypatch):
    """When SMTP is missing and Supabase rate-limits, generate_link must NOT be called and HTTP 429 is returned."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)
    anon.auth.sign_up.side_effect = Exception("email rate limit exceeded (over_email_send_rate_limit)")

    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon):
        with app.test_client() as c:
            res = c.post("/api/v1/auth/register", json={
                "email": "rate.exhausted@example.com",
                "password": "Password123!",
                "full_name": "Rate Limited User",
                "role": "patient",
            })

    assert res.status_code == 429
    body = res.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "RATE_LIMITED"
    assert body["error"]["retry_after"] == 60
    admin.auth.admin.generate_link.assert_not_called()


def test_live_register_duplicate_confirmed_and_pending_users(monkeypatch):
    """Confirmed email returns EMAIL_ALREADY_REGISTERED; pending email returns REGISTRATION_PENDING_VERIFICATION safely."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)

    # 1. Confirmed user
    admin.auth.admin.list_users.return_value = [
        SimpleNamespace(id="uid-1", email="confirmed@example.com", email_confirmed_at="2026-11-25T10:00:00Z")
    ]
    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon):
        with app.test_client() as c:
            res1 = c.post("/api/v1/auth/register", json={
                "email": "confirmed@example.com",
                "password": "Password123!",
                "full_name": "Confirmed User",
                "role": "patient",
            })
            assert res1.status_code == 409
            assert res1.get_json()["error"]["code"] == "EMAIL_ALREADY_REGISTERED"

    # 2. Incomplete / pending user (must not delete, overwrite, or recreate)
    admin.auth.admin.list_users.return_value = [
        SimpleNamespace(id="uid-2", email="pending@example.com", email_confirmed_at=None)
    ]
    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon):
        with app.test_client() as c:
            res2 = c.post("/api/v1/auth/register", json={
                "email": "pending@example.com",
                "password": "Password123!",
                "full_name": "Pending User",
                "role": "patient",
            })
            assert res2.status_code == 409
            assert res2.get_json()["error"]["code"] == "REGISTRATION_PENDING_VERIFICATION"
            anon.auth.sign_up.assert_not_called()


def test_live_otp_verify_invalid_expired_and_valid_flow(monkeypatch):
    """Tests invalid, expired, and valid Supabase verify_otp plus profile activation."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)
    uid = "22222222-2222-2222-2222-222222222222"

    # Invalid OTP
    anon.auth.verify_otp.side_effect = Exception("Token has invalid signature")
    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon):
        with app.test_client() as c:
            res_inv = c.post("/api/v1/auth/verify-otp", json={"email": "u@example.com", "otp": "999999"})
            assert res_inv.status_code == 400
            assert res_inv.get_json()["error"]["code"] == "INVALID_OTP"

    # Expired OTP
    anon.auth.verify_otp.side_effect = Exception("Token has expired or is invalid")
    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon):
        with app.test_client() as c:
            res_exp = c.post("/api/v1/auth/verify-otp", json={"email": "u@example.com", "otp": "123456"})
            assert res_exp.status_code == 400
            assert res_exp.get_json()["error"]["code"] == "EXPIRED_OTP"

    # Valid OTP activates public.users
    anon.auth.verify_otp.side_effect = None
    anon.auth.verify_otp.return_value = SimpleNamespace(
        user=SimpleNamespace(
            id=uid,
            email="u@example.com",
            email_confirmed_at="2026-11-26T00:00:00Z",
            user_metadata={"full_name": "Verified Patient", "role": "patient"},
        ),
        session=SimpleNamespace(access_token="real-jwt-token", expires_in=3600),
    )
    users_query = _make_mock_query([{"id": uid, "is_active": True}])
    admin.table.return_value = users_query

    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon), \
         patch("backend.app.routes.auth.log_audit_event"):
        with app.test_client() as c:
            res_ok = c.post("/api/v1/auth/verify-otp", json={"email": "u@example.com", "otp": "654321"})
            assert res_ok.status_code == 200
            body = res_ok.get_json()
            assert body["success"] is True
            assert body["data"]["user"]["is_active"] is True
            assert body["data"]["session"]["access_token"] == "real-jwt-token"
            users_query.update.assert_called_with({"is_active": True})


def test_live_persistent_resend_cooldown_blocks_within_60s(monkeypatch):
    """Serverless cooldown reads PostgreSQL audit_logs and returns 429 without calling Supabase resend."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)
    recent_ts = (datetime.now(timezone.utc) - timedelta(seconds=15)).isoformat()

    users_q = _make_mock_query([{"id": "33333333-3333-3333-3333-333333333333", "is_active": False}])
    audit_q = _make_mock_query([{"created_at": recent_ts}])
    admin.table.side_effect = lambda name: users_q if name == "users" else audit_q

    allowed, retry_after = check_persistent_resend_cooldown(admin, "cooldown@example.com", cooldown_seconds=60)
    assert allowed is False
    assert 40 <= retry_after <= 46

    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon):
        with app.test_client() as c:
            res = c.post("/api/v1/auth/resend-otp", json={"email": "cooldown@example.com"})
            assert res.status_code == 429
            body = res.get_json()
            assert body["error"]["code"] == "RATE_LIMITED"
            assert body["error"]["retry_after"] >= 40
            anon.auth.resend.assert_not_called()


def test_live_login_before_and_after_verification(monkeypatch):
    """Unverified account is denied login (403 EMAIL_NOT_VERIFIED); verified account succeeds (200)."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)
    uid = "44444444-4444-4444-4444-444444444444"

    # Before verification
    anon.auth.sign_in_with_password.side_effect = Exception("Email not confirmed")
    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon):
        with app.test_client() as c:
            res_before = c.post("/api/v1/auth/login", json={"email": "user@example.com", "password": "Password123!"})
            assert res_before.status_code == 403
            assert res_before.get_json()["error"]["code"] == "EMAIL_NOT_VERIFIED"

    # After verification
    anon.auth.sign_in_with_password.side_effect = None
    anon.auth.sign_in_with_password.return_value = SimpleNamespace(
        user=SimpleNamespace(
            id=uid,
            email="user@example.com",
            email_confirmed_at="2026-11-26T00:01:00Z",
            user_metadata={"full_name": "Verified User", "role": "patient"},
        ),
        session=SimpleNamespace(access_token="verified-session-jwt", expires_in=3600),
    )
    admin.table.return_value = _make_mock_query([{
        "id": uid, "email": "user@example.com", "full_name": "Verified User", "role": "patient", "is_active": True
    }])

    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.get_supabase_anon", return_value=anon), \
         patch("backend.app.routes.auth.log_audit_event"):
        with app.test_client() as c:
            res_after = c.post("/api/v1/auth/login", json={"email": "user@example.com", "password": "Password123!"})
            assert res_after.status_code == 200
            body = res_after.get_json()
            assert body["success"] is True
            assert body["data"]["session"]["access_token"] == "verified-session-jwt"


def test_verify_token_supports_supabase_es256_ec_jwks(monkeypatch):
    """Verifies auth_guard.verify_token handles Supabase ES256 EC JWKS keys cleanly."""
    import json
    import jwt
    from cryptography.hazmat.primitives.asymmetric import ec
    from backend.app.utils.auth_guard import verify_token

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_jwk = json.loads(jwt.algorithms.ECAlgorithm.to_jwk(private_key.public_key()))
    public_jwk["kid"] = "ec-kid-1"
    public_jwk["alg"] = "ES256"

    token = jwt.encode(
        {
            "sub": "55555555-5555-5555-5555-555555555555",
            "email": "ec.user@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "iss": f"{Config.SUPABASE_URL.rstrip('/')}/auth/v1",
            "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
        },
        private_key,
        algorithm="ES256",
        headers={"kid": "ec-kid-1"},
    )

    with patch("backend.app.utils.auth_guard.get_jwks", return_value={"keys": [public_jwk]}):
        decoded = verify_token(token)
        assert decoded is not None
        assert decoded["sub"] == "55555555-5555-5555-5555-555555555555"


def test_demo_token_rejected_in_vercel_even_if_flask_env_is_dev(monkeypatch):
    """Demo tokens must never work in non-TESTING Vercel environments even if FLASK_ENV != production."""
    from backend.app.utils.auth_guard import verify_token

    app = create_app()
    app.config["TESTING"] = False
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setattr(Config, "FLASK_ENV", "development")

    with app.app_context():
        assert verify_token("demo-token-admin") is None


def test_live_all_four_roles_login_refresh_me_and_role_guards(monkeypatch):
    """Tests login, /me profile lookup, refresh token, and role authorization across all 4 roles."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)
    roles = ["patient", "donor", "hospital", "admin"]

    for idx, role in enumerate(roles):
        uid = f"66666666-6666-6666-6666-66666666666{idx}"
        email = f"{role}@lifnex.org"
        jwt_token = jwt.encode(
            {
                "sub": uid,
                "email": email,
                "role": role,
                "aud": "authenticated",
                "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            },
            Config.SECRET_KEY,
            algorithm="HS256",
        )
        anon.auth.sign_in_with_password.return_value = SimpleNamespace(
            user=SimpleNamespace(
                id=uid,
                email=email,
                email_confirmed_at="2026-11-26T00:00:00Z",
                user_metadata={"full_name": f"Demo {role.title()}", "role": role},
            ),
            session=SimpleNamespace(access_token=jwt_token, refresh_token=f"ref-{role}-12345", expires_in=3600),
        )
        anon.auth.refresh_session.return_value = SimpleNamespace(
            user=SimpleNamespace(
                id=uid,
                email=email,
                email_confirmed_at="2026-11-26T00:00:00Z",
                user_metadata={"full_name": f"Demo {role.title()}", "role": role},
            ),
            session=SimpleNamespace(access_token=jwt_token, refresh_token=f"ref-{role}-67890", expires_in=3600),
        )
        user_row = {
            "id": uid,
            "email": email,
            "full_name": f"Demo {role.title()}",
            "role": role,
            "is_active": True,
            "is_demo": True,
        }
        admin.table.return_value = _make_mock_query([user_row])

        with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
             patch("backend.app.routes.auth.get_supabase_anon", return_value=anon), \
             patch("backend.app.utils.auth_guard.get_supabase_admin", return_value=admin), \
             patch("backend.app.routes.auth.log_audit_event"):
            with app.test_client() as c:
                # 1. Login
                res_login = c.post("/api/v1/auth/login", json={"email": email, "password": "StrongPassword123!"})
                assert res_login.status_code == 200
                login_body = res_login.get_json()
                assert login_body["data"]["user"]["role"] == role
                assert login_body["data"]["session"]["refresh_token"] == f"ref-{role}-12345"

                # 2. /me with JWT
                res_me = c.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {jwt_token}"})
                assert res_me.status_code == 200
                assert res_me.get_json()["data"]["role"] == role

                # 3. Refresh session
                res_ref = c.post("/api/v1/auth/refresh", json={"refresh_token": f"ref-{role}-12345"})
                assert res_ref.status_code == 200
                assert res_ref.get_json()["data"]["session"]["refresh_token"] == f"ref-{role}-67890"

                # 4. Admin insights role gate
                res_adm = c.get("/api/v1/ai/admin-insights", headers={"Authorization": f"Bearer {jwt_token}"})
                if role == "admin":
                    assert res_adm.status_code == 200
                else:
                    assert res_adm.status_code == 403


def test_live_reset_password_requires_valid_jwt_and_rejects_raw_uuid(monkeypatch):
    """reset-password must reject unverified UUIDs with 401 and only update when JWT is valid."""
    app, admin, anon = _make_live_app_and_clients(monkeypatch)
    uid = "77777777-7777-7777-7777-777777777777"

    with patch("backend.app.routes.auth.get_supabase_admin", return_value=admin), \
         patch("backend.app.routes.auth.log_audit_event"):
        with app.test_client() as c:
            # Raw UUID must be rejected
            res_bad = c.post("/api/v1/auth/reset-password", json={
                "access_token": uid,
                "new_password": "NewStrongPassword123!"
            })
            assert res_bad.status_code == 401
            admin.auth.admin.update_user_by_id.assert_not_called()

            # Valid JWT succeeds
            valid_jwt = jwt.encode(
                {
                    "sub": uid,
                    "email": "reset@example.com",
                    "role": "patient",
                    "aud": "authenticated",
                    "exp": int((datetime.now(timezone.utc) + timedelta(minutes=15)).timestamp()),
                },
                Config.SECRET_KEY,
                algorithm="HS256",
            )
            res_ok = c.post("/api/v1/auth/reset-password", json={
                "access_token": valid_jwt,
                "new_password": "NewStrongPassword123!"
            })
            assert res_ok.status_code == 200
            admin.auth.admin.update_user_by_id.assert_called_once_with(uid, {"password": "NewStrongPassword123!"})
