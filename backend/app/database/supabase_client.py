"""
SUPABASE CLIENT FACTORY & CONNECTION MANAGER
Provides service-role and anonymous clients, handling connection health checks safely
"""

import logging
from typing import Optional
from supabase import create_client, Client
from backend.app.config import Config

logger = logging.getLogger(__name__)

_supabase_admin_client: Optional[Client] = None
_supabase_anon_client: Optional[Client] = None

def get_supabase_admin() -> Optional[Client]:
    """
    Returns the Supabase Service Role client (Admin).
    Bypasses RLS, used exclusively on the secure backend service layer.
    Refuses connection if not approved staging project.
    """
    global _supabase_admin_client
    if _supabase_admin_client is None:
        import os
        if os.getenv("LIFNEX_FORCE_OFFLINE") == "1":
            return None
        
        is_valid_project, msg = Config.validate_staging_project()
        if not is_valid_project:
            logger.error(f"Cannot initialize Supabase Admin client: {msg}")
            return None

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
    Refuses connection if not approved staging project.
    """
    global _supabase_anon_client
    if _supabase_anon_client is None:
        is_valid_project, msg = Config.validate_staging_project()
        if not is_valid_project:
            logger.error(f"Cannot initialize Supabase Anon client: {msg}")
            return None

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
    Does not fake success if credentials have not been configured or if in-memory fallback is active.
    """
    is_valid_project, msg = Config.validate_staging_project()
    if not is_valid_project:
        return {
            "status": "blocked",
            "connected": False,
            "using_fallback": True,
            "message": msg
        }

    if not Config.is_supabase_configured():
        return {
            "status": "unconfigured",
            "connected": False,
            "using_fallback": True,
            "message": "Supabase credentials are not yet configured in .env. Setup required."
        }

    admin = get_supabase_admin()
    if not admin:
        return {
            "status": "error",
            "connected": False,
            "using_fallback": True,
            "message": "Could not create Supabase client instance."
        }

    try:
        res = admin.table("users").select("id").limit(1).execute()
        return {
            "status": "connected",
            "connected": True,
            "using_fallback": False,
            "project_ref": Config.get_project_ref(),
            "message": f"Successfully connected to staging Supabase PostgreSQL ({Config.get_project_ref()})."
        }
    except Exception as e:
        return {
            "status": "error",
            "connected": False,
            "using_fallback": True,
            "project_ref": Config.get_project_ref(),
            "message": f"Connection check failed: {str(e)}"
        }

