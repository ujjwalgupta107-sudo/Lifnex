# LIFNEX — DATABASE SETUP & MIGRATION GUIDE

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Stage:** Phase 3 — Flask Backend & Supabase PostgreSQL Integration  
**Database Engine:** Supabase PostgreSQL 15 (Project: LifnexDB)  
**Target URL:** `https://ygbprigcrooveopipkcl.supabase.co`  

---

## 1. Overview of the 9 Relational Application Tables

In compliance with 3NF database design and the Phase 1 specifications, the Lifnex database schema consists of nine core application tables:

1. **`public.users`**: Application-level identity linked 1:1 with `auth.users(id)`. Stores full names, contact info, and roles (`patient`, `donor`, `hospital`, `admin`).
2. **`public.donor_profiles`**: Donor clinical data, ABO/Rh blood group, GPS coordinates (`latitude`, `longitude`), dispatch travel radius, and 90-day cooldown state.
3. **`public.hospitals`**: Healthcare centers and accredited blood banks, regulatory medical license numbers, coordinates, emergency desk lines, and cold-chain inventory.
4. **`public.blood_requests`**: Emergency blood requisitions containing blood group, units needed, clinical urgency, target hospital, and status lifecycle.
5. **`public.donor_responses`**: Records of donor responses (`accepted`, `declined`, `en_route`) and estimated arrival times (ETAs).
6. **`public.notifications`**: Real-time and persistent in-app notifications dispatched to users.
7. **`public.donation_history`**: Ledger of completed and hospital-certified blood donations with verification certificate numbers.
8. **`public.verification_records`**: Audit and review logs for hospital licenses and donor medical screenings.
9. **`public.audit_logs`**: Immutable, append-only security audit trail recording system actions, actor UUIDs, IP addresses, and state diffs.

---

## 2. Applying the SQL Migration to Supabase

The complete SQL schema with table definitions, check constraints, foreign keys, performance indexes, and Row Level Security (RLS) policies is located at:
📁 `backend/migrations/001_initial_schema.sql`

### Steps to Apply via Supabase Dashboard:
1. Log in to your Supabase Dashboard: `https://supabase.com/dashboard/project/ygbprigcrooveopipkcl`.
2. Navigate to the **SQL Editor** tab from the left navigation pane.
3. Click **+ New Query**.
4. Open [001_initial_schema.sql](file:///c:/Users/Ujjwal/Desktop/Lifnex/backend/migrations/001_initial_schema.sql) and paste its complete contents into the editor.
5. Click **Run** (or press `Ctrl+Enter`).
6. Confirm that the query succeeds and all 9 tables appear under the **Table Editor**.

---

## 3. Configuring Environment Variables

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Populate the `.env` variables from your Supabase Project Settings:
- `SUPABASE_URL`: `https://ygbprigcrooveopipkcl.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`: Found under **Project Settings -> API -> Project API keys (anon / public)**.
- `SUPABASE_SECRET_KEY`: Found under **Project Settings -> API -> Project API keys (service_role / secret)**.

> [!CAUTION]
> The `SUPABASE_SECRET_KEY` must **never** be exposed in frontend JavaScript or committed to GitHub. It is read strictly by the Python Flask backend service layer.

---

## 4. Verifying Backend Connection

Once your `.env` is configured, verify the connection by running:

```bash
python run.py
```

Visit the health diagnostic endpoint at `http://127.0.0.1:5000/api/v1/health`. It will report the live connection status with your Supabase database.

