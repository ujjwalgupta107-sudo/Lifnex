# LIFNEX — REST API DESIGN PLAN

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Document Stage:** Phase 1 — Complete Project Planning & System Design  
**API Specification:** RESTful JSON, Versioned (`/api/v1`)  
**Auth Standard:** Supabase JWT Bearer Token (`Authorization: Bearer <jwt>`)

---

## 1. Global API Standards

- **Base URL**: `/api/v1`
- **Content Type**: `application/json` (except multipart file uploads)
- **Standard Success Response**:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Resource retrieved successfully"
  }
  ```
- **Standard Error Response**:
  ```json
  {
    "success": false,
    "error": {
      "code": "RESOURCE_NOT_FOUND",
      "message": "The requested blood emergency record does not exist.",
      "details": []
    }
  }
  ```
- **HTTP Status Codes**:
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created.
  - `400 Bad Request`: Validation failure or malformed payload.
  - `401 Unauthorized`: Missing or invalid Supabase JWT.
  - `403 Forbidden`: Authenticated user lacks required role.
  - `404 Not Found`: Target resource not found.
  - `422 Unprocessable Entity`: Business logic validation failure.
  - `500 Internal Server Error`: Server exception.

---

## 2. API Endpoints Directory

### 2.1 Authentication & Profile Sync (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|---|---|---|
| `POST` | `/auth/sync-profile` | Yes | All | Synchronizes Supabase `auth.users` profile into `public.users` table after signup. |
| `GET` | `/auth/me` | Yes | All | Returns active user profile, assigned role, and associated donor/hospital records. |
| `PUT` | `/auth/profile` | Yes | All | Updates user profile details (full name, phone number). |

### 2.2 Donor Management & Discovery (`/api/v1/donors`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|---|---|---|
| `POST` | `/donors/profile` | Yes | `donor` | Registers or updates donor medical/geographic profile. |
| `GET` | `/donors/profile` | Yes | `donor` | Retrieves current donor's profile, badges, and cooldown countdown. |
| `PATCH` | `/donors/availability` | Yes | `donor` | Toggles availability status (`available`, `busy`, `inactive`). |
| `GET` | `/donors/incoming-requests`| Yes | `donor` | Fetches active compatible blood requests within donor's radius. |
| `POST` | `/donors/respond` | Yes | `donor` | Submits an `accepted` or `declined` response with optional ETA. |
| `GET` | `/donors/history` | Yes | `donor` | Fetches past verified donation history and certificates. |

### 2.3 Blood Emergency Requests (`/api/v1/requests`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|---|---|---|
| `POST` | `/requests` | Yes | `patient`, `hospital` | Creates an emergency blood request. |
| `GET` | `/requests` | Optional | Public / All | Returns active emergency blood requests (filters by blood group, urgency). |
| `GET` | `/requests/<uuid>` | Yes | All | Returns detailed blood request info, tracking status, and response metrics. |
| `PATCH` | `/requests/<uuid>/status` | Yes | `patient`, `hospital`, `admin` | Updates status (`fulfilled`, `cancelled`). |
| `GET` | `/requests/<uuid>/donors` | Yes | Creator, Attending Hospital, Admin | Lists donors who accepted/responded to this request. |
| `POST` | `/requests/<uuid>/prescription` | Yes | Creator | Uploads prescription document to Supabase Storage. |

### 2.4 Matching & Geospatial Discovery (`/api/v1/matching`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|---|---|---|
| `POST` | `/matching/preview` | Yes | `patient`, `hospital` | Previews eligible donor count & average distance for a hypothetical request. |
| `GET` | `/matching/compatible-groups` | No | Public | Returns biological compatibility map for a specified blood group. |
| `GET` | `/matching/hospitals-nearby` | Optional | Public | Lists nearby blood banks and hospitals based on GPS coordinates. |

### 2.5 Hospital & Blood Bank Coordination (`/api/v1/hospitals`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|---|---|---|
| `GET` | `/hospitals` | No | Public | Returns list of verified hospitals and emergency contact numbers. |
| `GET` | `/hospitals/<uuid>` | No | Public | Retrieves hospital profile and blood bank availability indicators. |
| `POST` | `/hospitals/verify-request`| Yes | `hospital`, `admin` | Verifies a patient emergency request to upgrade its authenticity tier. |
| `POST` | `/hospitals/confirm-donation` | Yes | `hospital` | Certifies that a donor successfully donated blood, triggering cooldown. |
| `PATCH` | `/hospitals/inventory` | Yes | `hospital` | Updates hospital's demo blood inventory levels. |

### 2.6 Google Gemini AI Services (`/api/v1/ai`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|---|---|---|
| `POST` | `/ai/triage-assistant` | Yes | All | Uses Gemini to convert natural language medical notes into structured emergency parameters. |
| `POST` | `/ai/compatibility-explainer` | No | Public | Generates clinical yet accessible explanations of donor-recipient compatibility. |
| `POST` | `/ai/donor-prep-guide` | No | Public | Generates personalized pre-donation health and hydration guidance for donors. |
| `GET` | `/ai/analytics-summary` | Yes | `admin` | Generates an AI-authored executive briefing on synthetic demo emergency trends. |

### 2.7 Administrative Governance & Auditing (`/api/v1/admin`)

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|---|---|---|
| `GET` | `/admin/analytics` | Yes | `admin` | Aggregates system metrics (requests, donors, fulfillment rates). |
| `GET` | `/admin/users` | Yes | `admin` | Paginated list of users with role filters and account status toggles. |
| `PATCH` | `/admin/users/<uuid>/status`| Yes | `admin` | Activates or suspends a user account. |
| `GET` | `/admin/audit-logs` | Yes | `admin` | Queries the tamper-evident system audit log. |
| `POST` | `/admin/verify-hospital` | Yes | `admin` | Approves or rejects hospital accreditation and license numbers. |

---

## 3. Sample Request & Response Schemas

### 3.1 Emergency Request Creation (`POST /api/v1/requests`)

#### Request:
```json
{
  "hospital_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "blood_group": "B-",
  "units_required": 2,
  "urgency_level": "critical",
  "required_by": "2026-11-09T20:00:00Z",
  "clinical_notes": "Emergency surgery following road traffic accident. Platelets & PRBC needed urgently.",
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

#### Response:
```json
{
  "success": true,
  "data": {
    "request_id": "c1f72944-e22e-4b47-975f-2a3b7c846d02",
    "status": "open",
    "verification_status": "pending_verification",
    "matched_donors_notified": 8,
    "blood_group": "B-",
    "units_required": 2,
    "urgency_level": "critical",
    "created_at": "2026-11-09T14:45:00Z"
  },
  "message": "Emergency blood broadcast published and 8 nearby donors alerted."
}
```

### 3.2 Gemini AI Request Triage (`POST /api/v1/ai/triage-assistant`)

#### Request:
```json
{
  "raw_text": "Need 3 bags of O negative blood at Metro Heart Institute as soon as possible for an urgent cardiac bypass surgery scheduled in 4 hours."
}
```

#### Response:
```json
{
  "success": true,
  "data": {
    "structured": {
      "blood_group": "O-",
      "units_required": 3,
      "urgency_level": "critical",
      "hospital_name_detected": "Metro Heart Institute",
      "time_sensitivity": "Within 4 hours",
      "clinical_summary": "Cardiac bypass surgery requiring universal donor PRBC."
    },
    "ai_explanation": "Extracted O- as target group with critical urgency due to impending cardiac surgery window."
  },
  "message": "Clinical triage processed successfully."
}
```

