# Root Cause Investigation & Permanent Fix Report: Demo Logins

**Document Version:** 1.0  
**Project:** Lifnex  
**Supabase Staging Project:** `jejnuespiisksqfgqwsg`  
**Environments Verified:** Local (`http://localhost:5173`) & Production (`https://lifnex.vercel.app`)

---

## 1. Executive Summary

All four demo accounts (**Patient**, **Donor**, **Hospital**, and **Admin**) authenticate through real Supabase Auth identities (`auth.users`) and have their corresponding role records in `public.users` (`is_demo = True`).

Following commit `1e0782f`, when the four demo passwords in Supabase Auth were synchronized to match the Vercel Production environment variables, the running local Flask backend process retained the previous credentials in its in-memory process environment. Consequently, `GET /api/v1/auth/demo-credentials` served the previous 28-character credentials locally, which Supabase Auth rejected with HTTP 401 (`INVALID_CREDENTIALS`).

Restarting the local Flask process, refreshing environment bindings, and refining backend error categorization resolved the issue across both environments.

---

## 2. Root Cause Breakdown

### A. Process Environment Desynchronization
- Supabase passwords were synchronized with the configured Vercel production credentials.
- The local background Flask daemon had been launched prior to this update. Because Python caches `os.environ` upon startup, `GET /api/v1/auth/demo-credentials` served the previous credentials locally.
- When the user selected a demo button on `localhost:5173` and clicked **Sign in**, the frontend submitted the previous credentials to `POST /api/v1/auth/login`, resulting in Supabase Auth rejecting the sign-in with:
  ```json
  {
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Invalid email or password."
    },
    "success": false
  }
  ```

### B. Vercel Production Environment Status
- On Vercel (`https://lifnex.vercel.app`), serverless functions spin up dynamically with the production environment variables.
- Direct endpoint tests against `https://lifnex.vercel.app/api/v1/auth/login` confirmed that all four accounts authenticated with HTTP 200 and received valid Supabase Auth JWT sessions.

---

## 3. Account & Role Verification Status

| Account | Role | Supabase Auth ID | public.users | Profiles & Flags | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `patient@lifnex.org` | patient | `614d09fb-b48d-4f54-977f-8bdc29f191e4` | Present | `is_demo=True`, `is_active=True` | **ACTIVE / VERIFIED** |
| `donor@lifnex.org` | donor | `c96458da-f0c6-4cbd-be60-1bb24bcff22b` | Present | `donor_profiles` row verified | **ACTIVE / VERIFIED** |
| `hospital@lifnex.org` | hospital | `83d3153e-c9a5-4938-ace4-fa9b2fef6968` | Present | `hospitals` row verified | **ACTIVE / VERIFIED** |
| `admin@lifnex.org` | admin | `913d7489-cd21-4925-872f-eed1076f6e5f` | Present | Read-only demo admin enforced | **ACTIVE / VERIFIED** |

---

## 4. Fix Implemented

1. **Process Restart & Environment Binding:** Restarted the local development server with the updated `.env` configuration.
2. **Dynamic Credential Delivery:** `GET /api/v1/auth/demo-credentials` retrieves the active environment values for the four demo roles and automatically fills the login form.
3. **Refined Error Categorization:** Modified `POST /api/v1/auth/login` in `backend/app/routes/auth.py` to differentiate between invalid credentials (`401 INVALID_CREDENTIALS`), unverified emails (`403 EMAIL_NOT_VERIFIED`), and broader authentication runtime errors (`400 AUTH_ERROR`).
4. **JWT Clock Skew Tolerance:** Maintained `leeway=10` in `backend/app/utils/auth_guard.py` so tokens from Supabase Auth validate cleanly even under slight clock differences.

---

## 5. Test Results

### Local Environment (`http://localhost:5173`)
```
LOCAL POST-RESTART patient 200 True
LOCAL POST-RESTART donor 200 True
LOCAL POST-RESTART hospital 200 True
LOCAL POST-RESTART admin 200 True
```
- All 110 backend test cases passed.
- Frontend TypeScript check (`npx tsc --noEmit`) passed.
- Frontend production bundle build (`npm run build`) passed.

### Production Environment (`https://lifnex.vercel.app`)
```
PROD patient: Auto-filled (patient@lifnex.org) -> Authenticated -> Profile Verified -> Refreshed -> Logged out (SUCCESS)
PROD donor: Auto-filled (donor@lifnex.org) -> Authenticated -> Profile Verified -> Refreshed -> Logged out (SUCCESS)
PROD hospital: Auto-filled (hospital@lifnex.org) -> Authenticated -> Profile Verified -> Refreshed -> Logged out (SUCCESS)
PROD admin: Auto-filled (admin@lifnex.org) -> Authenticated -> Profile Verified -> Refreshed -> Logged out (SUCCESS)
```
