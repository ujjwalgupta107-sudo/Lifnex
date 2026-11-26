# Vercel Deployment & Cloud Infrastructure Audit: Lifnex

**Audit Date:** November 2026  
**Platform:** Vercel Multi-Service Serverless Architecture  
**Production URL:** `https://lifnex.vercel.app`

---

## 1. Cloud Architecture Overview

Lifnex operates on Vercel as a unified full-stack serverless deployment:
- **Static Assets & SPA Routing:** Vite builds the single-page application into `frontend/dist`. HTML routes and SPA fallback are handled cleanly by Vercel's edge network and the Flask static router.
- **Serverless API Backend:** WSGI entrypoint `api/index.py` boots the Flask application factory (`create_app`) on the Python runtime.
- **Route Rewrites (`vercel.json`):**
  - Routes beginning with `/api/v1/:path*` or `/api/:path*` rewrite directly to the serverless function `api/index.py`.
  - Static requests resolve directly to built client bundles with cache headers.

---

## 2. Environment Configuration & Health Verification

- **Production Health Endpoint:** `GET https://lifnex.vercel.app/api/v1/health`
  - HTTP Status: `200 OK`
  - Database Connection: `connected: true`
  - Staging Project Reference: `jejnuespiisksqfgqwsg`
  - Tables Verified: `users`, `donor_profiles`, `hospitals`, `blood_requests`, `donor_responses`, `notifications`, `audit_logs`, `donation_history`, `verification_records`.
- **Environment Bindings:**
  - `SUPABASE_URL`: Connected
  - `SUPABASE_PUBLISHABLE_KEY`: Configured
  - `SUPABASE_SECRET_KEY`: Configured server-side
  - `DEMO_PASSWORD_PATIENT`, `DEMO_PASSWORD_DONOR`, `DEMO_PASSWORD_HOSPITAL`, `DEMO_PASSWORD_ADMIN`: Active in Vercel Production settings.
