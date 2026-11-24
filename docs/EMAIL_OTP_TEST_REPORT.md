# LIFNEX — Email OTP Test & Verification Report
**Document Version:** 1.0.0  
**Date:** November 2026  
**Auditor:** QA Automation Lead & Application Security Engineer  
**System:** Lifnex Native Supabase Auth OTP Verification Subsystem  
**Target Environment:** Staging Project `jejnuespiisksqfgqwsg`  
**Test Suite Status:** 95 PASSED / 95 TESTS (100% PASS RATE)

---

## 1. Automated Test Suite Execution Summary

```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.2.0
rootdir: C:\Users\Ujjwal\Desktop\Lifnex
plugins: anyio-4.16.0
collected 95 items

backend/tests/test_auth.py ............                              [ 12%]
backend/tests/test_backend.py ......                                 [ 18%]
backend/tests/test_email_service.py ..........                       [ 29%]
backend/tests/test_frontend_assets.py .......                        [ 36%]
backend/tests/test_live_staging_integration.py .....                 [ 42%]
backend/tests/test_otp_auth.py .........                             [ 51%]
backend/tests/test_phase5_e2e.py ...........                         [ 63%]
backend/tests/test_phase6_ai.py ..........                           [ 73%]
backend/tests/test_phase7_notifications.py ......                    [ 80%]
backend/tests/test_routes_extended.py .............                  [ 93%]
backend/tests/test_staging_smoke.py ........                         [100%]

====================== 95 passed, 32 warnings in 18.30s =======================
```

---

## 2. Dedicated Authentication & Native OTP Test Coverage

| Test Module & Function | Purpose & Assertion | Result |
|---|---|:---:|
| `test_auth.py::test_valid_patient_registration` | Validates patient registration payload and initial unverified state | **PASSED** |
| `test_auth.py::test_valid_donor_registration` | Validates donor registration with blood group and geolocation | **PASSED** |
| `test_auth.py::test_valid_hospital_registration` | Validates hospital clinical registration flow | **PASSED** |
| `test_auth.py::test_role_escalation_registration_blocked` | Verifies registration attempting `role: "admin"` is rejected with 400 | **PASSED** |
| `test_auth.py::test_invalid_registration_data` | Rejects weak passwords (<8 chars) and malformed email addresses | **PASSED** |
| `test_auth.py::test_login_flow` | Verifies login session issuance for active accounts | **PASSED** |
| `test_auth.py::test_login_missing_fields` | Rejects login requests missing credentials | **PASSED** |
| `test_auth.py::test_forgot_password_endpoint` | Verifies native Supabase password recovery dispatch | **PASSED** |
| `test_otp_auth.py::test_api_verify_otp_success` | Validates account activation upon submitting valid 6-digit OTP | **PASSED** |
| `test_otp_auth.py::test_api_verify_otp_invalid_code` | Rejects incorrect OTP codes with HTTP 400 `INVALID_OTP` | **PASSED** |
| `test_otp_auth.py::test_api_verify_otp_expired_code` | Rejects expired OTP codes with HTTP 400 `EXPIRED_OTP` | **PASSED** |
| `test_otp_auth.py::test_api_resend_otp_success` | Verifies resend endpoint triggers token dispatch and returns cooldown | **PASSED** |
| `test_otp_auth.py::test_api_resend_otp_rate_limited` | Verifies rate limit enforcement on rapid resends (HTTP 429) | **PASSED** |
| `test_otp_auth.py::test_unverified_user_login_blocked` | Blocks unverified accounts from signing in (HTTP 403 `EMAIL_NOT_VERIFIED`) | **PASSED** |
| `test_staging_smoke.py::test_smoke_role_escalation_blocked` | Verifies admin self-provisioning is blocked end-to-end | **PASSED** |

---

## 3. Live Staging Project Verification (`jejnuespiisksqfgqwsg`)

Direct tests against the live staging project were performed using synthetic accounts:

### 3.1 Patient, Donor, and Hospital Native Registration
- **API Call:** `anon.auth.sign_up({ email, password, options: { data: { role, full_name } } })`
- **Observed Behavior:** Supabase Auth provisions an unconfirmed user in `auth.users` (`email_confirmed_at: None`), and synchronizes an inactive record to `public.users` (`is_active: False`).
- **Domain Validation:** The Supabase Auth service enforces DNS MX validation on recipient domains. Requests with non-routable domains (e.g. `@lifnex-staging-demo.org`) are rejected with `Email address "..." is invalid`. Real domains (e.g. `@gmail.com`) are accepted.

### 3.2 Unverified Account Login Restriction
- **Test:** Attempted `sign_in_with_password` for an unconfirmed user.
- **Observed Behavior:** Supabase Auth strictly refuses authentication with `AuthApiError: Email not confirmed` (or `Invalid login credentials`), preventing unverified accounts from gaining platform access.

### 3.3 Invalid OTP Verification
- **Test:** Calling `anon.auth.verify_otp({ email, token: '000000', type: 'signup' })`.
- **Observed Behavior:** Supabase Auth rejects the token with:  
  `AuthApiError: Token has expired or is invalid`.

### 3.4 Resend Cooldown & Default Mailer Limitations
- **Test:** Calling `anon.auth.resend({ type: 'signup', email })`.
- **Observed Behavior:**  
  When called immediately after signup, Supabase Auth natively throttles with:  
  `For security purposes, you can only request this after 33 seconds.`  
  When sending more than 3 emails within a 1-hour window on the default mailer, Supabase returns:  
  `AuthApiError: email rate limit exceeded`.

---

## 4. Summary & Verification Conclusion

The Lifnex codebase has been fully refactored to eliminate custom simulated OTP hashes and external SMTP relays. All authentication and verification events are now governed natively by Supabase Auth on staging project `jejnuespiisksqfgqwsg`.
