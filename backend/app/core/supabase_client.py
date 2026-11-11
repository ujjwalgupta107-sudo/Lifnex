"""
SUPABASE CLIENT FACTORY & CONNECTION MANAGER
Provides service-role and anonymous clients, handling connection health checks safely
"""

import logging
from typing import Optional
from supabase import create_client, Client
from backend.app.core.config import Config

logger = logging.getLogger(__name__)

_supabase_admin_client: Optional[Client] = None
_supabase_anon_client: Optional[Client] = None

def get_supabase_admin() -> Optional[Client]:
    """
    Returns the Supabase Service Role client (Admin).
    Bypasses RLS, used exclusively on the secure backend service layer.
    """
    global _supabase_admin_client
    if _supabase_admin_client is None:
        if Config.SUPABASE_URL and Config.SUPABASE_SECRET_KEY and Config.SUPABASE_SECRET_KEY != "sb_secret_service_role_key_here":
            try:
                _supabase_admin_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SECRET_KEY)
                logger.info("Supabase Admin client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase Admin client: {e}")
                _supabase_admin_client = None
    return _supabase_admin_client

def get_supabase_anon() -> Optional[Client]:
    """
    Returns the Supabase Anonymous client (Public).
    Enforces Row Level Security (RLS) policies.
    """
    global _supabase_anon_client
    if _supabase_anon_client is None:
        if Config.SUPABASE_URL and Config.SUPABASE_PUBLISHABLE_KEY and Config.SUPABASE_PUBLISHABLE_KEY != "sb_publishable_anon_key_here":
            try:
                _supabase_anon_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_PUBLISHABLE_KEY)
                logger.info("Supabase Anon client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase Anon client: {e}")
                _supabase_anon_client = None
    return _supabase_anon_client

def check_database_connection() -> dict:
    """
    Performs a live connectivity test to the Supabase PostgreSQL database.
    Does not fake success if credentials have not been configured.
    """
    if not Config.is_supabase_configured():
        return {
            "status": "unconfigured",
            "connected": False,
            "message": "Supabase credentials are not yet configured in .env. Setup required in Phase 3/4."
        }

    admin = get_supabase_admin()
    if not admin:
        return {
            "status": "error",
            "connected": False,
            "message": "Could not create Supabase client instance."
        }

    try:
        # Perform lightweight check against public users or health table
        res = admin.table("users").select("id").limit(1).execute()
        return {
            "status": "connected",
            "connected": True,
            "message": "Successfully connected to Supabase PostgreSQL (LifnexDB)."
        }
    except Exception as e:
        return {
            "status": "error",
            "connected": False,
            "message": f"Connection check failed: {str(e)}"
        }

