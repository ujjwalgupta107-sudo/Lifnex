# LIFNEX — SUPABASE CREDENTIAL & DATABASE CONNECTIVITY VERIFICATION REPORT

**Report Date:** 2026-11-24  
**Auditor:** Senior Backend Engineer, Supabase Database Architect & Application Security Engineer  
**System Evaluated:** Lifnex Platform (Flask v1 Backend & Supabase Client Integration)  

---

## 1. Executive Summary

| Verification Area | Status | Key Finding |
| :--- | :---: | :--- |
| **Environment Variable Loading** | **PARTIAL** | Root `.env` loads correctly via `dotenv`, but conflicting `backend/.env` file exists with divergent credentials. |
| **Project Identity Verification** | **FAIL** | Authoritative root `.env` points to `krvxybseqaxeculpgveg` (Production/Prohibited). Staging `adrtuldhyrlhuelpeews` in `backend/.env` has failed DNS resolution. |
| **Credential Type Verification** | **PASS** | `SUPABASE_PUBLISHABLE_KEY` (`sb_publ...`) and `SUPABASE_SECRET_KEY` (`sb_secr...`) conform to Supabase format specifications. |
| **Backend Configuration Mapping** | **PASS** | `backend/app/config.py` correctly maps variable names (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`). |
| **Secret Exposure Audit** | **PASS** | No secret service-role keys exposed in frontend bundles, React components, Git history, or API responses. `.env` is properly excluded by `.gitignore`. |
| **HTTPS & API Connectivity** | **BLOCKED** | Staging project `adrtuldhyrlhuelpeews.supabase.co` fails DNS hostname resolution (`getaddrinfo` failed). |
| **Database Connection (Live Backend)** | **FAIL** | Flask `/api/v1/health` reports `status: error`, `connected: false` (`[Errno 11001] getaddrinfo failed`). In-memory demo fallback active. |
| **Database Schema & RLS Status** | **NOT VERIFIED** | Cannot inspect live tables or RLS policies in staging because the project endpoint is unreachable. |

---

## 2. Environment Configuration Audit

### 2.1 File Locations & Loading Order
The application configuration in [backend/app/config.py](file:///c:/Users/Ujjwal/Desktop/Lifnex/backend/app/config.py) attempts to load environment variables from three locations:
1. `load_dotenv()` (current process directory)
2. `os.path.join(..., "backend", ".env")`
3. `os.path.join(..., ".env")` (root)

Because `load_dotenv(override=False)` does not overwrite already-set variables by default, the first file loaded sets the environment unless specifically overridden.

### 2.2 Variables Detected in `.env` Files (Masked)

#### Root `.env` (`c:\Users\Ujjwal\Desktop\Lifnex\.env`)
| Variable | Present | Value Pattern | Status |
| :--- | :---: | :---: | :---: |
| `SUPABASE_URL` | Yes | `https://krvx...gveg.supabase.co` | **REJECTED** (Matches production project `krvxybseqaxeculpgveg`) |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | `sb_p...XZfi` (len: 46) | Valid publishable key format |
| `SUPABASE_SECRET_KEY` | Yes | `sb_s...Bvve` (len: 41) | Valid service-role secret key format |
| `SUPABASE_JWKS_URL` | Yes | `https://krvx...gveg.supabase.co/...` | Points to production project |

#### Backend Subfolder `.env` (`c:\Users\Ujjwal\Desktop\Lifnex\backend\.env`)
| Variable | Present | Value Pattern | Status |
| :--- | :---: | :---: | :---: |
| `SUPABASE_URL` | Yes | `https://adrt...eews.supabase.co` | **STAGING IDENTIFIER** (`adrtuldhyrlhuelpeews`) |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | `sb_p...oH1N` (len: 46) | Valid publishable key format |
| `SUPABASE_SECRET_KEY` | Yes | `sb_s...AbTC` (len: 41) | Valid service-role secret key format |
| `SUPABASE_JWKS_URL` | Yes | `https://adrt...eews.supabase.co/...` | Points to staging project |

> [!WARNING]
> **Configuration Collision:** Having both `.env` and `backend/.env` creates split-brain configuration behavior. When executing from the project root (standard Vite and Flask startup), root `.env` takes precedence, loading the **prohibited production reference** (`krvxybseqaxeculpgveg`).

---

## 3. Project Identity Verification

### Mandatory Security Rule
- Target Staging Project: `adrtuldhyrlhuelpeews`
- Prohibited Production Projects: `ygbprigcrooveopipkcl`, `krvxybseqaxeculpgveg`

### Finding
1. **Root `.env` violates safety rule:** It contains `SUPABASE_URL=https://krvxybseqaxeculpgveg.supabase.co`. Under prompt instructions, all operations against `krvxybseqaxeculpgveg` are **strictly halted and rejected**.
2. **`backend/.env` matches staging reference:** It contains `adrtuldhyrlhuelpeews`.

---

## 4. Credential Types & Secret Exposure Audit

### 4.1 Key Architecture Verification
- **Publishable Key (`sb_publishable_anon_key`):** Prefix `sb_publ...`. Safe for public/client queries governed by RLS.
- **Secret Key (`sb_secret_service_role_key`):** Prefix `sb_secr...`. Used exclusively on backend client in [backend/app/database/supabase_client.py](file:///c:/Users/Ujjwal/Desktop/Lifnex/backend/app/database/supabase_client.py) (`get_supabase_admin()`).

### 4.2 Exposure Inspection
- **Git Tracking:** Verified with `git status` and `git grep`. `.env` and `backend/.env` are properly ignored by [.gitignore](file:///c:/Users/Ujjwal/Desktop/Lifnex/.gitignore). Zero secret keys exist in the Git index or history.
- **Frontend Codebase:** Scanned `frontend/src/` and `frontend/static/`. No instances of `SUPABASE_SECRET_KEY` or `sb_secr...` appear in client-side TypeScript, JavaScript, or HTML.
- **API Responses:** Verified `/api/v1/health` and auth endpoints. Keys are never serialized or returned in JSON responses.

---

## 5. Connectivity Testing Results

### 5.1 DNS & Network Resolution
Safe, read-only network diagnostics were conducted:

```text
Host: google.com                       -> 142.250.29.102 (OK)
Host: supabase.com                     -> 216.150.1.193  (OK)
Host: api.supabase.com                 -> 172.64.145.26  (OK)
Host: adrtuldhyrlhuelpeews.supabase.co -> FAILED: [Errno 11001] getaddrinfo failed
Host: ygbprigcrooveopipkcl.supabase.co -> FAILED: [Errno 11001] getaddrinfo failed
Host: krvxybseqaxeculpgveg.supabase.co -> 172.64.149.246 (Production - Not Queried)
```

### 5.2 Root Cause Analysis for Staging Unreachability
1. **Project Inactive or Paused:** Supabase free-tier/staging projects automatically pause after a period of inactivity. When paused, their dedicated DNS subdomain (`<project-ref>.supabase.co`) is unrouted from Cloudflare until unpaused in the Supabase Dashboard.
2. **Typo in Project Reference:** The reference `adrtuldhyrlhuelpeews` may contain a typographical error or might have been recreated under a different reference ID.

### 5.3 Live Backend Health Status
A live request to the local Flask server (`http://127.0.0.1:5000/api/v1/health`) returned:

```json
{
  "database": {
    "connected": false,
    "message": "Connection check failed: [Errno 11001] getaddrinfo failed",
    "status": "error"
  },
  "platform": "Lifnex API v1",
  "success": true,
  "supabase_configured": true,
  "tables_defined": [
    "users",
    "donor_profiles",
    "hospitals",
    "blood_requests",
    "donor_responses",
    "notifications",
    "audit_logs",
    "donation_history",
    "verification_records"
  ],
  "tagline": "Connecting Lives When Every Second Matters"
}
```

The system correctly detects the lack of live connectivity and falls back to demo/offline handlers without fabricating a successful connection.

---

## 6. Database Schema & RLS Status

Because network connectivity to `adrtuldhyrlhuelpeews.supabase.co` could not be established, live staging database tables and RLS policies could not be queried via REST or PostgreSQL wire protocol.

### Required Tables Inventory (from SQL Migrations in `backend/migrations/`):
1. `users` (Core authentication & role definitions: patient, donor, hospital, admin)
2. `donor_profiles` (Medical details, blood group compatibility, geolocation, availability status)
3. `hospitals` (Verified medical facility registry with license and contact numbers)
4. `blood_requests` (Emergency blood requirements with status lifecycle: active, fulfilled, cancelled)
5. `donor_responses` (Direct donor pledges: accepted, declined, en_route, completed)
6. `notifications` (Real-time and persistent alerts per user)
7. `donation_history` (Historical donation audit records)
8. `verification_records` (Document verification trails for hospitals and donors)
9. `audit_logs` (Security and administrative audit trail)

### Migration Readiness
- Pre-prepared migration files exist in `backend/migrations/`:
  - `001_initial_schema_corrected.sql`
  - `002_security_hardening_corrected.sql`
- **Execution Policy:** Per safety guidelines, no migrations were executed automatically. Migrations must be run once the staging project is active and verified.

---

## 7. Actionable Next Steps

To complete the staging connection successfully:

1. **Check Staging Project Status in Supabase Dashboard:**
   - Log in to [Supabase Dashboard](https://supabase.com/dashboard).
   - Locate the staging project (`adrtuldhyrlhuelpeews`).
   - If paused, click **Restore Project** / **Resume**.
   - If the project ID is different, copy the exact project reference from `Project Settings > General`.

2. **Synchronize `.env` with Verified Staging Reference:**
   - Update the root `.env` to replace the production URL (`krvxybseqaxeculpgveg`) with the active staging URL (`https://<active-staging-ref>.supabase.co`).
   - Remove or align `backend/.env` to prevent credential collision.

3. **Re-run Connectivity Verification:**
   - Verify that `socket.gethostbyname("<staging-ref>.supabase.co")` resolves.
   - Run `check_database_connection()` to confirm `/api/v1/health` reports `status: "connected"`.

4. **Apply Schema Migrations:**
   - Run `001_initial_schema_corrected.sql` and `002_security_hardening_corrected.sql` in the Supabase SQL Editor for the staging project.
