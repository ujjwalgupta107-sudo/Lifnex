# Lifnex — Security & Privacy Architecture

---

## 1. Defense-in-Depth Layers

Lifnex separates security controls across three distinct boundaries:

1. **Authentication (Who is the user?):**
   - Managed by **Supabase Auth** (`auth.users`) with built-in 6-digit email OTP verification (`sign_up` / `verify_otp`).
   - Unverified accounts are blocked at login (`403 EMAIL_NOT_VERIFIED`).
   - JWTs are cryptographically verified in `backend/app/utils/auth_guard.py`:
     - Asymmetric `ES256`/`RS256` tokens are verified against Supabase's public JWKS endpoint (`SUPABASE_JWKS_URL`) with strict `exp`, `aud="authenticated"`, and `iss` validation.
     - Symmetric `HS256` tokens (used in automated test harnesses) are verified against `Config.SECRET_KEY`.
     - **Zero Service-Role Misuse:** `SUPABASE_SECRET_KEY` is never used to sign or verify client JWTs and is never exposed to frontend code.

2. **Authorization (What can the user do?):**
   - `@require_auth` validates the `Authorization: Bearer <token>` header, queries `public.users`, verifies `is_active = True`, and attaches `g.user`.
   - `@require_roles(...)` enforces strict role checks (`patient`, `donor`, `hospital`, `admin`) and wraps `@require_auth`.
   - **Role Escalation Prevention:** `RegisterRequest` in `backend/app/validators/auth_schemas.py` and `POST /api/v1/auth/register` reject any public attempt to register as `admin` (`403 FORBIDDEN`).
   - **BOLA / IDOR Protections:** Patients can only view matching donors, view responses, or cancel requests where `request.patient_id == g.user["id"]`. Notification read mutations check `recipient_id == g.user["id"]`.

3. **Database Security (Which records can be accessed?):**
   - Migration `001_initial_schema.sql` enables RLS on all 9 tables and revokes all table grants from `anon` and `authenticated`.
   - Migration `002_security_hardening.sql` installs `SECURITY DEFINER` helper functions (`SET search_path = public, pg_temp`) and granular RLS policies isolating user, donor, hospital, and audit records.

---

## 2. Environment & Project Isolation

`backend/app/config.py` enforces a strict Staging allowlist and Production blocklist:
- **Approved Staging Project:** `jejnuespiisksqfgqwsg`
- **Prohibited Production Refs:** `ygbprigcrooveopipkcl`, `krvxybseqaxeculpgveg` (connections are explicitly rejected at configuration validation time).

---

## 3. HTTP Security Headers & AI Privacy

- **Flask `after_request` Hook (`backend/app/__init__.py`):** Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`.
- **AI Rate Limiting & PII Scrubbing:** `backend/app/routes/ai.py` enforces a 30 requests/minute sliding-window rate limit per IP. `GeminiService._sanitize_input()` redacts email addresses and phone numbers with regex before transmitting prompts to Google Gemini, and `_detect_prompt_injection()` blocks instruction-override attempts.
- **Audit Trail:** Critical state transitions (`USER_LOGIN`, `USER_LOGOUT`, `REQUEST_CREATED`, `DONOR_RESPONDED`, `HOSPITAL_VERIFIED`, `AI_ADMIN_INSIGHTS_GENERATED`) are recorded in `public.audit_logs` via `log_audit_event()`.
