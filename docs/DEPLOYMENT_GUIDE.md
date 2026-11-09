# LIFNEX DEPLOYMENT & PRODUCTION RUNBOOK

---

## 1. Architecture Overview
- **Frontend:** Vanilla HTML/CSS/JavaScript (Leaflet + OpenStreetMap + Supabase Realtime). Can be hosted on Netlify, Vercel, Render Static, or Supabase Storage.
- **Backend:** Python Flask running on Gunicorn (`run:app`) deployed as a Web Service on Render.
- **Database & Auth:** Supabase PostgreSQL with 36 Row-Level Security (RLS) policies, JWKS verification, and Realtime replication.
- **AI Engine:** Google Gemini Generative API (`gemini-2.5-flash`) called server-side only with deterministic fallback.

---

## 2. Environment Variables Configuration

Set these in your Render Dashboard (or hosting provider) as Environment Variables:

| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `FLASK_ENV` | Environment mode | `production` |
| `FLASK_DEBUG` | Flask debug mode (must be 0) | `0` |
| `SECRET_KEY` | Flask session secret key | `<64-byte random hexadecimal string>` |
| `SUPABASE_URL` | Supabase API URL | `https://ygbprigcrooveopipkcl.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Anon public API key | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Supabase service-role secret key (Server-only!) | `sb_secret_...` |
| `SUPABASE_JWKS_URL` | JWKS endpoint for token validation | `https://ygbprigcrooveopipkcl.supabase.co/auth/v1/.well-known/jwks.json` |
| `GEMINI_API_KEY` | Google Gemini Generative API Key | `AIzaSy...` |
| `CORS_ORIGINS` | Allowed client origins | `https://your-lifnex-frontend.onrender.com` |

---

## 3. Render Web Service Deployment

### Step 1: Link GitHub Repository
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** &rarr; **Web Service**.
3. Connect your repository: `https://github.com/ujjwalgupta107-sudo/Lifnex`.

### Step 2: Configure Service Settings
- **Name:** `lifnex-backend`
- **Environment:** `Python`
- **Region:** Closest to your users (e.g. Frankfurt, Oregon, Singapore)
- **Branch:** `main`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
- **Health Check Path:** `/api/v1/health`

Alternatively, Render will automatically detect the root [`render.yaml`](file:///c:/Users/Ujjwal/Desktop/Lifnex/render.yaml) blueprint.

---

## 4. Database Migration Instructions
- Canonical schema files:
  1. `backend/migrations/001_initial_schema.sql` (Tables, types, constraints, foreign keys)
  2. `backend/migrations/002_security_hardening.sql` (RLS policies, triggers, privacy views)
- **Execution Rule:**
  - Execute against an isolated Supabase staging instance first.
  - Review all foreign key cascading rules and verify that service-role keys are never checked into git.
  - Test policies against the 6 roles (`anon`, `patient`, `donor`, `hospital`, `admin`, `service_role`).

---

## 5. Security & Pre-flight Checklist
- [x] Flask Debug mode disabled in production (`FLASK_DEBUG=0`).
- [x] Security headers injected (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).
- [x] No API keys or service role secrets in client-side files or Git history.
- [x] Gemini API called server-side with timeout (8s), PII sanitization, and prompt injection defense.
- [x] Rate limiting active (30 req/min on AI routes).
- [x] Leaflet maps blur donor coordinates ($\sim 500\text{m}$) to preserve donor anonymity.
- [x] 56 automated backend and integration tests passing.

---

## 6. Known Limitations
1. **Medical Transfusion Notice:** Compatibility matrix provides logistical routing recommendations only; cross-matching and biological compatibility must always be verified on-site by accredited healthcare professionals.
2. **Geospatial Approximation:** Donor locations are intentionally obfuscated for privacy. Responding donors must accept before hospital dispatch coordinates are shared.
3. **Realtime WebSockets:** Environments with restrictive enterprise firewalls may fall back to standard HTTP polling if WebSockets are blocked.

