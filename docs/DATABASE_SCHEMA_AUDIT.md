# LIFNEX — DATABASE SCHEMA & MIGRATION AUDIT
**Document ID:** LFX-DB-AUD-2026-V1  
**Classification:** Database Architecture & RLS Security Audit  
**Date:** November 2026  
**Auditor:** Database Architect & SQL Specialist  

---

## 1. Migration Scripts Inventory

The repository contains two foundational SQL migration scripts in `backend/migrations/`:
1. `001_initial_schema.sql` (14.6 KB) / `001_initial_schema_corrected.sql`
2. `002_security_hardening.sql` (46.0 KB) / `002_security_hardening_corrected.sql`

---

## 2. Table-by-Table Schema Analysis

### Table 1: `public.users`
- **PK:** `id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- **Columns:** `email`, `full_name`, `phone_number`, `role`, `is_active`, `is_demo`, `created_at`, `updated_at`.
- **Constraints:** `chk_user_role CHECK (role IN ('patient', 'donor', 'hospital', 'admin'))`.
- **Indexes:** `idx_users_email`, `idx_users_role`.

### Table 2: `public.donor_profiles`
- **PK:** `id UUID DEFAULT gen_random_uuid()`
- **FK:** `user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE`
- **Columns:** `blood_group`, `date_of_birth`, `gender`, `latitude`, `longitude`, `city`, `travel_radius_km`, `availability_status`, `last_donation_date`, `total_donations`, `is_verified`, `created_at`, `updated_at`.
- **Constraints:** Check constraints on valid ABO/Rh groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`), latitude (-90 to 90), longitude (-180 to 180), and travel radius (1 to 100 km).

### Table 3: `public.hospitals`
- **PK:** `id UUID DEFAULT gen_random_uuid()`
- **Columns:** `user_id` (FK to `users`), `name`, `license_number`, `hospital_type`, `address`, `city`, `state`, `postal_code`, `latitude`, `longitude`, `emergency_phone`, `is_verified`, `cold_chain_units`.

### Table 4: `public.blood_requests`
- **PK:** `id UUID DEFAULT gen_random_uuid()`
- **Columns:** `patient_id` (FK to `users`), `hospital_id` (FK to `hospitals`), `blood_group`, `units_required`, `units_fulfilled`, `urgency_level` (`critical`, `urgent`, `routine`), `status` (`open`, `in_progress`, `fulfilled`, `cancelled`), `required_by`, `clinical_notes`, `latitude`, `longitude`.

### Table 5: `public.donor_responses`
- **PK:** `id UUID DEFAULT gen_random_uuid()`
- **Columns:** `request_id` (FK to `blood_requests`), `donor_id` (FK to `donor_profiles`), `status` (`accepted`, `in_transit`, `completed`, `cancelled`), `estimated_arrival_minutes`, `response_time`.

### Table 6: `public.notifications`
- **PK:** `id UUID DEFAULT gen_random_uuid()`
- **Columns:** `recipient_id` (FK to `users`), `title`, `message`, `notification_type`, `is_read`, `reference_request_id`.

### Table 7: `public.donation_history`
- **PK:** `id UUID DEFAULT gen_random_uuid()`
- **Columns:** `donor_id` (FK to `donor_profiles`), `hospital_id` (FK to `hospitals`), `donation_date`, `blood_component`, `units_donated`, `certificate_hash`.

### Table 8: `public.verification_records`
- **PK:** `id UUID DEFAULT gen_random_uuid()`
- **Columns:** `target_id`, `target_type`, `verification_status`, `verified_by`, `notes`, `verified_at`.

### Table 9: `public.audit_logs`
- **PK:** `id UUID DEFAULT gen_random_uuid()`
- **Columns:** `user_id`, `event_type`, `target_entity`, `ip_address`, `details`, `block_hash` (SHA-256), `created_at`.

---

## 3. Row-Level Security (RLS) Verification

In `002_security_hardening.sql`:
- **45 RLS policies** are specified across all 9 tables.
- Patients are granted `SELECT` and `INSERT` on their own `blood_requests`.
- Donors are granted access strictly to open requests within compatible blood parameters.
- Hospital admins have inventory modification authority for their assigned facility.
- Superusers (`admin`) maintain oversight and audit inspection rights.

---
*Certified by Lifnex Database Architect.*
