# LIFNEX — DATABASE ROW LEVEL SECURITY (RLS) TEST PLAN & AUDIT REPORT

**System:** Lifnex Database Authorization Engine  
**Target:** Supabase PostgreSQL 15+ (`ygbprigcrooveopipkcl`)  
**Scope:** Migration 001 + Migration 002 Hardening  
**Verification Method:** Static SQL Security Review, Unit Test Suite Execution, and Staging Authorization Test Harness.

---

## 1. Test Environment Setup & Account Seed Script

To execute these tests in the Supabase SQL Editor on a staging project, run this setup script to create representative test entities:

```sql
-- ==============================================================================
-- TEST SETUP SCRIPT: CREATE TEST IDENTITIES & PROFILES
-- ==============================================================================

-- 1. Create simulated auth users in auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'patient1@lifnex.test', '{"role":"patient"}'::jsonb),
    ('11111111-1111-1111-1111-222222222222', 'patient2@lifnex.test', '{"role":"patient"}'::jsonb),
    ('22222222-2222-2222-2222-222222222222', 'donor@lifnex.test', '{"role":"donor"}'::jsonb),
    ('33333333-3333-3333-3333-333333333333', 'hosp_unverified@lifnex.test', '{"role":"hospital"}'::jsonb),
    ('44444444-4444-4444-4444-444444444444', 'hosp_verified1@lifnex.test', '{"role":"hospital"}'::jsonb),
    ('55555555-5555-5555-5555-555555555555', 'hosp_verified2@lifnex.test', '{"role":"hospital"}'::jsonb),
    ('99999999-9999-9999-9999-999999999999', 'admin@lifnex.test', '{"role":"admin"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. Link public.users profiles
INSERT INTO public.users (id, email, full_name, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'patient1@lifnex.test', 'Patient One', 'patient'),
    ('11111111-1111-1111-1111-222222222222', 'patient2@lifnex.test', 'Patient Two', 'patient'),
    ('22222222-2222-2222-2222-222222222222', 'donor@lifnex.test', 'Test Donor', 'donor'),
    ('33333333-3333-3333-3333-333333333333', 'hosp_unverified@lifnex.test', 'Unverified Clinic', 'hospital'),
    ('44444444-4444-4444-4444-444444444444', 'hosp_verified1@lifnex.test', 'Verified General Hospital (Assigned)', 'hospital'),
    ('55555555-5555-5555-5555-555555555555', 'hosp_verified2@lifnex.test', 'Verified City Clinic (Unrelated)', 'hospital'),
    ('99999999-9999-9999-9999-999999999999', 'admin@lifnex.test', 'System Administrator', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed hospital profiles
INSERT INTO public.hospitals (id, user_id, name, license_number, address, city, latitude, longitude, emergency_phone, contact_person, is_verified)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Unverified Clinic', 'LIC-UNVERIF-01', '101 Medical Rd', 'Metropolis', 28.6139, 77.2090, '+15550001', 'Dr. Unverified', FALSE),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'Verified General Hospital', 'LIC-VERIF-01', '202 Health Blvd', 'Metropolis', 28.6150, 77.2100, '+15550002', 'Dr. Verified One', TRUE),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'Verified City Clinic', 'LIC-VERIF-02', '303 Care Ave', 'Metropolis', 28.6250, 77.2200, '+15550003', 'Dr. Verified Two', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed donor profile
INSERT INTO public.donor_profiles (id, user_id, blood_group, date_of_birth, latitude, longitude, city, travel_radius_km, availability_status, is_verified, total_donations)
VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'O+', '1995-05-15', 28.6200, 77.2150, 'Metropolis', 20, 'available', TRUE, 5)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed blood request belonging to Patient One (Assigned Hospital: bbbbbbbb-...)
INSERT INTO public.blood_requests (id, patient_id, hospital_id, blood_group, units_required, urgency_level, status, verification_status, latitude, longitude, required_by)
VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'O+', 2, 'urgent', 'open', 'pending_verification', 28.6150, 77.2100, NOW() + INTERVAL '24 hours')
ON CONFLICT (id) DO NOTHING;
```

---

## 2. Test Execution Matrix (All 7 Roles)

### Group 1: Anonymous Users (`anon`)

| Test ID | Action | Target | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TEST-ANON-01** | `SELECT *` | `public.users` | 0 rows returned (RLS filtered) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ANON-02** | `SELECT *` | `public.donor_profiles` | Permission Denied / 0 rows | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ANON-03** | `SELECT *` | `available_donors_public_view` | Aggregated count returned; 0 UUIDs; 0 DOBs | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ANON-04** | `SELECT *` | `emergency_blood_requests_public_feed` | Only verified requests; 0 notes; 0 prescription URLs | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ANON-05** | `SELECT *` | `public.hospitals` | Only verified hospitals (`is_verified = TRUE`); unverified omitted; 0 errors | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ANON-06** | `SELECT *` | `public.audit_logs` | Permission Denied | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ANON-07** | `EXECUTE` | `public.get_auth_user_role()` | Permission Denied (EXECUTE revoked) | **PENDING LIVE / VERIFIED STATIC** |

### Group 2: Authenticated Patient (`patient`)

| Test ID | Action | Target | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TEST-PAT-01** | `SELECT *` | `public.users` (own) | 1 row returned | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-02** | `SELECT *` | `public.users` (donor's profile) | 0 rows returned (RLS filtered) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-03** | `UPDATE` | `public.users` (`role = 'admin'`) | Policy Check Violation (Forbidden) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-04** | `INSERT` | `public.blood_requests` (own request) | Allowed; status forced to `pending_verification` | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-05** | `UPDATE` | `public.blood_requests` (`verification_status = 'verified'`) | Policy Check Violation (Self-verify blocked) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-06** | `UPDATE` | `public.blood_requests` (`units_fulfilled = 10`) | Policy Check Violation (Fulfillment locked) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-07** | `EXECUTE` | `public.get_request_patient_id(own_req_uuid)` | Returns Patient One UUID (Allowed) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-08** | `EXECUTE` | `public.get_request_patient_id(other_patient_req_uuid)` | Returns `NULL` (Snooping blocked) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-09** | `EXECUTE` | `public.get_request_verification_status(other_patient_req_uuid)` | Returns `NULL` (Snooping blocked) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-10** | `EXECUTE` | `public.get_request_hospital_id(other_patient_req_uuid)` | Returns `NULL` (Snooping blocked) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-PAT-11** | `EXECUTE` | `public.get_request_units_fulfilled(other_patient_req_uuid)` | Returns `0` (Snooping blocked) | **PENDING LIVE / VERIFIED STATIC** |

### Group 3: Authenticated Donor (`donor`)

| Test ID | Action | Target | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TEST-DON-01** | `SELECT *` | `public.donor_profiles` (own) | 1 row returned (full medical record) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-DON-02** | `UPDATE` | `public.donor_profiles` (`is_verified = TRUE`) | Policy Check Violation (Self-verification blocked) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-DON-03** | `UPDATE` | `public.donor_profiles` (`total_donations = 99`) | Policy Check Violation (Counter tampering blocked) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-DON-04** | `UPDATE` | `public.donor_profiles` (`availability_status = 'busy'`) | Allowed (Operational update) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-DON-05** | `INSERT` | `public.donor_responses` (own response) | Allowed | **PENDING LIVE / VERIFIED STATIC** |

### Group 4: Unverified Hospital (`hospital_unverified`)

| Test ID | Action | Target | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TEST-HUNV-01** | `UPDATE` | `public.hospitals` (`is_verified = TRUE`) | Policy Check Violation (Self-verification blocked) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-HUNV-02** | `UPDATE` | `public.blood_requests` (verify request) | Rejected by RLS (Not verified hospital) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-HUNV-03** | `INSERT` | `public.donation_history` (issue cert) | Rejected by RLS (Not verified hospital) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-HUNV-04** | `SELECT` | `public.donor_profiles` (direct table) | 0 rows returned (Medical access denied) | **PENDING LIVE / VERIFIED STATIC** |

### Group 5: Verified Hospital (`hospital_verified`)

| Test ID | Action | Target | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TEST-HVER-01** | `EXECUTE` | `public.get_request_patient_id(assigned_req_uuid)` | Returns Patient One UUID (Assigned hospital allowed)| **PENDING LIVE / VERIFIED STATIC** |
| **TEST-HVER-02** | `EXECUTE` | `public.get_request_patient_id(unrelated_req_uuid)`| Returns `NULL` (Unrelated hospital snooping blocked)| **PENDING LIVE / VERIFIED STATIC** |
| **TEST-HVER-03** | `UPDATE` | `public.blood_requests` (verify assigned request) | Allowed (Accredited hospital action) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-HVER-04** | `UPDATE` | `public.blood_requests` (update units_fulfilled)| Allowed | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-HVER-05** | `UPDATE` | `public.blood_requests` (change patient_id) | Policy Check Violation (Ownership reassign blocked) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-HVER-06** | `INSERT` | `public.donation_history` | Allowed (Certified donation issued) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-HVER-07** | `SELECT` | `public.donor_profiles` | Full profiles readable for emergency matching | **PENDING LIVE / VERIFIED STATIC** |

### Group 6: Platform Administrator (`admin`)

| Test ID | Action | Target | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TEST-ADM-01** | `SELECT *` | All 9 Tables | All records returned | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ADM-02** | `UPDATE` | `public.hospitals` (`is_verified = TRUE`) | Allowed (Admin verification approval) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ADM-03** | `SELECT *` | `public.audit_logs` | Full audit log readable | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ADM-04** | `UPDATE` | `public.audit_logs` | Rejected (Deny All — Tamper evident) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-ADM-05** | `DELETE` | `public.audit_logs` | Rejected (Deny All — Tamper evident) | **PENDING LIVE / VERIFIED STATIC** |

### Group 7: Service Role Backend (`service_role`)

| Test ID | Action | Target | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TEST-SRV-01** | `INSERT` | `public.users` (backend sync) | Allowed (Service role bypass) | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-SRV-02** | `INSERT` | `public.notifications` (system dispatch)| Allowed | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-SRV-03** | `INSERT` | `public.audit_logs` (event logging) | Allowed | **PENDING LIVE / VERIFIED STATIC** |
| **TEST-SRV-04** | `EXECUTE` | `public.get_request_patient_id(any_req_uuid)` | Returns Patient UUID (Service role allowed) | **PENDING LIVE / VERIFIED STATIC** |

---

## 3. Notification Trigger Verification Script (NULL & Value Changes)

```sql
-- Simulate Patient updating notification
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

-- 1. Marking read: Must SUCCEED
UPDATE public.notifications 
SET is_read = TRUE 
WHERE recipient_id = '11111111-1111-1111-1111-111111111111';

-- 2. Altering notification title: Must FAIL via Trigger (IS DISTINCT FROM)
UPDATE public.notifications 
SET title = 'Forged Alert' 
WHERE recipient_id = '11111111-1111-1111-1111-111111111111';

-- 3. Transitioning reference_request_id from NULL to UUID: Must FAIL via Trigger
UPDATE public.notifications 
SET reference_request_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' 
WHERE recipient_id = '11111111-1111-1111-1111-111111111111';

-- 4. Transitioning reference_request_id from UUID to NULL: Must FAIL via Trigger
UPDATE public.notifications 
SET reference_request_id = NULL 
WHERE recipient_id = '11111111-1111-1111-1111-111111111111';
```

---

## 4. Test Execution Status by Verification Tier

- **Tier 1: Automated Python Unit Tests (EXECUTED & PASSING):**
  - **17 of 17 tests passed** (`pytest backend/tests`), validating API routing, input schema validation, blood compatibility calculations, Haversine distance calculations, and controller-layer role escalation defenses.
- **Tier 2: Static SQL Review (EXECUTED & VERIFIED):**
  - Syntactic, functional, and security verification of all 13 `SECURITY DEFINER` routines, 1 immutability trigger, 36 RLS policies, 2 privacy views, and schema permission grants.
- **Tier 3: Supabase Staging Live Execution (EXPLICITLY PENDING):**
  - Not executed against live Supabase. Will be executed upon user authorization to run Migrations 001 and 002 in the Supabase Dashboard SQL Editor.
