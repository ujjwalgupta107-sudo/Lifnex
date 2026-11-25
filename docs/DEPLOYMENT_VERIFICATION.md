# Lifnex — Deployment Verification

**Production URL:** `https://lifnex.vercel.app`  
**Supabase Project Ref:** `jejnuespiisksqfgqwsg`  
**Verified Deployment Commit:** `36223e4`  
**Branch Synchronization:** `origin/main` and `origin/staging` aligned (`36223e4` prior to this docs commit).

---

## 1. Local Build & Automated Test Verification
- **HTML Shells & Vite Production Build:** `npm run shells && npx tsc --noEmit && npm run build`
  - Result: **Exited 0** (`18` HTML shells generated including `reset-password.html`, `0` TypeScript errors, Vite build completed in `648ms`).
- **Backend Pytest Suite:** `$env:PYTHONPATH="."; pytest backend/tests -v --tb=short`
  - Result: **110 passed, 36 warnings in 20.16s** (covers unit tests, mocked live-mode auth/RBAC/OTP/cooldown/reset-password/JWKS tests, and 5 real staging Supabase read integration tests).
- **Local Playwright Browser Verification (`http://localhost:5173`):**
  - Routes tested: `9` (`/`, `/about`, `/how-it-works`, `/hospitals`, `/contact`, `/login`, `/register`, `/forgot-password`, `/reset-password`)
  - Console errors: `0` | Page errors: `0` | Broken images: `0` | Mobile `375px` horizontal overflows: `0`
  - Unauthenticated `/dashboard/patient` → redirected to `/login`.

---

## 2. Live Vercel Production Verification (`https://lifnex.vercel.app` on `36223e4`)
- **SPA Routes (HTTP `200` on direct request):**
  - `/`, `/about`, `/how-it-works`, `/hospitals`, `/contact`, `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password`, `/dashboard/patient`, `/dashboard/donor`, `/dashboard/hospital`, `/dashboard/admin` → **All 14 returned HTTP `200`**.
- **Production Playwright Check:**
  - `10` routes loaded cleanly with **`0` console errors** and **`0` page errors**.
  - Unauthenticated `https://lifnex.vercel.app/dashboard/admin` redirected cleanly to `https://lifnex.vercel.app/login`.
- **Production API & Security Checks:**
  - `GET /api/v1/health` → **HTTP `200`**, `database.connected: true`, `project_ref: "jejnuespiisksqfgqwsg"`, `using_fallback: false`.
  - `PATCH /api/v1/donors/availability` (unauthenticated) → **HTTP `401 UNAUTHORIZED`**.
  - `GET /api/v1/blood-requests` (unauthenticated) → **HTTP `200`**, `"Sanitized public emergency feed retrieved."`.
  - `POST /api/v1/auth/refresh` (invalid token, tested on `49d8233`) → **HTTP `401 INVALID_REFRESH_TOKEN`**.
  - `POST /api/v1/auth/reset-password` (raw UUID, tested on `49d8233`) → **HTTP `401 INVALID_OR_EXPIRED_TOKEN`**.
  - `GET /api/v1/auth/me` (`Bearer demo-token-admin`, tested on `49d8233`) → **HTTP `401 INVALID_OR_EXPIRED_TOKEN`**.
- **Production Demo Account Login Check (Blocked Pending Account Restoration Approval):**
  - `POST /api/v1/auth/login` for `patient@lifnex.org`, `donor@lifnex.org`, `hospital@lifnex.org`, `admin@lifnex.org` → **HTTP `401 INVALID_CREDENTIALS`** (`auth.users = 0`, `public.users = 0` in `jejnuespiisksqfgqwsg`).

---

## 3. Git LFS & Repository Verification
- `git lfs push --all origin main`: **100% uploaded (`31/31`, `15 MB`)**.
- `git lfs fsck`: **`Git LFS fsck OK`**.
- **Deployment Action Note for LFS Assets on Vercel:** Because Vercel's Git clone does not fetch Git LFS binary objects unless enabled at the project level, enable **Git Large File Storage (LFS)** under **Vercel Project Settings → Git** and trigger a redeploy so LFS-tracked images serve binary payloads instead of `131`-byte pointer stubs.
