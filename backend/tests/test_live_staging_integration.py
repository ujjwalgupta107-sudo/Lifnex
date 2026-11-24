"""
LIFNEX STAGING LIVE INTEGRATION & RLS VERIFICATION TEST SUITE
Tests genuine database operations, role-based access, and donor privacy against Lifnex-Staging.
Target: jejnuespiisksqfgqwsg (STAGING ONLY)
"""

import pytest
import uuid
from backend.app.config import Config
from backend.app.database.supabase_client import get_supabase_admin, get_supabase_anon, check_database_connection


@pytest.fixture(scope="session")
def staging_guard():
    """Confirms tests only run against approved staging project, never production"""
    ref = Config.get_project_ref()
    assert ref == "jejnuespiisksqfgqwsg", f"Refusing to run staging tests on unexpected ref: {ref}"
    valid, msg = Config.validate_staging_project()
    assert valid, f"Staging validation failed: {msg}"
    assert Config.is_supabase_configured(), "Supabase must be configured for live staging tests"


def test_staging_database_connectivity(staging_guard):
    """Verifies genuine connected=True and using_fallback=False against Supabase PostgreSQL"""
    status = check_database_connection()
    assert status.get("connected") is True
    assert status.get("using_fallback") is False
    assert status.get("status") == "connected"
    assert status.get("project_ref") == "jejnuespiisksqfgqwsg"


def test_staging_nine_tables_exist_and_accessible(staging_guard):
    """Confirms all 9 tables are accessible via backend admin client"""
    admin = get_supabase_admin()
    assert admin is not None
    required_tables = [
        "users",
        "donor_profiles",
        "hospitals",
        "blood_requests",
        "donor_responses",
        "notifications",
        "donation_history",
        "verification_records",
        "audit_logs"
    ]
    for table_name in required_tables:
        res = admin.table(table_name).select("*", count="exact").limit(0).execute()
        assert res is not None
        assert hasattr(res, "count")


def test_staging_secure_views_exist_and_accessible(staging_guard):
    """Confirms both secure views are accessible by anon/authenticated roles"""
    anon = get_supabase_anon()
    assert anon is not None

    # 1. Available donors public view
    res_donors = anon.table("available_donors_public_view").select("*").limit(5).execute()
    assert res_donors is not None
    assert isinstance(res_donors.data, list)

    # 2. Emergency blood requests public feed
    res_reqs = anon.table("emergency_blood_requests_public_feed").select("*").limit(5).execute()
    assert res_reqs is not None
    assert isinstance(res_reqs.data, list)


def test_staging_donor_privacy_protection_anon_denied(staging_guard):
    """
    SECURITY AUDIT: Verifies that anonymous users are strictly denied from querying raw donor_profiles.
    Must raise an exception or return error/empty due to RLS revocation.
    """
    anon = get_supabase_anon()
    assert anon is not None
    try:
        res = anon.table("donor_profiles").select("latitude, longitude, date_of_birth, user_id").execute()
        # If it returns data without throwing, verify RLS filters out all private rows
        assert len(res.data) == 0, "Security violation: anonymous user read raw donor_profiles rows!"
    except Exception as e:
        # Expected behavior: 401 Unauthorized or 403 Forbidden / permission denied
        assert "401" in str(e) or "403" in str(e) or "permission denied" in str(e).lower()


def test_staging_production_project_references_blocked():
    """Confirms both production project references trigger hard block in validation"""
    for prod_ref in ["ygbprigcrooveopipkcl", "krvxybseqaxeculpgveg"]:
        orig_url = Config.SUPABASE_URL
        try:
            Config.SUPABASE_URL = f"https://{prod_ref}.supabase.co"
            valid, msg = Config.validate_staging_project()
            assert valid is False
            assert "blocked" in msg.lower()
            assert Config.is_supabase_configured() is False
        finally:
            Config.SUPABASE_URL = orig_url
