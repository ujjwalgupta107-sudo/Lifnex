"""
OTP MANAGEMENT SERVICE FOR LIFNEX
Generates, stores, and validates 6-digit email OTPs cryptographically.
Protects against brute-force attacks, enforces 60-second resend cooldowns, and expires tokens after 10 minutes.
"""

import time
import hmac
import hashlib
import secrets
import logging
import threading
from typing import Optional, Tuple, Dict, Any
from backend.app.config import Config

logger = logging.getLogger(__name__)

# Thread-safe in-memory OTP session cache.
# ⚠️  SERVERLESS LIMITATION: This dict is per-process and NOT shared across
# Vercel serverless function invocations. In production, _otp_sessions is
# effectively stateless — OTPs and cooldowns stored here are lost between
# /api/v1/auth/register and /api/v1/auth/verify-otp requests when each
# runs in a different Lambda cold-start container.
#
# CURRENT IMPACT:
#   • The 60-second resend cooldown (`can_resend_otp`) is NOT enforced in production.
#   • Locally-generated OTPs (`generate_and_store_otp`) cannot be verified in production.
#
# FUTURE FIX (when scaling):
#   • Replace _otp_sessions with a Supabase table (e.g. `otp_sessions`) or
#     Redis/Upstash for persistent, cross-invocation state.
#   • The current architecture relies on Supabase Auth's native OTP management
#     (via anon.auth.sign_up / anon.auth.resend), which is serverless-safe.
#
# This module is used today only for the TESTING harness (TESTING=True) and
# the generate_link+SMTP relay path, which is guarded by is_smtp_configured().
_otp_lock = threading.Lock()
_otp_sessions: Dict[str, Dict[str, Any]] = {}

def _hash_otp(email: str, otp: str) -> str:
    """Computes a salted HMAC-SHA256 hash of the OTP code."""
    salt = Config.SECRET_KEY or "lifnex-otp-salt-key-2026"
    message = f"{email.lower().strip()}:{otp.strip()}"
    return hmac.new(salt.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()

def clean_expired_sessions() -> int:
    """Removes expired OTP sessions from memory."""
    now = time.time()
    expired_keys = []
    with _otp_lock:
        for email, session in _otp_sessions.items():
            if now > session.get("expires_at", 0):
                expired_keys.append(email)
        for k in expired_keys:
            del _otp_sessions[k]
    return len(expired_keys)

def generate_and_store_otp(
    email: str,
    user_id: str,
    metadata: Optional[Dict[str, Any]] = None,
    expiry_seconds: int = 600
) -> str:
    """
    Generates a cryptographically secure 6-digit OTP and stores its hash.
    Plain OTP is NEVER stored in persistent storage or logged.
    """
    clean_expired_sessions()
    norm_email = email.lower().strip()

    # Generate unguessable 6-digit numeric code (100000 - 999999)
    raw_otp = f"{secrets.SystemRandom().randint(100000, 999999):06d}"
    otp_hash = _hash_otp(norm_email, raw_otp)
    now = time.time()

    with _otp_lock:
        existing = _otp_sessions.get(norm_email)
        last_resend = existing.get("last_resend_at", now) if existing else now

        _otp_sessions[norm_email] = {
            "otp_hash": otp_hash,
            "user_id": user_id,
            "metadata": metadata or {},
            "created_at": now,
            "expires_at": now + expiry_seconds,
            "attempts": 0,
            "max_attempts": 5,
            "last_resend_at": now
        }

    return raw_otp

def can_resend_otp(email: str, cooldown_seconds: int = 60) -> Tuple[bool, int]:
    """
    Checks if a user can request an OTP resend (enforces 60s cooldown).
    Returns (allowed: bool, seconds_remaining: int)
    """
    norm_email = email.lower().strip()
    with _otp_lock:
        session = _otp_sessions.get(norm_email)
        if not session:
            return True, 0

        elapsed = time.time() - session.get("last_resend_at", 0)
        if elapsed < cooldown_seconds:
            remaining = int(cooldown_seconds - elapsed)
            return False, max(1, remaining)

        # Update last resend timestamp
        session["last_resend_at"] = time.time()
        return True, 0

def verify_otp_code(email: str, candidate_otp: str) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """
    Verifies candidate OTP for the specified email.
    Returns (success: bool, error_code: Optional[str], session_data: Optional[dict])
    """
    norm_email = email.lower().strip()
    candidate_clean = candidate_otp.strip()

    with _otp_lock:
        session = _otp_sessions.get(norm_email)
        if not session:
            return False, "OTP_NOT_FOUND", None

        # Check expiration
        if time.time() > session.get("expires_at", 0):
            del _otp_sessions[norm_email]
            return False, "EXPIRED_OTP", None

        # Check attempt limit (brute-force defense)
        session["attempts"] = session.get("attempts", 0) + 1
        if session["attempts"] > session.get("max_attempts", 5):
            del _otp_sessions[norm_email]
            return False, "TOO_MANY_ATTEMPTS", None

        # Constant-time hash comparison
        candidate_hash = _hash_otp(norm_email, candidate_clean)
        is_match = hmac.compare_digest(candidate_hash, session["otp_hash"])

        if not is_match:
            return False, "INVALID_OTP", None

        # Match succeeded! Extract payload and delete session (single-use token)
        session_data = {
            "user_id": session.get("user_id"),
            "email": norm_email,
            "metadata": session.get("metadata", {})
        }
        del _otp_sessions[norm_email]
        return True, None, session_data

def get_otp_session(email: str) -> Optional[Dict[str, Any]]:
    """Returns metadata for an active session without exposing the hash or OTP."""
    norm_email = email.lower().strip()
    with _otp_lock:
        s = _otp_sessions.get(norm_email)
        if not s:
            return None
        return {
            "user_id": s.get("user_id"),
            "expires_in": max(0, int(s.get("expires_at", 0) - time.time())),
            "attempts": s.get("attempts", 0)
        }
