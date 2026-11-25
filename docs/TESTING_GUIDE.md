# Lifnex — Testing & Quality Assurance Guide

---

## 1. Latest Verified Execution Results

Executed against the repository on **2026-11-25** with live Staging Supabase connectivity (`jejnuespiisksqfgqwsg`):

- **Backend Automated Test Suite:** **97 / 97 passed (100% PASS)** in **22.69s** across all 12 test modules (`pytest 9.2.0`, Python `3.11.9`).
- **Frontend Production Build:** **`vite build && node scripts/copy-static.js`** succeeded in **507ms** with zero errors across 2,443 transformed modules.

---

## 2. Commands

```powershell
# Backend full test suite
$env:PYTHONPATH="."; .\venv\Scripts\pytest backend/tests/ -v

# Frontend production bundle verification
npm run build
```

---

## 3. Test Module Breakdown (`backend/tests/`)

| Test Module | Tests | Coverage Scope |
|---|---|---|
| `test_auth.py` | 12 | Registration (`patient`, `donor`, `hospital`), `admin` escalation block, login, token expiry, password reset |
| `test_backend.py` | 6 | Health probe, Haversine distance accuracy, ABO/Rh compatibility, request validation |
| `test_email_service.py` | 10 | SMTP fallback configuration checks, HTML templates, PII safety, error handling |
| `test_frontend_assets.py` | 6 | HTML routes, extensionless route resolution, CSS/JS/image MIME types |
| `test_live_staging_integration.py` | 5 | Live Supabase Staging connectivity, 9 tables, RLS protection for `anon`, production ref block |
| `test_otp_auth.py` | 9 | 6-digit OTP verification, expiry rejection, resend cooldown, rate limiting, unverified login block |
| `test_phase5_e2e.py` | 10 | Blood request creation, role checks, donor matching, cross-patient access block (BOLA), donor response & cancellation |
| `test_phase6_ai.py` | 9 | Gemini AI triage, PII redaction, prompt injection defense, mandatory NBTC disclaimer, admin insights RBAC |
| `test_phase7_notifications.py` | 6 | Notification auth enforcement, unread filter, mark read, foreign notification `403` block |
| `test_routes_extended.py` | 11 | Hospital listing & city filter, donor availability validation, compatibility matrix, distance preview, logout |
| `test_staging_smoke.py` | 10 | End-to-end smoke checks, security headers, full patient/donor/notification/AI workflows |
| `test_vercel_entrypoint.py` | 2 | Serverless WSGI initialization (`api/index.py`) and health check |

> **Note on `scripts/browser_live_test.py`:** Targets legacy static pages and is superseded by the React SPA + Pytest suite.
