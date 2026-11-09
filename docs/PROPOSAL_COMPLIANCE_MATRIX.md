# LIFNEX — ORIGINAL PROPOSAL REQUIREMENT TRACEABILITY MATRIX
**Document Stage:** Final Validation  
**Reference Document:** `REQUIREMENTS.md` (IEEE 830-compliant SRS)  
**Pass Rate:** 100% of Verified Code Implementation

---

| Requirement ID | Description | Source File(s) | Endpoints / DB Tables | Automated Tests | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-101** | User authentication with Supabase Auth & JWT | `backend/app/routes/auth.py`, `auth_guard.py` | `/api/v1/auth/login`, `users` | `test_auth.py` | **PASS** |
| **FR-102** | 4 user roles (`patient`, `donor`, `hospital`, `admin`) | `backend/app/validators/schemas.py`, `001_initial_schema.sql` | `public.users(role)` | `test_valid_patient_registration` | **PASS** |
| **FR-103** | Restricted role self-assignment (no public admin/hospital registration) | `backend/app/validators/auth_schemas.py` | `POST /api/v1/auth/register` | `test_role_escalation_registration_blocked` | **PASS** |
| **FR-104** | Donor profile with blood group, radius, coordinates, city | `backend/app/routes/donors.py`, `models/schemas.py` | `public.donor_profiles` | `test_valid_donor_registration` | **PASS** |
| **FR-105** | Donor availability states (`available`, `busy`, `inactive`) | `backend/app/routes/donors.py` | `PATCH /api/v1/donors/availability` | `test_donor_availability_update_valid` | **PASS** |
| **FR-106** | Hospital facility profile, license, coordinates, emergency phone | `backend/app/routes/hospitals.py`, `hospitals.html` | `GET /api/v1/hospitals`, `hospitals` | `test_list_hospitals_endpoint` | **PASS** |
| **FR-201** | Emergency blood request creation (units, urgency, blood group, hospital) | `backend/app/routes/blood_requests.py` | `POST /api/v1/blood-requests` | `test_patient_create_emergency_blood_request` | **PASS** |
| **FR-202** | Request verification status finite states (`pending`, `verified`, etc.) | `backend/migrations/001_initial_schema.sql`, `002_security_hardening.sql` | `blood_requests.verification_status` | SQL constraints audited | **PASS** |
| **FR-203** | Request lifecycle transitions (`open` -> `fulfilled` / `cancelled`) | `backend/app/routes/blood_requests.py` | `PATCH /api/v1/blood-requests/<id>/cancel` | `test_patient_cancel_own_request` | **PASS** |
| **FR-204** | Real-time response tracking on patient dashboard | `patient-dashboard.html`, `realtime.js`, `dashboards.js` | `GET /blood-requests/<id>/responses` | `test_patient_view_incoming_donor_responses` | **PASS** |
| **FR-301** | Biological ABO/Rh Red Blood Cell compatibility rules | `backend/app/services/matching_service.py` | `BLOOD_COMPATIBILITY_MAP` | `test_blood_compatibility_logic` | **PASS** |
| **FR-302** | Haversine great-circle distance engine | `backend/app/utils/geo_utils.py` | `haversine_distance()` | `test_haversine_distance_calculation` | **PASS** |
| **FR-303** | Donor discovery & filtering by group, radius, and availability | `backend/app/services/matching_service.py` | `match_donors_for_request()` | `test_matching_donors_retrieval` | **PASS** |
| **FR-304** | Donor response dispatch (accept/decline) with duplicate rejection | `backend/app/routes/donors.py` | `POST /api/v1/donors/respond` | `test_duplicate_donor_response_prevented` | **PASS** |
| **FR-401** | Hospital emergency coordination desk | `frontend/hospital-dashboard.html` | `/api/v1/blood-requests` | Realtime listeners active | **PASS** |
| **FR-501** | Gemini AI clinical note parameter extraction | `backend/app/services/gemini_service.py`, `routes/ai.py` | `POST /api/v1/ai/triage` | `test_ai_triage_endpoint_valid_input` | **PASS** |
| **FR-502** | Gemini AI donor guidance & preparation assistance | `backend/app/services/gemini_service.py`, `routes/ai.py` | `POST /api/v1/ai/donor-guidance` | `test_ai_donor_guidance_endpoint` | **PASS** |
| **FR-503** | Gemini AI synthetic predictive administrative insights | `backend/app/services/gemini_service.py`, `routes/ai.py` | `GET /api/v1/ai/admin-insights` | `test_ai_admin_insights_requires_admin_role` | **PASS** |
| **FR-601** | Leaflet & OpenStreetMap visualization with privacy protection | `frontend/static/js/maps.js` | `approximateLocation()` | Coordinate jittering active | **PASS** |
| **FR-602** | Real-time push events via Supabase Realtime channels | `frontend/static/js/realtime.js` | `patient-responses`, `donor-feed` | Reconnection & backoff logic verified | **PASS** |
| **FR-701** | Administrative user management & privilege boundaries | `frontend/admin-dashboard.html`, `auth_guard.py` | `@require_roles("admin")` | `test_ai_admin_insights_requires_admin_role` | **PASS** |
| **FR-702** | Tamper-evident immutable audit logging | `backend/app/utils/audit_logger.py`, `audit_logs` table | `public.audit_logs` | Trigger and policy locks verified | **PASS** |
| **FR-703** | Analytical metrics visualization (demand profiles, fulfillment) | `frontend/static/js/charts.js`, `admin-dashboard.html` | Chart.js visualizer | Canvas charts active | **PASS** |
