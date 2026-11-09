# LIFNEX — DEPLOYMENT READINESS & RUNBOOK
**Platform:** Lifnex — Connecting Lives When Every Second Matters  
**Deployment Target:** Render Web Service (Python 3.11 / Gunicorn)  
**Database:** Supabase PostgreSQL 15 (LifnexDB)  
**Latest Verified Commit:** `aef2dcb`  
**Deployment Status:** Ready for Manual Staging Launch

---

## 1. Cloud Blueprint Verification (`render.yaml`)
- **Web Service:** `lifnex-backend`
- **Environment:** `python`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
- **Health Check Path:** `/api/v1/health`
- **Static Asset Serving:** Built directly into Flask factory in `backend/app/__init__.py`.

---

## 2. Environment Variables Matrix

| Variable | Staging Configuration | Production Target | Secret? |
| :--- | :--- | :--- | :---: |
| `FLASK_ENV` | `production` | `production` | No |
| `FLASK_DEBUG` | `0` | `0` | No |
| `SECRET_KEY` | Render auto-generated | Render auto-generated | Yes |
| `SUPABASE_URL` | `https://<staging-id>.supabase.co` | `https://<prod-id>.supabase.co` | No |
| `SUPABASE_PUBLISHABLE_KEY` | Staging anon key | Production anon key | No |
| `SUPABASE_SECRET_KEY` | Staging service-role key | Production service-role key | **YES** |
| `SUPABASE_JWKS_URL` | Staging JWKS URL | Production JWKS URL | No |
| `GEMINI_API_KEY` | Google Gemini API key | Google Gemini API key | **YES** |
| `CORS_ORIGINS` | `*` or staging frontend domain | production domain | No |

---

## 3. Database Migration Safety & Staging Rehearsal
1. **Migrations:**
   - `001_initial_schema.sql`: 9 core tables, constraints, sequences, foreign keys.
   - `002_security_hardening.sql`: 36 RLS policies, 17 security definer functions, notification locks, coordinate privacy views.
2. **Rehearsal Procedure:**
   - Execute against an isolated Supabase project.
   - Never run unverified migrations against production `ygbprigcrooveopipkcl`.
   - Reconfirm that `EXECUTE` on helper functions is revoked from `PUBLIC`.

---

## 4. Pre-Flight Verification Checklist
- [x] Flask factory entrypoint (`run.py`) boots cleanly.
- [x] Health check endpoint returns HTTP 200 with 9 registered tables.
- [x] Security headers active (`nosniff`, `DENY`, `strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self)`).
- [x] Rate limiting active on AI routes (30 requests/min).
- [x] No API keys or service secrets committed to Git repository.
- [x] All 64 automated regression and smoke tests pass.
- [x] Resilient offline fallback active when database or Gemini is unconfigured.
