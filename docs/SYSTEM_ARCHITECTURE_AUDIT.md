# LIFNEX — SYSTEM ARCHITECTURE AUDIT REPORT
**Document ID:** LFX-ARCH-AUD-2026-V1  
**Classification:** Senior Systems Architecture & Production Audit  
**Date:** November 2026  
**Auditors:** Solution Architect, Application Security Engineer, Systems Engineer  

---

## 1. Executive Architecture Summary

LIFNEX is an AI-assisted emergency blood donor coordination and hospital triage dispatch network. It is built to bridge operational latencies between patients, voluntary donors, accredited healthcare institutions, and administrative monitors.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  [ Web Browser: React 18 / Vite 8 ]              [ Mobile App: Expo SDK 51 APK ] |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS / REST JSON (JWT Bearer Token)
                                         v
+-----------------------------------------------------------------------------------+
|                          GATEWAY & MIDDLEWARE LAYER                               |
|                     Flask 3.1.0 (Port 5000 / Gunicorn WSGI)                       |
|  - CORS Handler (Allowed Origins)                                                 |
|  - Auth Guard (`require_auth`, `require_roles`, JWT verification)                 |
|  - Rate Limiter & Audit Logger (SHA-256 Ledger)                                   |
+-----------------------------------------------------------------------------------+
       |                        |                       |                    |
       v                        v                       v                    v
+--------------+       +------------------+   +-------------------+  +--------------+
| Auth Service |       | Matching Service |   | AI Service (LLM)  |  | Notification |
| - Supabase   |       | - Haversine      |   | - Gemini 1.5 Pro  |  | Service      |
|   Auth API   |       |   Formula        |   | - PII Redaction   |  | - Table-log  |
| - 6-Digit    |       | - ABO/Rh Matrix  |   | - Prompt Defense  |  | - In-transit |
|   OTP Engine |       | - Travel Radius  |   | - NBTC Disclaimer |  |   pings      |
+--------------+       +------------------+   +-------------------+  +--------------+
       \                        |                       /                    /
        +-----------------------+----------------------+--------------------+
                                |
                                | Supabase Python SDK (Service-Role Client)
                                v
+-----------------------------------------------------------------------------------+
|                           PERSISTENCE LAYER (Supabase)                            |
|             PostgreSQL 15.x Relational Engine (PostgREST Endpoint)                |
|  - 9 Relational Entities (3NF, Foreign Keys, Check Constraints, B-Tree Indexes)    |
|  - Row-Level Security (RLS) Active Policies Enforced                              |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Inspection & Data Flow Audit

### 2.1 Frontend to Backend Communication
1. **Direct Backend Delegation:** The frontend never connects directly to Supabase PostgreSQL or executes client-side service-role requests.
2. **Unified API Gateway:** All data requests pass through `/api/v1/` endpoints on Flask (port 5000).
3. **Session State:** Tokens are stored in browser `localStorage` under `lifnex_token` and `lifnex_user`, and transmitted via `Authorization: Bearer <token>` HTTP headers.

### 2.2 Identified Architecture Strengths
- **Strict Separation of Concerns:** Database service role key is isolated to backend Python code.
- **Fail-Safe Offline Mode:** Endpoints implement resilient demo fallbacks when cloud database connectivity is disrupted.
- **Pydantic Validation:** All incoming mutation payloads undergo strict type, length, and range checks before reaching SQL execution.

### 2.3 Identified Architecture Gaps & Recommended Fixes
- **Dual Config Files:** `backend/app/config.py` and `backend/app/core/config.py` co-exist. `backend/app/core/config.py` is the primary configuration file loaded by the application factory.
- **WebSocket Gateway:** Notifications currently operate via database records and frontend polling. Realtime push via WebSocket or Supabase Realtime channel should be enabled for production scale.

---
*Certified by Lifnex Architecture Committee.*
