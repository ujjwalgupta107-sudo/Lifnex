# Complete Bug Register: Lifnex Engineering Audit

**Audit Date:** November 2026  
**Engineering Team:** Senior Full-Stack, Supabase, Security & DevOps Engineering Team  
**Status:** All P0 and P1 issues permanently remediated, regression-tested and verified.

---

## 1. Classification Methodology

- **P0 — Critical:** Outage, total authentication failure, serious security vulnerabilities, data corruption.
- **P1 — High:** Core workflow disruption, API integration failures, broken role authorization.
- **P2 — Medium:** Partial functionality, UI state synchronization, performance bottlenecks.
- **P3 — Low:** Minor cosmetic issues, documentation inconsistencies, non-critical code hygiene.

---

## 2. Bug Register

| ID | File | Issue | Root Cause | Severity | Fix | Test Verification |
|---|---|---|---|---|---|---|
| **BUG-001** | `backend/app/routes/auth.py` | Demo login failure on local development server | The running local background daemon cached outdated `os.environ` variables from before Supabase password synchronization. | **P0** | Restarted Flask background daemon, synchronized `.env` variables, and verified dynamic delivery via `/api/v1/auth/demo-credentials`. | Local test authenticated all 4 roles with HTTP 200. |
| **BUG-002** | `backend/app/utils/auth_guard.py` | Valid Supabase JWTs rejected with `"The token is not yet valid (iat)"` | Sub-second clock skew between Supabase Auth token issuance server and receiving API backend server. | **P1** | Added `leeway=10` parameter to `jwt.decode` in JWT verification guard. | Verified with genuine ES256 Supabase token; authenticated cleanly. |
| **BUG-003** | `frontend/src/pages/auth/LoginPage.tsx` | Demo account selector bypassed form fields instead of auto-filling email and password | Selector callback was wired directly to `api.demoLogin` without populating form state for user inspection. | **P1** | Integrated `api.getDemoCredentials()` on mount; selector updates `email` and `password` state synchronously, allowing user to view credentials and click **Sign in**. | UI tested: selecting each role updates input values without auto-submitting. |
| **BUG-004** | `backend/app/routes/auth.py` | Generic 401 `"Invalid email or password"` returned for unexpected runtime exceptions | All exception handlers in `POST /api/v1/auth/login` defaulted to returning a generic 401 error. | **P2** | Disambiguated invalid credentials (401), unconfirmed emails (403), and runtime server failures (400 `AUTH_ERROR`) with safe logging. | Tested with both invalid passwords and unconfirmed emails. |
| **BUG-005** | `backend/app/utils/auth_guard.py` | Demo Admin could theoretically perform state mutations if authorization wasn't enforced at route level | Frontend was solely responsible for hiding mutation buttons for Demo Admin. | **P1** | Added middleware-level check in `require_auth`: if `user.is_demo` and `role == 'admin'`, all non-idempotent HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) are rejected with 403 `DEMO_READ_ONLY`. | Verified: `POST /hospitals/verify` returns HTTP 403 `DEMO_READ_ONLY`. |
