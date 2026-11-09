# LIFNEX — AUTHENTICATION SETUP & INTEGRATION GUIDE

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Stage:** Phase 4 — Supabase Authentication & Role Management  
**Authentication Engine:** Supabase Auth (GoTrue) + Python Flask REST API  

---

## 1. Authentication Architecture Overview

Lifnex leverages **Supabase Auth** as the cryptographic identity provider:
1. **Credentials Management**: Email and password hashes are managed within the isolated `auth.users` schema. Lifnex never stores, transmits, or handles plaintext user passwords.
2. **Profile Synchronization**: The backend links each Supabase `auth.users(id)` UUID directly to `public.users(id)`, creating a 1:1 mapped application identity.
3. **JWT Session Tokens**: Upon authentication, Supabase returns a cryptographically signed JWT. The client transmits this token in the `Authorization: Bearer <token>` HTTP header.
4. **Backend Verification Middleware**: The Flask backend uses `backend/app/utils/auth_guard.py` (`@require_auth`, `@require_roles`) to validate signature, expiration, and audience claims before executing any protected business logic.

---

## 2. API Endpoints Reference

### 1. `POST /api/v1/auth/register`
- **Purpose**: Registers a new Patient or Voluntary Donor.
- **Rules**: Allows `role: 'patient'` or `role: 'donor'`. Forbids `hospital` or `admin`.
- **Payload**:
  ```json
  {
    "email": "sarah.jenkins@example.com",
    "password": "SecurePassword123!",
    "full_name": "Sarah Jenkins",
    "role": "patient",
    "phone_number": "+15551234567",
    "city": "Metropolis"
  }
  ```

### 2. `POST /api/v1/auth/login`
- **Purpose**: Authenticates credentials and returns a session access token.
- **Payload**:
  ```json
  {
    "email": "alex.donor@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid-here",
        "email": "alex.donor@example.com",
        "full_name": "Alex Rivera",
        "role": "donor"
      },
      "session": {
        "access_token": "eyJhbGciOi...",
        "token_type": "bearer",
        "expires_in": 3600
      }
    }
  }
  ```

### 3. `POST /api/v1/auth/logout`
- **Purpose**: Terminates user session and invalidates active token.
- **Auth Required**: `Bearer <token>`.

### 4. `POST /api/v1/auth/forgot-password`
- **Purpose**: Dispatches password recovery instructions to registered email.
- **Payload**: `{"email": "user@example.com"}`.

### 5. `POST /api/v1/auth/reset-password`
- **Purpose**: Updates user password using access/recovery token.
- **Payload**: `{"access_token": "token", "new_password": "NewSecurePassword123!"}`.

### 6. `GET /api/v1/auth/me`
- **Purpose**: Retrieves full authenticated profile, active role, and associated donor/hospital records.
- **Auth Required**: `Bearer <token>`.

---

## 3. Frontend Integration Architecture

- **Session Handling**: Handled via `frontend/static/js/auth.js` (`LifnexAuth`).
- **Storage Strategy**: Tokens are kept in `sessionStorage` or `localStorage` (when *Remember Me* is selected).
- **Zero Secret Exposure**: The frontend possesses **zero access** to `SUPABASE_SECRET_KEY`.
- **Automatic Logout**: All dashboard sidebars feature a one-click **Sign Out** button that clears local session state and redirects to `login.html`.

