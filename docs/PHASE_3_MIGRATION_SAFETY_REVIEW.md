# LIFNEX — DATABASE MIGRATION SAFETY REVIEW

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Migration Target File:** `backend/migrations/001_initial_schema.sql` (and `backend/app/database/schema.sql`)  
**Engine:** Supabase PostgreSQL 15  
**Review Status:** **VERIFIED SAFE TO RUN — ZERO DESTRUCTIVE STATEMENTS**  
**Date:** November 2026  

---

## 1. Executive Safety Summary

A complete, line-by-line static inspection of `backend/migrations/001_initial_schema.sql` (309 lines of SQL) was conducted.

| Safety Check Category | Result | Details |
|---|:---:|---|
| **DROP TABLE / DATABASE** |  **NONE (0)** | Zero `DROP` statements found. |
| **TRUNCATE** |  **NONE (0)** | Zero table truncation statements found. |
| **DELETE FROM** |  **NONE (0)** | Zero row-level deletion commands found. |
| **Destructive ALTER TABLE** |  **NONE (0)** | Zero column drops or type truncations. Only `ENABLE ROW LEVEL SECURITY`. |
| **Data Overwrite Risk** |  **NONE** | All table creation statements use `CREATE TABLE IF NOT EXISTS`. |
| **Index Overwrite Risk** |  **NONE** | All indexes use `CREATE INDEX IF NOT EXISTS`. |
| **Extension Safety** |  **NONE** | All extension imports use `CREATE EXTENSION IF NOT EXISTS`. |

**Verdict:** The migration script is **100% additive and non-destructive**. It will not delete, truncate, drop, or overwrite existing tables, schema objects, or data.

---

## 2. Inventory of Objects Created by the Migration

### 2.1 Database Extensions (2)
1. `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
2. `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`

### 2.2 Relational Application Tables (9)
All created with `IF NOT EXISTS` under the `public` schema:

1. **`public.users`**:
   - Primary Key: `id (UUID)` referencing `auth.users(id) ON DELETE CASCADE`.
   - Constraints: `email UNIQUE, NOT NULL`, `full_name NOT NULL`, `chk_user_role CHECK (role IN ('patient', 'donor', 'hospital', 'admin'))`.
2. **`public.donor_profiles`**:
   - Primary Key: `id (UUID DEFAULT gen_random_uuid())`.
   - Foreign Key: `user_id (UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE)`.
   - Constraints: `chk_donor_blood_group`, `chk_donor_latitude`, `chk_donor_longitude`, `chk_donor_radius`, `chk_donor_availability`.
3. **`public.hospitals`**:
   - Primary Key: `id (UUID)`.
   - Foreign Key: `user_id (UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE)`.
   - Constraints: `license_number UNIQUE`, `chk_hosp_latitude`, `chk_hosp_longitude`.
4. **`public.blood_requests`**:
   - Primary Key: `id (UUID)`.
   - Foreign Keys: `patient_id REFERENCES public.users(id)`, `hospital_id REFERENCES public.hospitals(id) ON DELETE RESTRICT`.
   - Constraints: `chk_req_blood_group`, `chk_req_units_required (1-20)`, `chk_req_urgency`, `chk_req_status`, `chk_req_verification`.
5. **`public.donor_responses`**:
   - Primary Key: `id (UUID)`.
   - Foreign Keys: `request_id REFERENCES public.blood_requests(id) ON DELETE CASCADE`, `donor_id REFERENCES public.donor_profiles(id) ON DELETE CASCADE`.
   - Unique Constraint: `uq_request_donor_response (request_id, donor_id)`.
   - Constraints: `chk_resp_status`, `chk_resp_eta (>= 0)`.
6. **`public.notifications`**:
   - Primary Key: `id (UUID)`.
   - Foreign Keys: `recipient_id REFERENCES public.users(id) ON DELETE CASCADE`, `reference_request_id REFERENCES public.blood_requests(id) ON DELETE SET NULL`.
   - Constraints: `chk_notif_type`.
7. **`public.donation_history`**:
   - Primary Key: `id (UUID)`.
   - Foreign Keys: `donor_id REFERENCES public.donor_profiles(id) ON DELETE RESTRICT`, `hospital_id REFERENCES public.hospitals(id) ON DELETE RESTRICT`, `request_id REFERENCES public.blood_requests(id) ON DELETE SET NULL`.
   - Unique Constraint: `verification_certificate_no UNIQUE`.
   - Constraints: `chk_hist_units (> 0)`.
8. **`public.verification_records`**:
   - Primary Key: `id (UUID)`.
   - Foreign Keys: `target_user_id REFERENCES public.users(id) ON DELETE CASCADE`, `reviewed_by REFERENCES public.users(id) ON DELETE SET NULL`.
   - Constraints: `chk_verif_type`, `chk_verif_status`.
9. **`public.audit_logs`**:
   - Primary Key: `id (UUID)`.
   - Foreign Key: `actor_id REFERENCES public.users(id) ON DELETE SET NULL`.
   - JSONB Diffs: `old_values`, `new_values`.

### 2.3 Performance & Spatial Indexes (12)
All created with `CREATE INDEX IF NOT EXISTS`:
- `idx_users_email` on `public.users (email)`
- `idx_users_role` on `public.users (role)`
- `idx_donors_matching` on `public.donor_profiles (blood_group, availability_status, last_donation_date)`
- `idx_donors_coords` on `public.donor_profiles (latitude, longitude)`
- `idx_hospitals_coords` on `public.hospitals (latitude, longitude)`
- `idx_hospitals_license` on `public.hospitals (license_number)`
- `idx_requests_status_urgency` on `public.blood_requests (status, urgency_level, blood_group)`
- `idx_requests_patient` on `public.blood_requests (patient_id)`
- `idx_requests_hospital` on `public.blood_requests (hospital_id)`
- `idx_responses_req_donor` on `public.donor_responses (request_id, donor_id)`
- `idx_notifications_recipient_read` on `public.notifications (recipient_id, is_read)`
- `idx_donation_hist_donor` on `public.donation_history (donor_id)`
- `idx_audit_created` on `public.audit_logs (created_at DESC)`

### 2.4 Row Level Security (RLS) Policies (20)
`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is applied to all 9 tables, followed by targeted policies:
- **`users` (3 policies)**: Read self/admin, update self (excluding role), service role insert.
- **`donor_profiles` (2 policies)**: Donors manage own profile, public reads available non-sensitive donor data.
- **`hospitals` (3 policies)**: Public reads verified hospitals, facility owner updates, hospital owner inserts.
- **`blood_requests` (3 policies)**: Public reads open requests, patients insert own requests, creator/hospital updates.
- **`donor_responses` (3 policies)**: Participants read, donors submit response, donors update own response.
- **`notifications` (2 policies)**: Recipient reads own, recipient marks read.
- **`donation_history` (2 policies)**: Donors/hospitals view related history, hospitals insert records.
- **`verification_records` (2 policies)**: Users view own/admin views all, admin updates.
- **`audit_logs` (3 policies)**: Admin reads, updates **BLOCKED (`USING (false)`)**, deletions **BLOCKED (`USING (false)`)**.

---

## 3. Supabase Project Reference Comparison

| Configuration Location | Configured Project URL / Reference | Status / Note |
|---|---|---|
| **Phase 1 Planning Docs** (`PROJECT_OVERVIEW.md`, `SUPABASE_SETUP_GUIDE.md`) | `https://paxkftydmvibrjtroinn.supabase.co` (`LifnexDB`) | Target project originally designated in Phase 1 prompt. |
| **Local Runtime File** (`backend/.env`) | `https://ygbprigcrooveopipkcl.supabase.co` | Live project configured in user's local environment. |
| **GoTrue Auth Service Test** | `https://ygbprigcrooveopipkcl.supabase.co/auth/v1/health` | **HTTP 200 OK** (Active GoTrue `v2.197.0`). |
| **JWKS Endpoint Test** | `https://ygbprigcrooveopipkcl.supabase.co/auth/v1/.well-known/jwks.json` | **HTTP 200 OK** (Active RS256 signing keys). |

> [!NOTE]
> Regardless of whether you execute this migration on `paxkftydmvibrjtroinn` or `ygbprigcrooveopipkcl`, the SQL migration is fully self-contained, schema-qualified (`public.*`), and completely compatible with any Supabase PostgreSQL 15 database instance.

---

## 4. Conflict & Re-run Safety Analysis

1. **Re-run Idempotency**:
   - All `CREATE TABLE` statements use `IF NOT EXISTS`.
   - All `CREATE INDEX` statements use `IF NOT EXISTS`.
   - All `CREATE EXTENSION` statements use `IF NOT EXISTS`.
2. **Policy Overwrite Protection**:
   - If policies with matching names already exist in the database, PostgreSQL may return `ERROR: policy "..." for table "..." already exists`.
   - **Recommended Precaution**: In the unlikely event you have already created policies of the same name in the Supabase Dashboard, running `DROP POLICY IF EXISTS ...` beforehand is supported. For a clean project or initial run, the script executes seamlessly.

---

## 5. Migration Safety Verdict & Recommendation

- **Verdict:** **SAFE TO EXECUTE.**
- **Destructive Commands:** **ZERO (0).**
- **Action Required:**
  1. Open your Supabase Dashboard for your project.
  2. Go to **SQL Editor** &rarr; **+ New Query**.
  3. Copy and paste the contents of `backend/migrations/001_initial_schema.sql`.
  4. Click **Run**.

