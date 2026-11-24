# LIFNEX — SUPABASE INTEGRATION & SETUP MANUAL
**Document ID:** LFX-SUPA-MANUAL-2026-V1  
**Classification:** DevOps & Security Operations Manual  
**Date:** November 2026  
**Auditor:** Senior DevOps & Cloud Infrastructure Lead  

---

## 1. Credentials Inventory & Required Variables

The Lifnex backend (`backend/app/core/config.py`) requires exactly five environment variables:

```env
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-publishable-key>
SUPABASE_SECRET_KEY=<your-service-role-secret-key>
SUPABASE_JWKS_URL=https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json
FLASK_SECRET_KEY=lifnex-super-secret-session-key-dev-only-change-in-prod
```

### Purpose of Each Key
1. **`SUPABASE_URL`**: The REST API and Auth base endpoint for your Supabase project.
2. **`SUPABASE_PUBLISHABLE_KEY`**: The client-side Anonymous key (used for RLS-scoped queries).
3. **`SUPABASE_SECRET_KEY`**: The Service-Role key (bypasses RLS for backend administration, creating users, and confirming OTPs).
4. **`SUPABASE_JWKS_URL`**: Public JSON Web Key Set endpoint used by PyJWT to verify Supabase Auth tokens without sharing symmetric secrets.
5. **`FLASK_SECRET_KEY`**: Cryptographic secret used by Flask to sign session cookies and local JWT tokens.

---

## 2. Exact Credential Locations

1. **Backend Directory:** `backend/`
2. **Local Environment File:** `c:\Users\Ujjwal\Desktop\Lifnex\.env` and `c:\Users\Ujjwal\Desktop\Lifnex\backend\.env`
   *(Both files are synchronized; `python run.py` running from root loads `.env` automatically via `dotenv`).*
3. **Template Reference:** `c:\Users\Ujjwal\Desktop\Lifnex\.env.example`
4. **Files That Must NEVER Contain Secrets:**
   - Any file inside `frontend/`
   - Any HTML, CSS, JavaScript, or TypeScript file
   - Any Markdown documentation file committed to version control
   - Git repository commits (strictly protected by `.gitignore`)

---

## 3. Step-by-Step Supabase Dashboard Setup Instructions

### Step 1: Open Supabase Project
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) in your web browser.
2. Sign in to your Supabase account.
3. Select your **Lifnex** project.

### Step 2: Retrieve API Keys & Project URL
1. In the left navigation menu, click **Project Settings** (gear icon at the bottom).
2. Click **API** under Configuration.
3. Locate **Project URL**:
   - Copy the URL (e.g., `https://abcdefghijklm.supabase.co`).
4. Locate **Project API Keys**:
   - Copy the `anon` / `public` key for `SUPABASE_PUBLISHABLE_KEY`.
   - Reveal and copy the `service_role` / `secret` key for `SUPABASE_SECRET_KEY`.

### Step 3: Construct JWKS URL
The JWKS URL is automatically generated from your Project URL:
```text
https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json
```

### Step 4: Update Your Local `.env` File
1. Open `c:\Users\Ujjwal\Desktop\Lifnex\.env` in your text editor.
2. Paste the copied values:
   ```env
   SUPABASE_URL=https://<your-project-ref>.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   SUPABASE_JWKS_URL=https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json
   SECRET_KEY=lifnex-super-secret-session-key-dev-only-change-in-prod
   ```
3. Save the file. Also copy the exact same contents to `c:\Users\Ujjwal\Desktop\Lifnex\backend\.env`.

### Step 5: Execute Initial Database Migration (In Supabase SQL Editor)
1. In your Supabase dashboard left menu, click **SQL Editor**.
2. Click **New Query**.
3. Open `backend/migrations/001_initial_schema.sql` on your computer.
4. Copy the entire file contents and paste them into the Supabase SQL editor.
5. Click **Run** (Ctrl+Enter).
6. Verify that all 9 tables (`users`, `donor_profiles`, `hospitals`, `blood_requests`, `donor_responses`, `notifications`, `donation_history`, `verification_records`, `audit_logs`) are created.
7. Next, create a second new query, paste `backend/migrations/002_security_hardening.sql`, and click **Run** to enforce Row Level Security.

### Step 6: Test Local Live Connectivity
Run the connectivity check script in your PowerShell terminal:
```powershell
$env:PYTHONPATH="."; .\venv\Scripts\python -c "from backend.app.database.supabase_client import check_database_connection; print(check_database_connection())"
```
**Expected Successful Output:**
```json
{
  "connected": true,
  "message": "Successfully connected to Supabase PostgreSQL (LifnexDB).",
  "status": "connected"
}
```

---
*Certified by DevOps Engineering Team.*
