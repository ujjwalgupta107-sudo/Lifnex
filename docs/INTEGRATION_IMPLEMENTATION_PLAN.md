# LIFNEX — INTEGRATION & PRODUCTION IMPLEMENTATION PLAN
**Document ID:** LFX-IMP-PLAN-2026-V1  
**Classification:** DevOps & Engineering Execution Plan  
**Date:** November 2026  
**Auditor:** Principal Software Architect & DevOps Lead  

---

## 1. Phased Priority Roadmap

```
+-------------------------------------------------------------------------+
| [P0] Critical Security & Configuration Hardening                       |
|   - Ensure .env and service-role keys remain excluded from Git          |
|   - Synchronize root .env and backend/.env                              |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| [P1] Supabase Production Schema & Connectivity                          |
|   - Run 001_initial_schema.sql in Supabase SQL editor                   |
|   - Run 002_security_hardening.sql to enable 45 RLS policies           |
|   - Test live round-trip via check_database_connection()                |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| [P2] Authentication & Role Enforcement                                  |
|   - Configure Supabase Auth SMTP provider for production OTP delivery   |
|   - Verify JWT issuance and RS256 token verification via JWKS           |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| [P3] Core Emergency Requisition Workflows                               |
|   - Switch blood_requests endpoints from demo fallback to live tables   |
|   - Verify donor response tracking and hospital intake handshakes       |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| [P4] Realtime Push Gateway & AI Telemetry                               |
|   - Enable Supabase Realtime channel for instant audio chime dispatch   |
|   - Verify Gemini 1.5 Pro medical triage summarization                  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| [P5] Mobile APK Compilation & Azure Target Replication                  |
|   - Run `eas build -p android --profile preview` to output APK binary   |
|   - Prepare Azure Database for PostgreSQL Flexible Server replication   |
+-------------------------------------------------------------------------+
```

---

## 2. Safety Guidelines for Database Migration

1. **Zero Destructive Actions:** Never run `DROP TABLE CASCADE` or `TRUNCATE` in the production Supabase database.
2. **Sequential Execution:** Run `001_initial_schema.sql` completely before applying `002_security_hardening.sql`.
3. **Transaction Isolation:** Run scripts in individual transaction blocks to allow atomic rollbacks in case of syntax or constraint collisions.

---
*Approved by Lifnex Engineering Review Board.*
