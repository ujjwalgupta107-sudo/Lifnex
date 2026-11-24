"""
SUPABASE CLIENT FACTORY & CONNECTION MANAGER REDIRECT
Authoritative source is backend.app.database.supabase_client
This module re-exports get_supabase_admin, get_supabase_anon, check_database_connection
to guarantee single-source-of-truth Supabase client behavior.
"""

from backend.app.database.supabase_client import (
    get_supabase_admin,
    get_supabase_anon,
    check_database_connection,
)

__all__ = ["get_supabase_admin", "get_supabase_anon", "check_database_connection"]
