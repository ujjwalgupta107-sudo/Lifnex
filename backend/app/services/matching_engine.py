"""
HAWAERSINE GEOSPATIAL DISTANCE ENGINE & BLOOD COMPATIBILITY LOGIC
Pure mathematical functions with zero external dependencies
"""

import math
from typing import List, Dict

# Earth radius in kilometers
EARTH_RADIUS_KM = 6371.0

# ABO & Rh Compatibility Map
BLOOD_COMPATIBILITY_MAP: Dict[str, Dict[str, List[str]]] = {
    "O-": {
        "can_donate_to": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        "can_receive_from": ["O-"]
    },
    "O+": {
        "can_donate_to": ["O+", "A+", "B+", "AB+"],
        "can_receive_from": ["O+", "O-"]
    },
    "A-": {
        "can_donate_to": ["A-", "A+", "AB-", "AB+"],
        "can_receive_from": ["A-", "O-"]
    },
    "A+": {
        "can_donate_to": ["A+", "AB+"],
        "can_receive_from": ["A+", "A-", "O+", "O-"]
    },
    "B-": {
        "can_donate_to": ["B-", "B+", "AB-", "AB+"],
        "can_receive_from": ["B-", "O-"]
    },
    "B+": {
        "can_donate_to": ["B+", "AB+"],
        "can_receive_from": ["B+", "B-", "O+", "O-"]
    },
    "AB-": {
        "can_donate_to": ["AB-", "AB+"],
        "can_receive_from": ["AB-", "A-", "B-", "O-"]
    },
    "AB+": {
        "can_donate_to": ["AB+"],
        "can_receive_from": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    }
}

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two geographic coordinates in kilometers.
    d = 2r * arcsin(sqrt(sin^2(dlat/2) + cos(lat1)*cos(lat2)*sin^2(dlon/2)))
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance_km = EARTH_RADIUS_KM * c
    return round(distance_km, 2)

def is_blood_compatible(donor_group: str, recipient_group: str) -> bool:
    """
    Validates biological ABO/Rh compatibility.
    True if donor can donate to recipient.
    """
    if donor_group not in BLOOD_COMPATIBILITY_MAP:
        return False
    return recipient_group in BLOOD_COMPATIBILITY_MAP[donor_group]["can_donate_to"]

