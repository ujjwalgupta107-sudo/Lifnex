"""
HOSPITALS & BLOOD BANKS DIRECTORY ROUTE
"""

from flask import Blueprint, request, jsonify
from backend.app.database.supabase_client import get_supabase_admin

hospitals_bp = Blueprint("hospitals", __name__)

# Fallback synthetic demo hospital dataset when running offline/unconfigured
DEMO_HOSPITALS = [
    {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "name": "City Care Super Specialty Hospital",
        "license_number": "DEMO-HOSP-2026-091",
        "address": "142 Medical Enclave, Central Ave",
        "city": "Metropolis",
        "latitude": 28.6145,
        "longitude": 77.2100,
        "emergency_phone": "+1 (555) 019-2831",
        "contact_person": "Dr. Arthur Vance",
        "has_blood_bank": True,
        "is_verified": True,
        "current_inventory_status": {"O-": 2, "B+": 8, "A+": 12, "AB+": 4}
    },
    {
        "id": "b1ffcd88-8b1a-4fe7-aa5c-5aa8ac270b22",
        "name": "Metro Central Trauma Center",
        "license_number": "DEMO-HOSP-2026-114",
        "address": "88 Emergency Bypass Blvd, Sector 4",
        "city": "Metropolis",
        "latitude": 28.6220,
        "longitude": 77.2005,
        "emergency_phone": "+1 (555) 019-4422",
        "contact_person": "Dr. Elena Rostova",
        "has_blood_bank": True,
        "is_verified": True,
        "current_inventory_status": {"O-": 1, "O+": 14, "B-": 3, "A-": 5}
    },
    {
        "id": "c2eedc77-7a2b-4ed6-994b-4bb7ab160c33",
        "name": "St. Jude Memorial Blood Bank",
        "license_number": "DEMO-BANK-2026-003",
        "address": "12 Harmony Square, South District",
        "city": "Metropolis",
        "latitude": 28.6080,
        "longitude": 77.2180,
        "emergency_phone": "+1 (555) 019-7788",
        "contact_person": "Chief Officer Marcus Brody",
        "has_blood_bank": True,
        "is_verified": True,
        "current_inventory_status": {"all_types": "Cold Storage Active"}
    }
]

@hospitals_bp.route("", methods=["GET"])
def list_hospitals():
    """
    Returns verified hospitals and blood banks
    """
    admin = get_supabase_admin()
    if not admin:
        return jsonify({
            "success": True,
            "data": DEMO_HOSPITALS,
            "message": "Hospitals directory retrieved (Synthetic demo mode)"
        }), 200

    try:
        res = admin.table("hospitals").select("*").eq("is_verified", True).execute()
        return jsonify({
            "success": True,
            "data": res.data if res.data else DEMO_HOSPITALS,
            "message": "Verified hospitals retrieved successfully."
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": {"code": "DB_ERROR", "message": str(e)}}), 500

