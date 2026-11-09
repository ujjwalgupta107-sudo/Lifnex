"""
MATCHING SERVICE MODULE
Implements medical blood compatibility filtering, donor travel radius,
geographic proximity ranking, and urgency weight calculation.
"""

from typing import List, Dict, Any, Optional
from backend.app.services.matching_engine import BLOOD_COMPATIBILITY_MAP
from backend.app.utils.geo_utils import haversine_distance

# Urgency prioritization weights for sorting
URGENCY_RANK = {
    "critical": 1,
    "urgent": 2,
    "normal": 3
}

def is_donor_compatible(donor_blood_group: str, recipient_blood_group: str) -> bool:
    """
    Checks if a donor's blood group can be safely received by recipient according to standard ABO/Rh rules.
    NOTE: Final compatibility must always be confirmed on-site by certified healthcare professionals.
    """
    allowed_donors = BLOOD_COMPATIBILITY_MAP.get(recipient_blood_group, {}).get("can_receive_from", [])
    return donor_blood_group in allowed_donors

def match_donors_for_request(
    request_data: Dict[str, Any],
    donors_pool: List[Dict[str, Any]],
    max_results: int = 20
) -> List[Dict[str, Any]]:
    """
    Filters and ranks available donors for a given emergency blood request:
    1. Compatibility check (donor blood -> request blood group).
    2. Availability status must be 'available'.
    3. Distance calculation using Haversine formula.
    4. Proximity within donor's travel radius.
    5. Sorted ascending by distance.
    """
    req_bg = request_data.get("blood_group")
    req_lat = float(request_data.get("latitude", 0.0))
    req_lon = float(request_data.get("longitude", 0.0))

    matched_donors = []

    for donor in donors_pool:
        # 1. Availability check
        if donor.get("availability_status") != "available":
            continue

        # 2. Compatibility check
        donor_bg = donor.get("blood_group")
        if not is_donor_compatible(donor_bg, req_bg):
            continue

        # 3. Distance check
        donor_lat = float(donor.get("latitude", 0.0))
        donor_lon = float(donor.get("longitude", 0.0))
        dist_km = haversine_distance(req_lat, req_lon, donor_lat, donor_lon)

        # 4. Travel radius check
        max_radius = donor.get("travel_radius_km", 25)
        if dist_km > max_radius:
            continue

        donor_summary = {
            "donor_id": donor.get("id"),
            "blood_group": donor_bg,
            "city": donor.get("city"),
            "distance_km": dist_km,
            "travel_radius_km": max_radius,
            "availability_status": donor.get("availability_status"),
            "is_verified": donor.get("is_verified", False),
            "estimated_driving_minutes": round(dist_km * 2.2, 1)  # Synthetic metric (approx 30 km/h city avg)
        }
        matched_donors.append(donor_summary)

    # Sort by nearest distance first
    matched_donors.sort(key=lambda d: d["distance_km"])
    return matched_donors[:max_results]

def rank_requests_for_donor(
    donor_profile: Dict[str, Any],
    requests_pool: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Filters and ranks open emergency requisitions suitable for a donor:
    1. Donor blood must be compatible with recipient's request.
    2. Request must be 'open' or 'in_progress'.
    3. Distance within donor's travel radius.
    4. Ranked by Urgency (Critical -> Urgent -> Normal) and then by Distance.
    """
    donor_bg = donor_profile.get("blood_group")
    donor_lat = float(donor_profile.get("latitude", 0.0))
    donor_lon = float(donor_profile.get("longitude", 0.0))
    max_radius = donor_profile.get("travel_radius_km", 25)

    suitable_requests = []

    for req in requests_pool:
        if req.get("status") not in ("open", "in_progress"):
            continue

        req_bg = req.get("blood_group")
        if not is_donor_compatible(donor_bg, req_bg):
            continue

        req_lat = float(req.get("latitude", 0.0))
        req_lon = float(req.get("longitude", 0.0))
        dist_km = haversine_distance(donor_lat, donor_lon, req_lat, req_lon)

        if dist_km > max_radius:
            continue

        item = dict(req)
        item["distance_km"] = dist_km
        item["estimated_driving_minutes"] = round(dist_km * 2.2, 1)
        suitable_requests.append(item)

    # Multi-level sort: Urgency (Critical first), then nearest Distance
    suitable_requests.sort(
        key=lambda r: (URGENCY_RANK.get(r.get("urgency_level", "normal"), 99), r["distance_km"])
    )
    return suitable_requests

