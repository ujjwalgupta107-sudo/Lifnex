# LIFNEX — SMTP Implementation Report
**Document Version:** 1.0.0  
**Date:** November 2026  
**Author:** Principal Software Engineer & SMTP Infrastructure Specialist  
**Application:** Lifnex (AI-Powered Emergency Blood Donor Coordination Platform)  
**Tagline:** *Connecting Lives When Every Second Matters.*

---

## 1. Executive Summary

This report documents the architectural design, implementation, and verification of the production-grade email dispatch and authentication infrastructure for the Lifnex platform. The email subsystem has been unified across Flask backend services, Supabase Auth Custom SMTP, and the modern React/Vite user interface.

Lifnex uses **Resend** (`smtp.resend.com`) as its primary SMTP delivery provider for transactional notifications, with support for fallback relays and Supabase Auth native delivery. All email templates follow the Lifnex Cyber-Medical design system and strictly enforce donor and patient privacy by excluding sensitive medical PII.

---

## 2. Architecture & Components

```
                +---------------------------------------+
                |          Lifnex User Interface        |
                |   (React / TypeScript / Vite on 5173) |
                +-------------------+-------------------+
                                    |
                    REST Requests   |   Verification Redirects
                                    v
                +---------------------------------------+
                |        Lifnex Flask Backend (5000)    |
                |     - Config (SMTP_HOST, Resend)      |
                |     - Auth Routes (/register, /login) |
                |     - OTP Service (SHA-256 HMAC)      |
                |     - Email Service (4 Templates)     |
                +----------+-----------------+----------+
                           |                 |
     Custom SMTP Relay     |                 |  Supabase SDK
     (smtp.resend.com)     v                 v
           +--------------------+      +--------------------+
           |    Resend SMTP     |      |  Supabase Staging  |
           |      Host          |      |  (jejnuespiisksq...|
           | Port 587 / 465     |      |  Auth & PostgreSQL |
           +---------+----------+      +---------+----------+
                     |                           |
                     +-------------+-------------+
                                   |
                                   v
                      +--------------------------+
                      | End User Mailbox (Inbox) |
                      |  - 6-Digit Verification  |
                      |  - Password Reset        |
                      |  - Blood Request Alerts  |
                      |  - Hospital Notices      |
                      +--------------------------+
```

### 2.1 Backend Configuration (`backend/app/config.py`)
The configuration module now manages SMTP parameters with support for Resend's standard credentials and backwards-compatible aliases:
- `SMTP_HOST`: `smtp.resend.com` (default)
- `SMTP_PORT`: `587` (STARTTLS) or `465` (SSL)
- `SMTP_USERNAME` / `SMTP_USER`: Standardized to `resend` for the Resend provider, with graceful fallback to `SMTP_USER`
- `SMTP_PASSWORD`: API key (`re_...`)
- `SMTP_FROM`: Authenticated sending address (`noreply@lifnex.space`)
- `SMTP_FROM_NAME`: Display identity (`Lifnex Emergency Network`)
- `SMTP_USE_TLS`: Explicit boolean for RFC 3207 STARTTLS negotiation
- `SMTP_USE_SSL`: Explicit boolean for immediate SMTPS wrapper negotiation

### 2.2 Mutual Exclusivity of Encryption Modes
In `backend/app/services/email_service.py`, SSL and STARTTLS are enforced mutually exclusively:
```python
use_ssl = Config.SMTP_USE_SSL or (Config.SMTP_PORT == 465)
use_tls = Config.SMTP_USE_TLS and not use_ssl

if use_ssl:
    with smtplib.SMTP_SSL(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
        server.login(smtp_user, Config.SMTP_PASSWORD)
        server.sendmail(Config.SMTP_FROM, [to_email], msg.as_string())
else:
    with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
        if use_tls:
            server.starttls()
        server.login(smtp_user, Config.SMTP_PASSWORD)
        server.sendmail(Config.SMTP_FROM, [to_email], msg.as_string())
```

---

## 3. Branded Email Templates

All email templates use inline CSS, responsive HTML tables compatible with mobile email clients, Microsoft Outlook, Apple Mail, and Gmail.

1. **Email OTP Verification Template (`generate_otp_email_html`)**:
   - Header with glowing crimson top accent bar (`#FF2E54`) and Lifnex branding.
   - Individual monospace boxed digits for the 6-digit code.
   - Hidden accessibility fallback text for screen readers.
   - 10-minute expiration notice.
   - Security advisory warning users never to share verification codes.

2. **Password Reset Template (`generate_password_reset_email_html`)**:
   - Primary crimson CTA button leading to password reset terminal.
   - 15-minute expiration window notice.
   - Clear warning to disregard the email if the user did not initiate the reset.

3. **Emergency Blood Donor Match Alert (`generate_blood_request_alert_email_html`)**:
   - High-urgency alert banner (`🚨 CRITICAL DONOR MATCH`).
   - Clean tabular display of blood group, units needed, hospital name, and city.
   - Direct button link to the donor dashboard (`/donor/dashboard`).
   - **Zero Patient PII:** Medical diagnosis, patient name, and personal details are strictly excluded to preserve patient confidentiality.

4. **Hospital Institutional Verification Notice (`generate_hospital_verification_email_html`)**:
   - Badged institutional status update (Approved / Under Review).
   - Optional administrative notes section.
   - Direct link to hospital portal.

---

## 4. Frontend Integration & Error States

1. **Registration Flow (`RegisterPage.tsx`)**:
   - Upon submitting registration details, user is automatically navigated to `/verify-otp` with session state persisted.
2. **Verification Terminal (`VerifyOtpPage.tsx`)**:
   - Six independent input boxes with numeric validation, auto-advance, backspace navigation, and clipboard paste support.
   - 60-second cooldown timer for the "Resend Code" action to prevent flooding.
   - Immediate feedback banners for invalid codes, expired codes, and rate limits.
3. **Login Gateway (`LoginPage.tsx`)**:
   - Intercepts `EMAIL_NOT_VERIFIED` backend status code (HTTP 403).
   - Surfaces a direct action link (`→ Enter 6-digit verification code`) allowing unverified users to complete verification without starting over.

---

## 5. Security & Compliance Verification

- **Credential Isolation:** No SMTP secrets or Resend API tokens are printed to stdout, logged to audit logs, or committed to version control.
- **Audit Logging:** Every OTP dispatch, resend event, verification success, and password reset trigger logs an audit record to `public.audit_logs` capturing client IP, actor identity, and delivery status without sensitive values.
- **RFC Compliance:** Adheres to RFC 5322 (Internet Message Format), RFC 3207 (SMTP STARTTLS), and RFC 8314 (Cleartext Considered Obsolete: Use of Transport Layer Security (TLS)).
