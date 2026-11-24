# LIFNEX — Email Provider & Custom SMTP Setup Guide
**Domain:** `lifnex.space`  
**Preferred Provider:** Resend (`smtp.resend.com`)  
**Staging Supabase Project:** `jejnuespiisksqfgqwsg` (`https://jejnuespiisksqfgqwsg.supabase.co`)  
**Tagline:** *Connecting Lives When Every Second Matters.*

---

## 1. Overview

This guide provides step-by-step instructions for:
1. Setting up **Resend** as the authoritative email relay provider for `lifnex.space`.
2. Configuring necessary **DNS records** (SPF, DKIM, DMARC) for high inbox deliverability.
3. Enabling **Custom SMTP** in the Supabase Dashboard for the `jejnuespiisksqfgqwsg` staging project.
4. Setting up local and staging environment variables in `.env`.

---

## 2. Resend Account & Domain Setup

### Step 2.1: Create Domain in Resend
1. Log into your [Resend Dashboard](https://resend.com).
2. Navigate to **Domains** -> **Add Domain**.
3. Enter your domain: `lifnex.space`.
4. Choose your preferred sending region (e.g., `us-east-1` or `eu-west-1`).

### Step 2.2: Add DNS Records to Your Domain Registrar / DNS Host (Cloudflare, Namecheap, Route53, etc.)

Configure the following authoritative DNS records:

#### A. DKIM (DomainKeys Identified Mail) — *Authenticates message authenticity*
| Type | Name | Value | Proxy Status |
|---|---|---|---|
| **CNAME** | `resend._domainkey` | `dkim.resend.com` | **DNS Only** (No Cloudflare proxy) |
| **CNAME** | `resend2._domainkey` | `dkim2.resend.com` | **DNS Only** |
| **CNAME** | `resend3._domainkey` | `dkim3.resend.com` | **DNS Only** |

*(Note: Resend will display the exact 3 CNAME or TXT keys in the dashboard)*

#### B. SPF (Sender Policy Framework) — *Authorizes Resend/Amazon SES sending servers*
| Type | Name | Value | TTL |
|---|---|---|---|
| **TXT** | `@` (or `lifnex.space`) | `v=spf1 include:amazonses.com ~all` | Auto / 3600 |

*If you already have an existing SPF record, merge them:*
`v=spf1 include:amazonses.com include:_spf.google.com ~all`

#### C. DMARC (Domain-based Message Authentication, Reporting, and Conformance)
| Type | Name | Value | TTL |
|---|---|---|---|
| **TXT** | `_dmarc` | `v=DMARC1; p=none; pct=100; rua=mailto:dmarc-reports@lifnex.space` | Auto / 3600 |

#### D. MX Records (Optional - for bounce handling / return-path)
| Type | Name | Priority | Value |
|---|---|---|---|
| **MX** | `bounces` (or subdomain) | 10 | `feedback-smtp.us-east-1.amazonses.com` |

---

## 3. Resend API Key Generation

1. Go to **API Keys** in Resend.
2. Click **Create API Key**.
3. Name: `Lifnex-Staging-SMTP`.
4. Permissions: **Full Access** or **Sending Access**.
5. Copy the generated key: `re_xxxxxxxxxxxxxxxxxxxxxxxx`.
   *(Save it securely; it will not be displayed again).*

---

## 4. Supabase Auth Custom SMTP Configuration

By default, Supabase's built-in mailer has a strict rate limit of **3 emails per hour**. To support real user onboarding, Custom SMTP must be enabled for staging project `jejnuespiisksqfgqwsg`.

### Step-by-Step Instructions:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your staging project: **`jejnuespiisksqfgqwsg`**.
3. In the left navigation sidebar, click **Project Settings** (gear icon) -> **Authentication**.
4. Scroll down to the **SMTP Settings** section.
5. Toggle **Enable Custom SMTP** to **ON**.
6. Enter the following parameters:
   - **Sender email:** `noreply@lifnex.space`
   - **Sender name:** `Lifnex Emergency Network`
   - **Host:** `smtp.resend.com`
   - **Port number:** `587`
   - **Minimum TLS version:** `TLSv1.2`
   - **User:** `resend`
   - **Password:** `re_your_api_key_here` (Your Resend API key)
7. Click **Save**.
8. Click **Send test email** to your personal address to verify instant delivery.

---

## 5. Lifnex Backend `.env` Configuration

Add the verified Resend SMTP configuration to your root `.env`:

```env
# ==============================================================================
# SMTP Email Relay Configuration (Resend: smtp.resend.com)
# ==============================================================================
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USERNAME=resend
SMTP_PASSWORD=re_your_actual_resend_api_key_here
SMTP_FROM=noreply@lifnex.space
SMTP_FROM_NAME=Lifnex Emergency Network
SMTP_USE_TLS=1
SMTP_USE_SSL=0
```

*Alternative SSL/TLS configuration (Port 465):*
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USERNAME=resend
SMTP_PASSWORD=re_your_actual_resend_api_key_here
SMTP_FROM=noreply@lifnex.space
SMTP_FROM_NAME=Lifnex Emergency Network
SMTP_USE_TLS=0
SMTP_USE_SSL=1
```

---

## 6. Verification Checklist

- [x] Backend config `backend/app/config.py` supports both `SMTP_USERNAME` and `SMTP_USER`.
- [x] Mutual exclusivity between `SMTP_USE_SSL` and `SMTP_USE_TLS` is enforced in `backend/app/services/email_service.py`.
- [x] All 4 responsive Lifnex HTML email templates are implemented and tested.
- [x] Unit test suite (`backend/tests/test_email_service.py`) passes 10/10 tests.
- [x] Full automated test suite passes 94/94 tests.
- [x] Health endpoint `/api/v1/health` confirms staging connection (`jejnuespiisksqfgqwsg`).
- [ ] User adds DNS records for `lifnex.space` in their domain host.
- [ ] User enables Custom SMTP in Supabase Dashboard for `jejnuespiisksqfgqwsg`.
- [ ] User pastes `re_...` Resend API key into root `.env`.
