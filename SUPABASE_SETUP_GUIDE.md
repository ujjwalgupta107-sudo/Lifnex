# LIFNEX — SUPABASE SETUP & CONFIGURATION GUIDE

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Document Stage:** Phase 1 — Complete Project Planning & System Design  
**Target Project:** LifnexDB (`https://ygbprigcrooveopipkcl.supabase.co`)  
**Strict Restriction:** 100% Supabase-Centric. No Azure services permitted.

---

## 1. Supabase Project Credentials Architecture

The Lifnex platform connects to the existing Supabase project using environment variables managed exclusively on the server and never checked into source control.

### Required Environment Variables Template (`.env.example`):
```env
# Supabase Project Configuration
SUPABASE_URL=https://ygbprigcrooveopipkcl.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key_here
SUPABASE_SECRET_KEY=your_supabase_service_role_secret_key_here

# Google Gemini AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key_here

# Flask Application Settings
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your_flask_session_secret_key_here
PORT=5000
```

> [!CAUTION]
> **Credential Exposure Prohibition**:
> - `SUPABASE_SECRET_KEY` (service role) grants full administrative bypass of Row Level Security. It must **only** reside in the Flask server environment.
> - Client-side code in `frontend/` may only access `SUPABASE_PUBLISHABLE_KEY` (anon key), where all actions are strictly throttled and governed by Row Level Security policies.
> - The `.env` file is excluded from Git via `.gitignore`.

---

## 2. Supabase Storage Bucket Planning

Lifnex requires two dedicated storage buckets created via the Supabase Dashboard:

1. **`prescriptions` Bucket**:
   - **Privacy**: Private (Requires signed URL to view).
   - **Max File Size**: 5 MB.
   - **Allowed MIME Types**: `image/jpeg`, `image/png`, `application/pdf`.
   - **Purpose**: Stores emergency medical requisitions uploaded by patients.
   - **Access Policy**: Upload permitted by requesting patient; read permitted by patient, attending hospital, and admin.

2. **`hospital-licenses` Bucket**:
   - **Privacy**: Private.
   - **Max File Size**: 10 MB.
   - **Allowed MIME Types**: `image/jpeg`, `image/png`, `application/pdf`.
   - **Purpose**: Medical licenses and regulatory accreditations submitted by hospitals.
   - **Access Policy**: Upload permitted by registering hospital; read permitted by Admin only.

---

## 3. Supabase Realtime Channels Planning

Lifnex leverages Supabase Realtime to push live events to connected browsers:

| Channel Name | PostgreSQL Event | Target Audience | Payload Summary |
|---|---|---|---|
| `blood_requests_channel` | `INSERT` on `blood_requests` | Donors within matching radius | Request ID, Blood Group, Urgency, Hospital Name, Distance |
| `request_status_<request_id>` | `UPDATE` on `blood_requests` | Patient & Attending Hospital | Current status, units fulfilled, expiration time |
| `donor_responses_<request_id>`| `INSERT` on `donor_responses` | Patient & Attending Hospital | Donor accept notice, ETA in minutes |
| `hospital_inventory_channel` | `UPDATE` on `hospitals` | Coordinating Staff & Public | Updated blood supply status indicators |

---

## 4. Supabase Auth Configuration Strategy

- **Authentication Providers**: Email & Password (default enabled).
- **Email Confirmations**: Can be toggled for demo mode or production.
- **User Metadata Injection**: During signup, `user_metadata` will store `full_name` and requested account type (`patient`, `donor`, `hospital`).
- **Profile Synchronization**: Handled safely via backend trigger or explicit `/api/v1/auth/sync-profile` endpoint to populate `public.users` without trusting unauthenticated client inputs.
- **Session Duration**: Standard Supabase JWT expiration (default 3600 seconds) with automated refresh tokens handled by the client-side Supabase JS library.

---

## 5. Verification Policy Notice

> [!NOTE]
> Under Phase 1 rules, database tables and auth policies are planned and documented. Actual table creation and connection testing will occur systematically in Phase 3 & 4 after receiving user approval. No fake connection states will be assumed or reported.

