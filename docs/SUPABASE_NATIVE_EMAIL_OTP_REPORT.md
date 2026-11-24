# LIFNEX — Supabase Native Email OTP Implementation Report
**Document Version:** 1.0.0  
**Date:** November 2026  
**Author:** Senior Software Engineer & Supabase Auth Specialist  
**Application:** Lifnex (AI-Powered Emergency Blood Donor Coordination Platform)  
**Target Environment:** Lifnex-Staging (`jejnuespiisksqfgqwsg`)  
**Tagline:** *Connecting Lives When Every Second Matters.*

---

## 1. Executive Summary

This report documents the implementation and architectural refactoring of the Lifnex authentication system to use **exclusively Supabase Auth's native built-in email delivery** for user registration, 6-digit OTP verification, cooldown-governed resends, and password recovery.

All external SMTP providers (Resend, SendGrid, Amazon SES) and custom server-side OTP generation hashes have been removed from the live authentication path. Supabase Auth acts as the single source of truth for cryptographic token generation, expiration enforcement, and email dispatch.

---

## 2. Architectural Comparison: Legacy vs Supabase Native

| Architectural Area | Previous Implementation | Supabase Native Implementation (Current) |
|---|---|---|
| **OTP Authority** | Flask in-memory cryptographic hash (`_otp_sessions`) | **Supabase Auth (`auth.users.confirmation_token`)** |
| **Email Relay** | Python `smtplib` via external SMTP / Resend | **Supabase Built-in Email Service** |
| **Signup Call** | `admin.auth.admin.generate_link` + local OTP | **`anon.auth.sign_up({ email, password, options })`** |
| **OTP Verification** | Flask hash comparison + admin update | **`anon.auth.verify_otp({ email, token, type: 'signup' })`** |
| **Resend Cooldown** | Flask `time.time()` session lock | **Supabase Auth native rate limit + UI 60s cooldown** |
| **Supported Roles** | Patient & Donor | **Patient, Donor, & Hospital (Admin self-registration blocked)** |

---

## 3. Implemented Native API Flows

### 3.1 User Registration (`POST /api/v1/auth/register`)
- **Validation:** Pydantic `RegisterRequest` validates email RFC standards, minimum 8-character passwords, and role allowlist (`patient`, `donor`, `hospital`).
- **Security Check:** Blocks attempts to self-assign the `admin` role with HTTP 403 `FORBIDDEN`.
- **Supabase Native Dispatch:**
  ```python
  signup_resp = anon.auth.sign_up({
      "email": data.email,
      "password": data.password,
      "options": {
          "data": {
              "full_name": data.full_name,
              "role": data.role,
              "blood_group": data.blood_group
          },
          "email_redirect_to": "http://localhost:5173/verify-otp"
      }
  })
  ```
- **Profile Synchronization:** Automatically creates an inactive (`is_active: False`) user record in `public.users` and initializes `public.donor_profiles` or `public.hospitals` based on role.

### 3.2 OTP Verification (`POST /api/v1/auth/verify-otp`)
- **Direct Supabase Verification:**
  ```python
  verify_resp = anon.auth.verify_otp({
      "email": data.email,
      "token": data.otp,
      "type": "signup"
  })
  ```
- **Activation:** Upon successful token verification, `public.users.is_active` is updated to `True` using the service-role client, and a JWT session token is returned to the client.
- **Error Handling:** Maps Supabase Auth errors to structured error codes (`INVALID_OTP`, `EXPIRED_OTP`, `TOO_MANY_ATTEMPTS`).

### 3.3 Resend Verification OTP (`POST /api/v1/auth/resend-otp`)
- **Native Resend Operation:**
  ```python
  anon.auth.resend({
      "type": "signup",
      "email": data.email,
      "options": {
          "email_redirect_to": "http://localhost:5173/verify-otp"
      }
  })
  ```
- **Throttling:** Captures Supabase Auth's security cooldown (e.g., `For security purposes, you can only request this after X seconds`) and returns HTTP 429 `RATE_LIMITED` with the exact retry duration.

### 3.4 Password Recovery (`POST /api/v1/auth/forgot-password`)
- **Native Password Reset:**
  ```python
  anon.auth.reset_password_for_email(data.email, {
      "redirect_to": "http://localhost:5173/reset-password"
  })
  ```

---

## 4. Supabase Dashboard Configuration for Lifnex-Staging

To ensure the native confirmation email delivers a 6-digit numeric OTP instead of a clickable link, the following settings must be configured in the Supabase Dashboard for staging project `jejnuespiisksqfgqwsg`:

### 4.1 Confirm Email & Provider Settings
1. Go to **Authentication** -> **Providers** -> **Email**.
2. Ensure **Enable Email provider** is toggled **ON**.
3. Ensure **Confirm email** is toggled **ON**.
4. Set **Secure email change** to **ON**.

### 4.2 Numeric OTP Email Template (`{{ .Token }}`)
1. Go to **Authentication** -> **Email Templates** -> **Confirm signup**.
2. Update the Subject line:  
   `Verify Your Lifnex Account — Code: {{ .Token }}`
3. Update the Template Body to display the 6-digit token:
   ```html
   <h2>Confirm your Lifnex Registration</h2>
   <p>Thank you for joining the Lifnex emergency network.</p>
   <p>Your 6-digit verification code is:</p>
   <p style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 4px; color: #FF2E54;">
     {{ .Token }}
   </p>
   <p>This code expires in 10 minutes. If you did not create an account, please disregard this message.</p>
   ```

### 4.3 URL Configuration & Redirect Allowlist
1. Go to **Authentication** -> **URL Configuration**.
2. **Site URL:** `http://localhost:5173`
3. **Redirect URLs:**
   - `http://localhost:5173/**`
   - `http://localhost:5173/verify-otp`
   - `http://localhost:5173/reset-password`

---

## 5. Default Email Delivery Limitations

During live staging testing, the built-in Supabase mailer behavior was audited:

- **Hourly Rate Limit:** The default Supabase mailer strictly caps outgoing emails at **3 emails per hour** on free/standard staging tiers.
- **Live Test Output:** When exceeding the threshold, Supabase Auth returns:  
  `AuthApiError: email rate limit exceeded` (HTTP 429).
- **Recipient Domain Filtering:** Free/demo Supabase mailers enforce DNS MX record checks and will reject synthetic or invalid domains (e.g., `*.test`, `*.internal`, `*.org` without MX records) with:  
  `Email address "..." is invalid`. Real domains (`@gmail.com`, `@outlook.com`, `@yahoo.com`) are required.
- **Production Boundary:** Prohibited production references (`ygbprigcrooveopipkcl`, `krvxybseqaxeculpgveg`) remain blocked in code.
