"""
MATCHING & GEOSPATIAL PREVIEW REST API ROUTE
"""

from flask import Blueprint, request, jsonify
from backend.app.services.matching_engine import calculate_haversine_distance, is_blood_compatible, BLOOD_COMPATIBILITY_MAP

matching_bp = Blueprint("matching", __name__)

@matching_bp.route("/compatibility", methods=["GET"])
def get_compatibility():
    """
    Returns the complete biological compatibility matrix
    """
    blood_group = request.args.get("blood_group")
    if blood_group:
        if blood_group not in BLOOD_COMPATIBILITY_MAP:
            return jsonify({
                "success": False,
                "error": {"code": "INVALID_GROUP", "message": f"Blood group '{blood_group}' is invalid."}
            }), 400
        return jsonify({
            "success": True,
            "data": {
                "blood_group": blood_group,
                "compatibility": BLOOD_COMPATIBILITY_MAP[blood_group]
            },
            "disclaimer": "Final compatibility must always be confirmed on-site by certified healthcare professionals."
        }), 200

    return jsonify({
        "success": True,
        "data": BLOOD_COMPATIBILITY_MAP,
        "disclaimer": "Final compatibility must always be confirmed on-site by certified healthcare professionals."
    }), 200

@matching_bp.route("/distance-preview", methods=["POST"])
def distance_preview():
    """
    Calculates great-circle distance between two geographic coordinates
    """
    payload = request.get_json() or {}
    try:
        lat1 = float(payload.get("lat1"))
        lon1 = float(payload.get("lon1"))
        lat2 = float(payload.get("lat2"))
        lon2 = float(payload.get("lon2"))
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_COORDS", "message": "lat1, lon1, lat2, and lon2 must be valid float coordinates."}
        }), 400

    dist = calculate_haversine_distance(lat1, lon1, lat2, lon2)
    return jsonify({
        "success": True,
        "data": {
            "distance_km": dist,
            "estimated_driving_minutes": round(dist * 2.2, 1)  # Synthetic estimate (30 km/h city average)
        }
    }), 200

