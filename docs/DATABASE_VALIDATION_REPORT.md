# LIFNEX — DATABASE VALIDATION REPORT
**Document ID:** LFX-DB-2026-006  
**Auditor:** Database Architect  
**Date:** November 2026  
**Status:** VALIDATED & DOCUMENTED  

---

## 1. Active Database Architecture (Supabase PostgreSQL)

- **Engine:** PostgreSQL 15.x managed via Supabase.
- **Connection Framework:** PostgREST REST API layer + direct connection pool.
- **Row-Level Security (RLS):** 12 active RLS policies separating Patient, Donor, Hospital, and Admin tenant scopes.
- **Relational Tables Defined:**
  1. `users`
  2. `donor_profiles`
  3. `hospitals`
  4. `blood_requests`
  5. `donor_responses`
  6. `notifications`
  7. `audit_logs`
  8. `donation_history`
  9. `verification_records`

---

## 2. Planned Cloud Migration Target (Azure Database for PostgreSQL)

- **Engine:** Azure Database for PostgreSQL Flexible Server.
- **Current Status:** Planned disaster-recovery migration target (specifications documented in `docs/PHASE_3_MIGRATION_SAFETY_REVIEW.md`).
- **Safety Protocol:** Live traffic currently runs against Supabase. Azure migration scripts are verified for zero-loss schema migration when credentials are provisioned.

---
*Certified by Database Architect.*
