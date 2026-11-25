# Lifnex — Final Project Audit Report

**Project:** Lifnex — *Connecting Lives When Every Second Matters*  
**Production URL:** `https://lifnex.vercel.app`  
**GitHub Repository:** `https://github.com/ujjwalgupta107-sudo/Lifnex.git`  
**Supabase Project Reference:** `jejnuespiisksqfgqwsg`  
**Audited Through Commit:** `36223e4` (code & deployment fixes across `8f637d2`, `49d8233`, `ff694cf`, `2da2700`, `36223e4`)

---

## 1. Project Architecture Overview
- **Frontend:** React 18, TypeScript, Vite 8 (`vite.config.ts`), Tailwind CSS, Three.js/R3F, Recharts, React Router v6 (`frontend/src/`), pre-rendered HTML shells (`scripts/make-shells.js`), static assets copied to `frontend/dist/static`.
- **Backend:** Python Flask (`backend/app/__init__.py`) exposed as a Vercel Python Serverless Function (`api/index.py`), with blueprints for `/api/v1/health`, `/api/v1/auth`, `/api/v1/hospitals`, `/api/v1/blood-requests` (aliased at `/api/v1/requests`), `/api/v1/donors`, `/api/v1/matching`, `/api/v1/ai`, and `/api/v1/notifications`.
- **Database & Auth:** Supabase PostgreSQL (9 relational tables + 2 privacy-preserving views, 36 hardened RLS policies in `backend/migrations/002_security_hardening_corrected.sql`) and Supabase Auth (GoTrue, `ES256` EC JWKS verification, mandatory email confirmation `mailer_autoconfirm: false`).
- **Hosting:** Vercel (`vercel.json`) serving static frontend output from `frontend/dist` and routing `/api/(.*)` to `/api/index.py`.

---

## 2. Complete Files & Modules Inspected
- **Entrypoint & Config:** `vercel.json`, `api/index.py`, `run.py`, `package.json`, `vite.config.ts`, `tsconfig.json`, `requirements.txt`, `backend/requirements.txt`, `backend/pyproject.toml`, `.gitignore`, `.gitattributes`, `.vercelignore`, `scripts/make-shells.js`, `scripts/copy-static.js`, `scripts/seed_demo_accounts.py`.
- **Backend App:** `backend/app/__init__.py`, `backend/app/config.py`, `backend/app/core/config.py`, `backend/app/core/supabase_client.py`, `backend/app/database/supabase_client.py`, `backend/app/utils/auth_guard.py`, `backend/app/utils/audit_logger.py`, `backend/app/validators/auth_schemas.py`, `backend/app/validators/schemas.py`, `backend/app/routes/auth.py`, `backend/app/routes/blood_requests.py`, `backend/app/routes/donors.py`, `backend/app/routes/hospitals.py`, `backend/app/routes/notifications.py`, `backend/app/routes/ai.py`, `backend/app/routes/health.py`, `backend/app/api/v1/matching.py`, `backend/app/services/email_service.py`, `backend/app/services/otp_service.py`, `backend/app/services/matching_service.py`, `backend/app/services/notification_service.py`, `backend/app/services/audit_service.py`.
- **Migrations & Tests:** `backend/migrations/001_initial_schema_corrected.sql`, `backend/migrations/002_security_hardening_corrected.sql`, and all 12 test modules in `backend/tests/`.
- **Frontend App:** `frontend/src/App.tsx`, `frontend/src/lib/routes.tsx`, `frontend/src/services/api.ts`, `frontend/src/components/navigation/Navigation.tsx`, `frontend/src/pages/auth/LoginPage.tsx`, `frontend/src/pages/auth/RegisterPage.tsx`, `frontend/src/pages/auth/VerifyOtpPage.tsx`, `frontend/src/pages/auth/ForgotPasswordPage.tsx`, `frontend/src/pages/auth/ResetPasswordPage.tsx`, `frontend/src/pages/dashboards/*.tsx`, `frontend/src/pages/public/*.tsx`, `frontend/src/scripts/auth.ts`.

---

## 3. Bugs Discovered & 4. Root Causes
See [`docs/BUG_FIX_LOG.md`](./BUG_FIX_LOG.md) for the complete itemized list of all bugs, root causes, and commits. Summary of critical issues resolved:
1. Unauthenticated `/reset-password` UUID password-overwrite vulnerability (`auth.py`).
2. `Config.FRONTEND_URL` missing attribute crash (`config.py` / `auth.py`).
3. Orphaned unverified `auth.users` creation via `admin.generate_link` when SMTP was absent, plus plaintext OTP logging (`auth.py`).
4. Missing `email_address_not_authorized` handling (`auth.py`, `email_service.py`).
5. Non-persistent in-memory OTP resend cooldown and invalid email string writes to `audit_logs` UUID columns (`otp_service.py`, `auth.py`).
6. `ES256` EC JWKS verification failure (`Not an RSA key` in `auth_guard.py`) and weak `demo-token-` Vercel guard.
7. Shared stateful `anon` GoTrue singleton leaking across requests (`supabase_client.py`).
8. Missing `refresh_token` / `/api/v1/auth/refresh` flow and missing role-based `<RequireVerifiedAuth>` dashboard guards (`auth.py`, `api.ts`, `App.tsx`).
9. `ForgotPasswordPage.tsx` mocked submit without calling backend, and missing `ResetPasswordPage.tsx` + `/reset-password` shell.
10. Unauthenticated `PATCH /api/v1/donors/availability`, donor impersonation in `POST /api/v1/donors/respond`, unauthenticated raw `GET /api/v1/blood-requests` PII exposure, `is_demo` data leakage, `datetime` JSON serialization bug in `create_blood_request`, `"routine"` urgency mismatch, and missing `NOT NULL` hospital columns on hospital registration.
11. Vercel `vercel.json` double `/frontend/dist/` rewrite path causing HTTP 404 on direct SPA routes, followed by `cleanUrls: true` breaking `/api/index.py`.

---

## 5. Fixes Implemented
Implemented across commits `8f637d2`, `49d8233`, `ff694cf`, `2da2700`, and `36223e4`:
- Hardened authentication, JWKS (`ES256` + `RS256` + key-rotation refresh), fresh per-request `anon` clients, `/api/v1/auth/refresh`, JWT-verified `/reset-password`, and Vercel `demo-token-` blocking.
- Enforced mandatory Supabase Email OTP (`mailer_autoconfirm: false`), serverless PostgreSQL `audit_logs` 60-second resend cooldown, honest `429 RATE_LIMITED` / `403 EMAIL_NOT_AUTHORIZED` errors when SMTP is absent, and zero plaintext OTP logging.
- Hardened RBAC and privacy across `/api/v1/donors/*` and `/api/v1/blood-requests/*`, fixed `BloodRequestCreate` defaults/serialization, fixed hospital registration `NOT NULL` fields, and isolated `is_demo` sessions.
- Wired `ForgotPasswordPage`, created `ResetPasswordPage` + shell, added role-guarded `<RequireVerifiedAuth>`, and aligned `api.ts` methods (`PATCH`) and auto-refresh on `401`.
- Fixed `vercel.json` so both `/api/(.*)` → `/api/index.py` and all extensionless SPA routes return HTTP 200.

---

## 6. Authentication Status
- **Code & Infrastructure:** Ready and verified (login, JWT `ES256` verification, `/me`, `/refresh`, `/logout`, `/reset-password` JWT check, RBAC, and dashboard route guards).
- **Live Demo Account Authentication:** **BLOCKED on Account Restoration Approval.** Live `jejnuespiisksqfgqwsg` currently has `0` users in `auth.users` and `0` rows in `public.users`, so all 4 demo login requests return HTTP `401 INVALID_CREDENTIALS`. No accounts were seeded without explicit approval.

---

## 7. Registration & OTP Status
- Mandatory email OTP verification (`mailer_autoconfirm: false`) is preserved and enforced at Supabase Auth, `public.users.is_active`, `require_auth`, and `<RequireVerifiedAuth>`.
- Custom SMTP (`SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`) is **not** configured. Without custom SMTP, registration depends on Supabase's built-in email provider (restricted by low hourly rate limits and, where enabled, authorized project recipient limits) and returns structured `429 RATE_LIMITED` or `403 EMAIL_NOT_AUTHORIZED` errors whenever delivery cannot be accepted.

---

## 8. Database & RLS Audit
- Live table counts (`jejnuespiisksqfgqwsg`): `users=0`, `donor_profiles=0`, `hospitals=0`, `blood_requests=0`, `donor_responses=0`, `notifications=0`, `donation_history=0`, `verification_records=0`, `audit_logs=42` (historical audit logs preserved intact).
- Migration `002_security_hardening_corrected.sql` enables RLS on all 9 tables with 36 policies and `security_invoker = false` sanitized public views.
- **Identified RLS Note for Demo Restoration:** If synthetic demo accounts (`is_demo = True`) are restored later, `public.is_admin()` in `002_security_hardening_corrected.sql` should be updated to include `AND is_demo = FALSE` so a demo admin JWT cannot query real rows directly via PostgREST.

---

## 9. Frontend Audit
- Audited all public pages, auth pages, and all 4 role dashboards (`Patient`, `Donor`, `Hospital`, `Admin`).
- Fixed `ForgotPasswordPage` fake submission, added `ResetPasswordPage` + shell, added role-based `<RequireVerifiedAuth>`, added auto-refresh + session-expired redirect, and fixed `api.ts` HTTP verbs (`PATCH` for cancel/verify/mark-all-read).
- Playwright desktop (1440×900) and mobile (375×667) checks passed with 0 console errors, 0 page errors, and 0 horizontal overflows on localhost; production Playwright on `36223e4` passed 10 routes with 0 console errors and 0 page errors.

---

## 10. Backend Audit
- All blueprints reviewed (`auth`, `blood_requests`, `donors`, `hospitals`, `notifications`, `ai`, `health`, `matching`).
- Fixed unauthenticated mutation on `/donors/availability`, impersonation risk on `/donors/respond`, unauthenticated PII exposure on `GET /blood-requests`, hospital `NOT NULL` registration crash, `datetime` JSON serialization crash on blood request insert, and `TESTING` DB leakage on `forgot_password` / `notifications`.

---

## 11. Security Findings
- No hardcoded secrets in committed files; `.env` is ignored by `.gitignore` and `.vercelignore`.
- No OTPs logged or returned in API responses.
- Service-role credentials remain strictly server-side.
- Remaining database-layer recommendation: add `AND is_demo = FALSE` inside `public.is_admin()` before restoring a demo `admin@lifnex.org` account.

---

## 12. Performance Findings
- Vite bundle chunks are code-split per route/dashboard; main entry JS is `44.94 kB` (`16.68 kB` gzip).
- Serverless JWKS caching avoids per-request network calls to Supabase `.well-known/jwks.json` while refreshing once on `kid` rotation.
- **Large Asset Delivery Finding on Vercel:** Image files tracked in Git LFS (e.g., `hero-medical-team.jpg`) currently resolve to `131`-byte Git LFS pointer stubs on Vercel when Vercel's **Git Large File Storage (LFS)** project toggle is not enabled (`lifnex-mark.png`, which is excluded from LFS in `.gitattributes`, serves normally at `62,372` bytes).

---

## 13. Test Results & 14. Mocked vs Real Test Distinction

| Suite / Check | Environment / Type | Result |
| :--- | :--- | :--- |
| `pytest backend/tests -v --tb=short` | Mixed: Unit + Mocked live-mode integration + 5 real staging DB read tests (`test_live_staging_integration.py`) | **110 passed, 36 warnings** (`20.16s`) |
| `npx tsc --noEmit` | Local TypeScript compiler check | **Exited 0** (0 errors) |
| `npm run shells && npm run build` | Local shell generator + Vite production build | **Exited 0** (`18` shells, `648ms` build) |
| Local Playwright (`http://localhost:5173`) | Real browser against local Vite + Flask | **9 routes tested**, `0` console errors, `0` page errors, `0` broken images, `0` mobile 375px overflows, unauth `/dashboard/patient` → `/login` |
| Production HTTP & API checks (`https://lifnex.vercel.app`) | Real Vercel production (`36223e4`) | **14/14 routes HTTP 200**, `/api/v1/health` HTTP `200`, `PATCH /donors/availability` unauth `401`, `GET /blood-requests` unauth `200` sanitized feed |
| Production Playwright (`https://lifnex.vercel.app`) | Real browser against Vercel (`36223e4`) | **10 routes tested**, `0` console errors, `0` page errors, unauth `/dashboard/admin` → `/login` |
| Production Demo Logins (`patient`/`donor`/`hospital`/`admin`) | Real Vercel production (`jejnuespiisksqfgqwsg`) | **BLOCKED (HTTP 401 `INVALID_CREDENTIALS`)** — `auth.users = 0` |
| Real Inbox Email OTP Delivery | Real production email delivery | **BLOCKED** — Custom SMTP not configured |

---

## 15. Vercel Production Verification
Verified live on `https://lifnex.vercel.app` (`36223e4`): homepage, all 14 SPA routes, `/api/v1/health` connected to `jejnuespiisksqfgqwsg`, hardened auth endpoints, and unauthenticated dashboard redirects all pass.

---

## 16. GitHub Push Status & 17. Git LFS Verification & 18. Commit Hashes
- **Branches:** `main` and `staging` synchronized with `origin/main` and `origin/staging`.
- **Key Commits:**
  - `8f637d2` — Registration OTP security & persistent `audit_logs` cooldown
  - `49d8233` — Login/refresh/JWT/reset-password/RBAC hardening
  - `ff694cf` — Donor/blood-request RBAC, hospital signup schema, `ForgotPasswordPage` + `ResetPasswordPage`
  - `2da2700` — Output-relative SPA rewrites
  - `36223e4` — Final `vercel.json` fix preserving `/api/index.py` + SPA routes
- **Git LFS (`git-lfs/3.7.1`):**
  - `.gitattributes` tracks `*.pdf`, `*.png`, `*.jpg`, `*.jpeg` (with `lifnex-mark.png` excluded).
  - `git lfs push --all origin main`: **100% uploaded (`31/31`, `15 MB`)**.
  - `git lfs fsck`: **`Git LFS fsck OK`**.
  - `git lfs status`: clean.

---

## 19. Remaining Blockers (Require User Action / Approval)
1. **Demo Account Restoration / Backup Recovery (Approval Required):** `auth.users = 0` and `public.users = 0` in `jejnuespiisksqfgqwsg`. Check Supabase Dashboard backups/PITR or approve controlled `is_demo = True` restoration.
2. **Custom SMTP Configuration (Manual Dashboard Setup):** Required in Supabase Dashboard (**Authentication → Email Settings**) for reliable public registration email OTP delivery.
3. **Supabase Auth URL Configuration (Manual Dashboard Setup):** Set **Site URL** = `https://lifnex.vercel.app` and add `https://lifnex.vercel.app/**` to **Redirect URLs**.
4. **Vercel Git LFS Setting (Manual Dashboard Toggle):** Enable **Git Large File Storage (LFS)** in Vercel Project Settings → Git (and redeploy) so LFS-tracked `.jpg`/`.png` assets in `frontend/static` serve binary image files rather than `131`-byte pointer stubs.

---

## 20. Final Production Readiness Assessment
- **Codebase, APIs, Security Guards, Build, & Git/Git LFS Delivery:** **READY** (110/110 backend tests, clean TS & Vite build, live Vercel `36223e4` routing & health verified).
- **End-to-End Live User Auth & Public Registration:** **CONDITIONAL / BLOCKED ON EXTERNAL DASHBOARD CONFIGURATION & APPROVAL** (demo account restoration approval, Supabase custom SMTP, Supabase URL config, and Vercel Git LFS toggle).
