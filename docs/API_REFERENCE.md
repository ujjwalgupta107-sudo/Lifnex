# Lifnex — REST API Reference (`/api/v1`)

All endpoints are served from `http://localhost:5000/api/v1` (proxied via `/api` in Vite dev server) and return JSON envelopes containing `success: boolean` and either `data` or `error: { code, message }`.

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Public (`patient`, `donor`, `hospital`) | Registers user via Supabase Auth native `sign_up`, syncs `public.users`, triggers 6-digit OTP email. Blocks `admin` self-registration (`403`). |
| `POST` | `/api/v1/auth/verify-otp` | No | Public | Verifies 6-digit email OTP via `anon.auth.verify_otp` (`type: signup`), activates `public.users.is_active = True`, returns Bearer JWT. |
| `POST` | `/api/v1/auth/resend-otp` | No | Public | Resends native Supabase verification OTP with rate-limit (`429`) handling. |
| `POST` | `/api/v1/auth/login` | No | Public | Authenticates via `sign_in_with_password`; rejects unverified emails (`403 EMAIL_NOT_VERIFIED`). |
| `POST` | `/api/v1/auth/logout` | Yes | Any | Calls Supabase `sign_out` and records `USER_LOGOUT` in `audit_logs`. |
| `POST` | `/api/v1/auth/forgot-password` | No | Public | Triggers Supabase `reset_password_for_email`. |
| `POST` | `/api/v1/auth/reset-password` | No | Public | Updates password with valid recovery token. |
| `GET` | `/api/v1/auth/me` | Yes | Any | Returns authenticated user record + role-specific `donor_profile` or `hospital_profile`. |

---

## 2. Blood Requests (`/api/v1/blood-requests` & alias `/api/v1/requests`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/blood-requests` | No | Public | Lists active `open` blood requests (falls back to `DEMO_BLOOD_REQUESTS` when offline). |
| `POST` | `/api/v1/blood-requests` | Yes | `patient`, `hospital`, `admin` | Creates an emergency blood requisition validated by `BloodRequestCreate` Pydantic schema. |
| `GET` | `/api/v1/blood-requests/<request_id>/matching-donors` | Yes | `patient`, `hospital`, `admin` | Returns ranked compatible donors within travel radius. Enforces owner check for `patient` (`403`). |
| `PATCH` | `/api/v1/blood-requests/<request_id>/cancel` | Yes | `patient`, `admin` | Cancels an `open` or `in_progress` request. Enforces owner check for `patient` (`403`). |
| `GET` | `/api/v1/blood-requests/<request_id>/responses` | Yes | `patient`, `hospital`, `admin` | Lists donor handshake responses for a request. |

---

## 3. Donors (`/api/v1/donors`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `PATCH` | `/api/v1/donors/availability` | No* | Donor | Updates donor `availability_status` (`available`, `busy`, `inactive`). *Accepts `donor_id` in JSON body. |
| `GET` | `/api/v1/donors/feed` | Yes | `donor`, `admin` | Returns open/in-progress requests ranked by urgency tier and Haversine distance. |
| `POST` | `/api/v1/donors/respond` | Yes | `donor`, `admin` | Submits donor response (`accepted`, `declined`, `en_route`, etc.) with optional ETA. Prevents duplicates (`409`). |
| `GET` | `/api/v1/donors/history` | Yes | `donor`, `admin` | Returns authenticated donor's response and donation history. |

---

## 4. Hospitals (`/api/v1/hospitals`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/hospitals` | No | Public | Lists verified hospitals/blood banks; supports `?city=<query>` filter. |
| `POST` | `/api/v1/hospitals` | Yes | `hospital`, `admin` | Registers a healthcare facility (`is_verified=False` unless submitted by `admin`). |
| `PATCH` | `/api/v1/hospitals/<hospital_id>/verify` | Yes | `admin` | Approves hospital accreditation (`is_verified=True`) and logs `HOSPITAL_VERIFIED`. |

---

## 5. Matching & Geospatial (`/api/v1/matching`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/matching/compatibility` | No | Public | Returns full ABO/Rh compatibility matrix or single group via `?blood_group=O-`. |
| `POST` | `/api/v1/matching/distance-preview` | No | Public | Computes Haversine distance (`km`) and synthetic driving estimate (`dist * 2.2` mins) between `(lat1, lon1)` and `(lat2, lon2)`. |

---

## 6. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/notifications` | Yes | Any | Lists authenticated user's notifications (`?unread_only=true`) + `unread_count`. |
| `PATCH` | `/api/v1/notifications/<notification_id>/read` | Yes | Owner / `admin` | Marks a single notification read; returns `403` if owned by another user. |
| `PATCH` | `/api/v1/notifications/mark-all-read` | Yes | Any | Marks all unread notifications for the caller as read. |

---

## 7. AI Coordination Assistant (`/api/v1/ai`) & Health (`/api/v1/health`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/ai/triage` | No | Public (Rate-limited) | Extracts blood group, urgency, and units from clinical notes with PII redaction and NBTC disclaimer. |
| `POST` | `/api/v1/ai/summarize-request` | No | Public (Rate-limited) | Generates a concise broadcast summary from requisition parameters. |
| `POST` | `/api/v1/ai/donor-guidance` | No | Public (Rate-limited) | Provides educational donor guidance and directs clinical questions to physicians. |
| `GET` / `POST` | `/api/v1/ai/admin-insights` | Yes | `admin` | Summarizes platform demand metrics and logs `AI_ADMIN_INSIGHTS_GENERATED`. |
| `GET` | `/api/v1/health` | No | Public | Returns API operational status and live Supabase connectivity check. |
