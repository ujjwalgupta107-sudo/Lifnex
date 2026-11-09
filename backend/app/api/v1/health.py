"""
SYSTEM HEALTH & DATABASE DIAGNOSTIC ROUTE
"""

from flask import Blueprint, jsonify
from backend.app.core.supabase_client import check_database_connection
from backend.app.core.config import Config

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_status():
    """
    Returns API operational status and Supabase PostgreSQL connectivity report
    """
    db_check = check_database_connection()
    return jsonify({
        "success": True,
        "platform": "Lifnex API v1",
        "tagline": "Connecting Lives When Every Second Matters",
        "database": db_check,
        "supabase_configured": Config.is_supabase_configured(),
        "tables_defined": [
            "users",
            "donor_profiles",
            "hospitals",
            "blood_requests",
            "donor_responses",
            "notifications",
            "audit_logs",
            "donation_history",
            "verification_records"
        ]
    }), 200

