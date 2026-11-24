# LIFNEX — LOCAL DEVELOPMENT SETUP & RUN GUIDE

**Platform:** Lifnex Emergency Blood Donor Coordination Platform  
**Target Environment:** Localhost (Vite 5173 + Flask 5000) + Supabase Staging (`jejnuespiisksqfgqwsg`)  

---

## 1. Prerequisites

- Python 3.11+
- Node.js 18+ (npm)
- Supabase Staging account configured in `.env`

---

## 2. Environment Configuration

Ensure the authoritative root `.env` exists in the repository root:

```env
SUPABASE_URL=https://jejnuespiisksqfgqwsg.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_anon_key_here
SUPABASE_SECRET_KEY=sb_secret_service_role_key_here
SUPABASE_JWKS_URL=https://jejnuespiisksqfgqwsg.supabase.co/auth/v1/.well-known/jwks.json

SECRET_KEY=lifnex-dev-secret-key-2026
FLASK_ENV=development
FLASK_DEBUG=1
PORT=5000
CORS_ORIGINS=*
```

---

## 3. Starting the Servers

### Terminal 1: Backend REST API (Flask)
```powershell
$env:PYTHONPATH="."
.\venv\Scripts\python run.py
```
- Endpoint: `http://127.0.0.1:5000`
- Health check: `http://127.0.0.1:5000/api/v1/health`

### Terminal 2: Frontend Web Server (Vite)
```powershell
npm run dev
```
- Endpoint: `http://localhost:5173`

---

## 4. Running Automated Tests

```powershell
$env:PYTHONPATH="."
pytest backend/tests/ -v
```
All 86 tests should pass cleanly in ~15-20 seconds.
