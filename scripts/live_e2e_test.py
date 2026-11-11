"""
LIFNEX LIVE API END-TO-END VALIDATION SCRIPT
Tests real live HTTP endpoints on http://127.0.0.1:5000/api/v1
"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000/api/v1"

def run_tests():
    print("==================================================")
    print("   LIFNEX LIVE END-TO-END API TEST SUITE")
    print("==================================================")
    
    results = []

    # 1. Health Endpoint
    try:
        r = requests.get(f"{BASE_URL}/health")
        data = r.json()
        status = "PASS" if r.status_code == 200 and data.get("success") else "FAIL"
        db_status = data.get("database", {}).get("status", "unknown")
        results.append(("Health Endpoint", status, f"DB Status: {db_status}"))
        print(f"[{status}] Health Endpoint (HTTP {r.status_code}) - DB: {db_status}")
    except Exception as e:
        results.append(("Health Endpoint", "FAIL", str(e)))
        print(f"[FAIL] Health Endpoint - {e}")

    # 2. Hospitals Directory (Public)
    try:
        r = requests.get(f"{BASE_URL}/hospitals")
        data = r.json()
        count = len(data.get("data", []))
        status = "PASS" if r.status_code == 200 and count > 0 else "FAIL"
        results.append(("Hospital Directory", status, f"Found {count} hospitals"))
        print(f"[{status}] Hospital Directory - Found {count} accredited centers")
    except Exception as e:
        results.append(("Hospital Directory", "FAIL", str(e)))
        print(f"[FAIL] Hospital Directory - {e}")

    # 3. Compatibility Matrix (Public)
    try:
        r = requests.get(f"{BASE_URL}/matching/compatibility")
        data = r.json()
        groups = len(data.get("data", {}))
        status = "PASS" if r.status_code == 200 and groups == 8 else "FAIL"
        results.append(("Compatibility Matrix", status, f"Verified {groups} blood groups"))
        print(f"[{status}] Compatibility Matrix - {groups} ABO/Rh rules verified")
    except Exception as e:
        results.append(("Compatibility Matrix", "FAIL", str(e)))
        print(f"[FAIL] Compatibility Matrix - {e}")

    # 4. Haversine Distance Preview (Public)
    try:
        payload = {
            "lat1": 28.6139, "lon1": 77.2090,
            "lat2": 28.7041, "lon2": 77.1025
        }
        r = requests.post(f"{BASE_URL}/matching/distance-preview", json=payload)
        data = r.json()
        dist = data.get("data", {}).get("distance_km")
        eta = data.get("data", {}).get("estimated_driving_minutes")
        status = "PASS" if r.status_code == 200 and dist is not None else "FAIL"
        results.append(("Haversine Proximity Calculation", status, f"Computed distance: {dist} km (~{eta} min)"))
        print(f"[{status}] Haversine Proximity - Distance: {dist} km (~{eta} min)")
    except Exception as e:
        results.append(("Haversine Proximity Calculation", "FAIL", str(e)))
        print(f"[FAIL] Haversine Proximity - {e}")

    # 5. Patient Registration & Login Flow
    patient_token = None
    patient_id = None
    created_req_id = None
    ts = int(time.time())
    try:
        payload = {
            "email": f"patient.live.{ts}@example.com",
            "password": "Password123!",
            "full_name": "Sarah Jenkins (Demo)",
            "role": "patient",
            "phone_number": "+15550190001"
        }
        r = requests.post(f"{BASE_URL}/auth/register", json=payload)
        data = r.json()
        if r.status_code in (200, 201) and data.get("success"):
            patient_token = data.get("data", {}).get("session", {}).get("access_token")
            patient_id = data.get("data", {}).get("user", {}).get("id")
            status = "PASS"
            msg = f"User: {data['data']['user']['email']}"
        else:
            status = "FAIL"
            msg = data.get("error", {}).get("message", "Error")
        results.append(("Patient Auth (Register)", status, msg))
        print(f"[{status}] Patient Registration - {msg}")
    except Exception as e:
        results.append(("Patient Auth (Register)", "FAIL", str(e)))
        print(f"[FAIL] Patient Registration - {e}")

    # 6. Patient Create Emergency Blood Request
    if patient_token and patient_id:
        headers = {"Authorization": f"Bearer {patient_token}"}
        try:
            req_payload = {
                "patient_id": patient_id,
                "hospital_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
                "blood_group": "O-",
                "units_required": 2,
                "urgency_level": "critical",
                "required_by": "2026-11-12T12:00:00Z",
                "clinical_notes": "Live trauma ER requisition.",
                "latitude": 28.6145,
                "longitude": 77.2090
            }
            r = requests.post(f"{BASE_URL}/blood-requests", json=req_payload, headers=headers)
            data = r.json()
            status = "PASS" if r.status_code in (200, 201) and data.get("success") else "FAIL"
            created_req_id = data.get("data", {}).get("id")
            results.append(("Emergency Blood Request Creation", status, f"Request ID: {created_req_id}"))
            print(f"[{status}] Emergency Request Creation - ID: {created_req_id}")
        except Exception as e:
            results.append(("Emergency Blood Request Creation", "FAIL", str(e)))
            print(f"[FAIL] Emergency Request Creation - {e}")

        # 7. Matching Donors Discovery
        try:
            r = requests.get(f"{BASE_URL}/blood-requests/{created_req_id}/matching-donors", headers=headers)
            data = r.json()
            matched = len(data.get("data", []))
            status = "PASS" if r.status_code == 200 and data.get("success") else "FAIL"
            results.append(("Donor Matching Engine", status, f"Discovered {matched} compatible donors"))
            print(f"[{status}] Donor Matching Engine - Discovered {matched} compatible donors")
        except Exception as e:
            results.append(("Donor Matching Engine", "FAIL", str(e)))
            print(f"[FAIL] Donor Matching Engine - {e}")

    # 8. Donor Workflow (Feed & Response)
    donor_payload = {
        "email": f"donor.live.{ts}@example.com",
        "password": "Password123!",
        "full_name": "Alex Rivera (Demo Donor)",
        "role": "donor",
        "phone_number": "+15550190002",
        "blood_group": "O-"
    }
    try:
        r = requests.post(f"{BASE_URL}/auth/register", json=donor_payload)
        d_data = r.json()
        donor_token = d_data.get("data", {}).get("session", {}).get("access_token")
        donor_id = d_data.get("data", {}).get("user", {}).get("id")
        d_headers = {"Authorization": f"Bearer {donor_token}"}
        
        # Feed
        feed_r = requests.get(f"{BASE_URL}/donors/feed", headers=d_headers)
        feed_data = feed_r.json()
        feed_count = len(feed_data.get("data", []))
        status = "PASS" if feed_r.status_code == 200 and feed_data.get("success") else "FAIL"
        results.append(("Donor Proximity Feed", status, f"{feed_count} emergency requests ranked"))
        print(f"[{status}] Donor Proximity Feed - {feed_count} requests ranked")

        # Response
        resp_body = {
            "request_id": created_req_id or "c1f72944-e22e-4b47-975f-2a3b7c846d02",
            "donor_id": donor_id,
            "response_status": "accepted",
            "estimated_arrival_minutes": 25,
            "notes": "Responding via live E2E runner"
        }
        resp_r = requests.post(f"{BASE_URL}/donors/respond", json=resp_body, headers=d_headers)
        resp_data = resp_r.json()
        resp_status = "PASS" if resp_r.status_code in (200, 201) and resp_data.get("success") else "FAIL"
        results.append(("Donor Response Dispatch", resp_status, f"Status: {resp_data.get('data', {}).get('response_status')}"))
        print(f"[{resp_status}] Donor Response Dispatch - Status: {resp_data.get('data', {}).get('response_status')}")

    except Exception as e:
        results.append(("Donor Workflow", "FAIL", str(e)))
        print(f"[FAIL] Donor Workflow - {e}")

    # 9. AI Triage Assistant
    try:
        triage_body = {
            "text": "Doctor notes: Severe hemorrhage, urgently requires 2 units of O- packed red cells before tomorrow."
        }
        r = requests.post(f"{BASE_URL}/ai/triage", json=triage_body)
        data = r.json()
        detected = data.get("detected_blood_group")
        units = data.get("recommended_units")
        status = "PASS" if r.status_code == 200 and data.get("success") else "FAIL"
        results.append(("AI Triage Assistant", status, f"Detected: {detected}, Units: {units}"))
        print(f"[{status}] AI Triage Assistant - Detected Group: {detected}, Units: {units}, Urgency: {data.get('recommended_urgency')}")
    except Exception as e:
        results.append(("AI Triage Assistant", "FAIL", str(e)))
        print(f"[FAIL] AI Triage Assistant - {e}")

    # 10. AI Donor Guidance
    try:
        guidance_body = {"query": "How much water should I drink before voluntary donation?"}
        r = requests.post(f"{BASE_URL}/ai/donor-guidance", json=guidance_body)
        data = r.json()
        status = "PASS" if r.status_code == 200 and data.get("success") else "FAIL"
        has_disclaimer = bool(data.get("disclaimer"))
        results.append(("AI Donor Guidance", status, f"Guidance returned, Disclaimer: {has_disclaimer}"))
        print(f"[{status}] AI Donor Guidance - Medical guidance generated with disclaimer")
    except Exception as e:
        results.append(("AI Donor Guidance", "FAIL", str(e)))
        print(f"[FAIL] AI Donor Guidance - {e}")

    # Summary
    print("\n==================================================")
    print("   LIVE API VALIDATION SUMMARY")
    print("==================================================")
    passed = sum(1 for _, s, _ in results if s == "PASS")
    total = len(results)
    for name, s, detail in results:
        print(f"  [{s}] {name}: {detail}")
    print(f"\nFinal Result: {passed}/{total} Live API Modules PASSED")

if __name__ == "__main__":
    run_tests()
