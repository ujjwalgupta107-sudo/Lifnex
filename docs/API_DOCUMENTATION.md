# LIFNEX API DOCUMENTATION (V1)
**Lifnex — Connecting Lives When Every Second Matters**

---

## 1. Authentication & Token Management
All secured endpoints require the `Authorization: Bearer <JWT>` header. Tokens are verified against Supabase Auth JWKS.

### `POST /api/v1/auth/register`
Registers a new user (Patient or Voluntary Donor).
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "full_name": "Jane Doe",
    "phone": "+1-555-019-1234",
    "role": "patient",
    "city": "Metropolis"
  }
  ```

### `POST /api/v1/auth/login`
Authenticates a user and returns an access token and user claims.
- **Body:** `{"email": "...", "password": "..."}`

### `GET /api/v1/auth/me`
Returns profile details for the currently authenticated caller.

### `POST /api/v1/auth/logout`
Revokes user session tokens.

---

## 2. Emergency Blood Requisitions

### `GET /api/v1/blood-requests`
Lists open emergency blood requests. Supports blood group and urgency filtering.

### `POST /api/v1/blood-requests`
Creates an emergency requisition.
- **Guarded By:** `patient`, `hospital`, `admin`
- **Body:**
  ```json
  {
    "hospital_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "blood_group": "O-",
    "units_required": 2,
    "urgency_level": "critical",
    "clinical_notes": "Immediate surgical resuscitation required.",
    "latitude": 28.6145,
    "longitude": 77.2100,
    "required_by": "2026-11-10T06:00:00Z"
  }
  ```

### `GET /api/v1/blood-requests/<id>/matching-donors`
Returns compatible voluntary donors within radius.
- **Guarded By:** Request Owner or Admin (rejects foreign callers with `403 Forbidden`).

### `PATCH /api/v1/blood-requests/<id>/cancel`
Cancels a pending emergency requisition.
- **Guarded By:** Request Owner or Admin.

### `GET /api/v1/blood-requests/<id>/responses`
Lists donor acceptances and ETA dispatches for this requisition.

---

## 3. Voluntary Donor Coordination

### `GET /api/v1/donors/feed`
Lists matching emergency requisitions within the donor's travel radius, ranked by urgency and proximity.
- **Guarded By:** `donor`, `admin`

### `POST /api/v1/donors/respond`
Responds to an emergency requisition (accept, decline, or interest).
- **Guarded By:** `donor`, `admin`
- **Body:**
  ```json
  {
    "request_id": "c1f72944-e22e-4b47-975f-2a3b7c846d02",
    "response_status": "accepted",
    "eta_minutes": 25,
    "notes": "Departing immediately by car."
  }
  ```
- **Duplicate Protection:** Duplicate responses return `409 Conflict`.

### `PATCH /api/v1/donors/availability`
Updates availability status (`available`, `busy`, `inactive`).

### `GET /api/v1/donors/history`
Retrieves past donations and dispatch responses.

---

## 4. Gemini AI Coordination Assistant

### `POST /api/v1/ai/triage`
Parses clinical notes into structured parameters (`blood_group`, `urgency`, `units`). Detects missing fields.
- **Rate Limit:** 30 req/min.

### `POST /api/v1/ai/summarize-request`
Generates factual 1-sentence dispatch summaries without inventing patient details.

### `POST /api/v1/ai/donor-guidance`
Provides voluntary donor hydration and logistical guidance. Directs medical eligibility to on-site doctors.

### `GET /api/v1/ai/admin-insights`
Summarizes demand distribution and dispatch velocity. Restricted to `admin` role.

---

## 5. Notifications

### `GET /api/v1/notifications`
Retrieves notifications for the current user. Supports `?unread_only=true`.

### `PATCH /api/v1/notifications/<id>/read`
Marks an individual notification read. Enforces owner verification.

### `PATCH /api/v1/notifications/mark-all-read`
Marks all user notifications as read.

