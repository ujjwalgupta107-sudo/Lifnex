# LIFNEX — BACKEND REST API REFERENCE

**API Version:** `v1`  
**Base URL:** `/api/v1`  
**Data Format:** JSON (`application/json`)  
**Security Standard:** Bearer JWT Validation (Supabase Auth in Phase 4)

---

## 1. Endpoints Directory

### 1.1 Health & Diagnostics
- **`GET /api/v1/health`**
  - **Description**: Returns server status, database connection test report, and registered schema tables.
  - **Access**: Public.
  - **Sample Response**:
    ```json
    {
      "success": true,
      "platform": "Lifnex API v1",
      "tagline": "Connecting Lives When Every Second Matters",
      "database": {
        "status": "connected",
        "connected": true,
        "message": "Successfully connected to Supabase PostgreSQL (LifnexDB)."
      },
      "tables_defined": ["users", "donor_profiles", "hospitals", "blood_requests", "donor_responses", "notifications", "audit_logs", "donation_history", "verification_records"]
    }
    ```

### 1.2 Hospitals & Blood Banks
- **`GET /api/v1/hospitals`**
  - **Description**: Returns verified hospitals and cold-chain blood banks.
  - **Access**: Public.
  - **Sample Response**:
    ```json
    {
      "success": true,
      "data": [
        {
          "name": "City Care Super Specialty Hospital",
          "license_number": "DEMO-HOSP-2026-091",
          "city": "Metropolis",
          "emergency_phone": "+1 (555) 019-2831",
          "has_blood_bank": true,
          "is_verified": true
        }
      ],
      "message": "Verified hospitals retrieved successfully."
    }
    ```

### 1.3 Emergency Blood Requests
- **`GET /api/v1/blood-requests`** (or `/api/v1/requests`)
  - **Description**: Fetches active open emergency blood requisitions.
  - **Access**: Public.
- **`POST /api/v1/blood-requests`** (or `/api/v1/requests`)
  - **Description**: Creates a new emergency blood broadcast. Validated using Pydantic `BloodRequestCreate`.
  - **Access**: Authenticated Patient / Attending Hospital.
  - **Payload**:
    ```json
    {
      "patient_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "hospital_id": "b1ffcd88-8b1a-4fe7-aa5c-5aa8ac270b22",
      "blood_group": "O-",
      "units_required": 2,
      "urgency_level": "critical",
      "clinical_notes": "Immediate OR bypass support",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "required_by": "2026-11-09T20:00:00Z"
    }
    ```

### 1.4 Donor Hub & Availability
- **`PATCH /api/v1/donors/availability`**
  - **Description**: Toggles donor availability status (`available`, `busy`, `inactive`).
  - **Access**: Authenticated Donor.
  - **Payload**:
    ```json
    {
      "donor_id": "uuid-here",
      "availability_status": "available"
    }
    ```

### 1.5 Geospatial & Compatibility Matching
- **`GET /api/v1/matching/compatibility?blood_group=O-`**
  - **Description**: Returns biological compatibility for a specific blood type.
- **`POST /api/v1/matching/distance-preview`**
  - **Description**: Computes great-circle Haversine distance and travel estimate between two coordinate pairs.
  - **Payload**:
    ```json
    {
      "lat1": 28.6139,
      "lon1": 77.2090,
      "lat2": 28.4595,
      "lon2": 77.0266
    }
    ```

