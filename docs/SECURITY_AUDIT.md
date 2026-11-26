# Application Security & DevSecOps Audit: Lifnex

**Audit Date:** November 2026  
**Auditor:** Senior Application Security & DevSecOps Engineering Team  
**Scope:** Full-stack codebase, Supabase PostgreSQL, Authentication, Vercel Serverless Architecture

---

## 1. Security Architecture Summary

Lifnex implements defense-in-depth across frontend, API gateway, application middleware, and database layers:

1. **Authentication:** Delegated to Supabase Auth. Passwords never touch application databases in plaintext or reversible forms.
2. **Session Verification:** Genuine RS256/ES256 asymmetric JWT verification via Supabase JWKS endpoints (`Config.SUPABASE_JWKS_URL`), with HMAC fallback for internal testing.
3. **Role-Based Access Control (RBAC):** Backend decorators (`@require_auth`, `@require_roles`) enforce role permissions on every protected endpoint.
4. **Demo Isolation & Read-Only Demo Admin:**
   - Synthetic demo accounts marked with `is_demo = True`.
   - Demo Admin sessions are restricted to read-only at the middleware level: any `POST`, `PUT`, `PATCH`, or `DELETE` attempt returns HTTP 403 `DEMO_READ_ONLY`.
5. **Database Security & RLS:** Supabase PostgreSQL enforces Row-Level Security policies ensuring patients, donors, and hospitals only access records within their domain.
6. **Public Email OTP Enforcement:** Built-in OTP validation prevents unverified account activation.

---

## 2. Threat Vector Review

| Area | Threat Analyzed | Mitigation in Place | Severity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Secrets Management** | Accidental exposure of `.env` or service keys | Strict `.gitignore`, pre-commit safety rules, zero keys in frontend bundles. | Critical | **SECURE** |
| **SQL Injection** | Parameter tampering in SQL queries | Supabase PostgREST client parameterization; zero string-concatenated SQL queries in backend routes. | Critical | **SECURE** |
| **Cross-Site Scripting (XSS)** | Injected malicious scripts | React automatic JSX escaping, `X-Content-Type-Options: nosniff`, and secure response headers. | High | **SECURE** |
| **Privilege Escalation** | Demo account elevating permissions to real admin | Backend checks `is_demo` flag in `users` table; mutations rejected for demo admin regardless of token claims. | High | **SECURE** |
| **Brute Force / Rate Limiting** | Automated credential stuffing on `/demo-login` | In-memory sliding window rate-limiting (max 10 requests / 60s per client IP). | Medium | **SECURE** |
| **Data Leakage in Logs** | Plaintext credentials in application logs | Passwords, tokens, and secret keys explicitly excluded from all logging and audit trails. | High | **SECURE** |

---

## 3. Dependency Vulnerability Assessment

- **Python Backend:** `requirements.txt` dependencies audited. No unpinned critical dependencies.
- **Frontend:** Vite and React 18 packages compiled cleanly with 0 type errors.
