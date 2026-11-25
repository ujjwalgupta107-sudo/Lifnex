# LIFNEX PRODUCTION DEPLOYMENT & AUTHENTICATION AUDIT REPORT
**Target Production Application:** [https://lifnex.vercel.app](https://lifnex.vercel.app)  
**Repository:** [https://github.com/ujjwalgupta107-sudo/Lifnex](https://github.com/ujjwalgupta107-sudo/Lifnex)  
**Approved Staging Supabase Project Ref:** `jejnuespiisksqfgqwsg`  
**Engineer:** Principal Software Architect & DevOps Specialist  
**Date:** November 26, 2026

---

## 1. Executive Summary

A comprehensive, end-to-end investigation and remediation of the Lifnex production deployment and authentication system on Vercel was conducted. All underlying root causes behind the deployment warnings, serverless function routing discrepancies, and the production login issue ("Invalid email or password.") have been diagnosed, repaired, and validated across local, staging, and deployed environments.

- **Warning Resolved:** Eliminating the critical Vercel build warning `"The api/ directory will not be built because services are configured"` by migrating `vercel.json` from the experimental multi-service schema to the standard Vercel v2 Serverless Function architecture.
- **Root Routing & Assets Restored:** Configured `"outputDirectory": "frontend/dist"` and fine-grained clean rewrite rules in `vercel.json` to eliminate both `dist` directory deployment failures and 404 router desynchronizations.
- **Demo & Production Authentication Restored:** All 4 demo identities (`patient@lifnex.org`, `donor@lifnex.org`, `hospital@lifnex.org`, `admin@lifnex.org`) were audited in Supabase Auth project `jejnuespiisksqfgqwsg`. Their passwords were synchronized with the exact credentials loaded by the frontend UI, confirmed in Supabase Auth, and verified via live GoTrue authentication round-trips.
- **Dynamic Origin Support:** Replaced hardcoded `http://localhost:5173/verify-otp` and `http://localhost:5173/reset-password` redirects in `backend/app/routes/auth.py` with dynamic origin resolution (`_get_site_url`) supporting production (`https://lifnex.vercel.app`), custom domains, and local dev environments.
- **Test Suite Status:** **97/97 tests passing** in `pytest backend/tests` (including live Supabase staging integration tests and Vercel entrypoint routing tests).
- **Client Build Status:** Vite client bundle generated cleanly in `1.02s` producing all 17 pre-rendered static HTML shells and Rollup asset bundles.
- **Source Control Status:** All fixes committed and pushed to both `main` and `staging` branches on `origin` (`0a8de80`).

---

## 2. Root Cause Analysis

### A. Vercel Build Warning & Serverless Execution Architecture
- **Symptom:** During deployment, Vercel issued:
  ```
  WARNING! The `api/` directory will not be built because services are configured. To serve these files, declare them as a service in your `vercel.json`.
  ```
- **Underlying Mechanism:** Vercel treats the presence of a top-level `"services"` object in `vercel.json` as an instruction to bypass its built-in Serverless Function compiler (`api/**/*.py`). Because the backend service attempted to define an independent container-style service without proper port binding, requests to `/api/v1/*` were either unserved, failed with internal 500 errors, or returned HTML error pages ("A server error occurred...").
- **Remediation:** Removed the `"services"` block and restored the standard Vercel v2 architecture. In `vercel.json`, explicit rewrites map `/api/(.*)` directly to `/api/index.py`, which instantiates the Flask WSGI `app` via `create_app("production")`.

### B. Python Dependency Management on Vercel
- **Symptom:** Vercel's Python runtime failed with `ModuleNotFoundError: No module named 'flask'`.
- **Underlying Mechanism:** An unconfigured `backend/pyproject.toml` file lacking a `dependencies = [...]` table caused Astral's `uv` package resolver to skip the root `requirements.txt`.
- **Remediation:** Removed the empty `pyproject.toml` and harmonized the root `requirements.txt` as the single authoritative source of truth.

### C. Authentication Failure: "Invalid email or password."
- **Symptom:** Attempting to log into `https://lifnex.vercel.app/login` using the demo buttons resulted in:
  ```json
  { "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password." } }
  ```
- **Underlying Mechanism:**
  1. The Flask backend route `/api/v1/auth/login` uses live Supabase client `anon.auth.sign_in_with_password()`.
  2. The demo accounts (`patient@lifnex.org`, `donor@lifnex.org`, `hospital@lifnex.org`, `admin@lifnex.org`) existed in the staging Supabase Auth instance (`jejnuespiisksqfgqwsg`), but their stored passwords in Supabase Auth did not match the default passwords set in the frontend React component (`Patient@123`, `Donor@123`, `Hospital@123`, `Admin@123`).
  3. Supabase GoTrue rejected the sign-in attempt, triggering Flask to return HTTP 401 with `"Invalid email or password."`.
- **Remediation:** Using the Supabase Admin SDK (`admin.auth.admin.update_user_by_id`), all four accounts had their passwords updated to match the frontend demo defaults, and their `email_confirmed_at` timestamps were verified. Live password authentications against Supabase GoTrue were executed and succeeded for all four accounts.

### D. Hardcoded Localhost Verification Redirects
- **Symptom:** Supabase email signups and OTP resend requests dispatched verification links pointing to `http://localhost:5173/verify-otp`.
- **Underlying Mechanism:** In `backend/app/routes/auth.py`, `"email_redirect_to"` was hardcoded to `http://localhost:5173/verify-otp`.
- **Remediation:** Added `_get_site_url(path)` which dynamically evaluates `request.headers.get("Origin")`, `request.headers.get("Referer")`, and `Config.FRONTEND_URL`, falling back safely to `https://lifnex.vercel.app`.

---

## 3. Configuration & Code Changes

### A. Root `vercel.json`
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.py" },
    { "source": "/assets/(.*)", "destination": "/frontend/dist/assets/$1" },
    { "source": "/static/(.*)", "destination": "/frontend/dist/static/$1" },
    { "source": "/((?!api/|static/|assets/).*\\.(?:html|css|js|png|jpg|jpeg|svg|ico|json|woff|woff2|ttf|map|mp4))", "destination": "/frontend/dist/$1" },
    { "source": "/((?!api/|static/|assets/).*)", "destination": "/frontend/dist/$1.html" },
    { "source": "/", "destination": "/frontend/dist/index.html" }
  ]
}
```

### B. Vercel Serverless Function Entrypoint (`api/index.py`)
```python
import os
import sys

# Ensure project root and backend package are accessible to the Python runtime
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app import create_app

env_name = os.getenv("FLASK_ENV", "production")
app = create_app(env_name)
```

### C. Dynamic Redirects in `backend/app/routes/auth.py`
```python
def _get_site_url(path: str = "") -> str:
    origin = request.headers.get("Origin") or request.headers.get("Referer")
    if origin:
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        base = f"{parsed.scheme}://{parsed.netloc}"
        if base.startswith("http"):
            return f"{base.rstrip('/')}/{path.lstrip('/')}"
    frontend_env = Config.FRONTEND_URL or "https://lifnex.vercel.app"
    return f"{frontend_env.rstrip('/')}/{path.lstrip('/')}"
```

---

## 4. Demo Account Credentials Matrix

All four demo roles have been audited, confirmed, and verified against Supabase Auth (`jejnuespiisksqfgqwsg`):

| Role | Email | Password | Supabase Auth ID | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | `patient@lifnex.org` | `Patient@123` | `e7f5bb65-39c3-41b9-a4b4-872e1d6e0063` | Confirmed & Verified |
| **Donor** | `donor@lifnex.org` | `Donor@123` | `9454d6f3-9f48-4246-aed3-c955b69e0085` | Confirmed & Verified |
| **Hospital** | `hospital@lifnex.org` | `Hospital@123` | `6d4f186b-f33b-4afd-80b0-5cfba8f24474` | Confirmed & Verified |
| **Admin** | `admin@lifnex.org` | `Admin@123` | `5df7ccbf-d933-47b8-a96b-6758715915d5` | Confirmed & Verified |

---

## 5. Verification Test Suite Results

### A. Pytest Test Results
- **Command:** `$env:PYTHONPATH="." ; pytest backend/tests`
- **Result:** **97 passed, 32 warnings in 18.78s**
- **Breakdown:**
  - `backend/tests/test_auth.py`: 12 passed
  - `backend/tests/test_backend.py`: 6 passed
  - `backend/tests/test_email_service.py`: 10 passed
  - `backend/tests/test_frontend_assets.py`: 6 passed
  - `backend/tests/test_live_staging_integration.py`: 5 passed
  - `backend/tests/test_otp_auth.py`: 9 passed
  - `backend/tests/test_phase5_e2e.py`: 10 passed
  - `backend/tests/test_phase6_ai.py`: 10 passed
  - `backend/tests/test_phase7_notifications.py`: 6 passed
  - `backend/tests/test_routes_extended.py`: 13 passed
  - `backend/tests/test_staging_smoke.py`: 8 passed
  - `backend/tests/test_vercel_entrypoint.py`: 2 passed

### B. Vite Production Build
- **Command:** `npm run build`
- **Result:** Built in **1.02s**. Generated 17 pre-rendered static HTML shells and all Rollup chunks in `frontend/dist/`.

---

## 6. Vercel Environment Configuration Checklist

To guarantee continuous operation on Vercel, ensure the following environment variables are present in **Vercel Project Settings > Environment Variables**:

1. `FLASK_ENV` = `production`
2. `SECRET_KEY` = *(Secure random 32+ character string for JWT signing)*
3. `SUPABASE_URL` = `https://jejnuespiisksqfgqwsg.supabase.co`
4. `SUPABASE_PUBLISHABLE_KEY` = *(Standard staging anon public key)*
5. `SUPABASE_SECRET_KEY` = *(Staging service role secret key)*
6. `FRONTEND_URL` = `https://lifnex.vercel.app`
7. `ENABLE_INSECURE_DEMO_TOKENS` = `false`

---

## 7. Git Deployment Summary

- **Commit `0d0a3a7`**: Migrated `vercel.json` from multi-service to standard serverless function architecture, restored `outputDirectory`, fixed WSGI entrypoint routing.
- **Commit `0a8de80`**: Made email redirect URLs dynamic and synchronized demo user credentials in Supabase Auth.
- **Branches Synchronized:** Both `main` and `staging` branches are pushed and up to date on `origin` ([https://github.com/ujjwalgupta107-sudo/Lifnex](https://github.com/ujjwalgupta107-sudo/Lifnex)).
