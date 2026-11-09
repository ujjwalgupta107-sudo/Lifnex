-- ==============================================================================
-- LIFNEX SECURITY HARDENING & RLS POLICY CORRECTION MIGRATION (REVIEWED)
-- Migration Version: 002 (Hardened, Tested & Verified)
-- Engine: Supabase PostgreSQL 15+
-- Target System: Lifnex - AI-Powered Emergency Blood Donor Coordination Platform
-- Intended to be rerunnable; does not drop tables or destroy table data. Review and stage-test before deployment.
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: PREREQUISITE ASSERTION (ENSURE MIGRATION 001 COMPLETED)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) OR NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'blood_requests'
    ) THEN
        RAISE EXCEPTION 'Prerequisite check failed: Migration 001 base schema must be executed before applying 002_security_hardening.sql';
    END IF;
END $$;

-- Enable UUID & crypto extensions if not active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enforce Row Level Security on all 9 public domain tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.donation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- SECTION 2: SAFE AUTHORIZATION HELPER FUNCTIONS & PRIVILEGE HARDENING
-- ==============================================================================
-- All functions are marked SECURITY DEFINER with fixed search_path = public, pg_temp.
-- Default PUBLIC execution is explicitly REVOKED.
-- EXECUTE is granted ONLY to 'authenticated' and 'service_role'.
-- Parameterized functions strictly authenticate callers, preventing arbitrary UUID enumeration.

-- 1. Helper: get current user role (returns NULL for anonymous users)
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS VARCHAR AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN 'service_role';
    END IF;
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Helper: check if caller is an active platform admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN TRUE;
    END IF;
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Helper: check if caller is a verified hospital
CREATE OR REPLACE FUNCTION public.is_verified_hospital()
RETURNS BOOLEAN AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN TRUE;
    END IF;
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.hospitals h
        JOIN public.users u ON h.user_id = u.id
        WHERE h.user_id = auth.uid() 
          AND h.is_verified = TRUE 
          AND u.role = 'hospital'
          AND u.is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Helper: get donor_profile ID for a user (strictly caller authorized)
CREATE OR REPLACE FUNCTION public.get_donor_id_for_user(lookup_user_id UUID)
RETURNS UUID AS $$
BEGIN
    -- Allow service role
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN (SELECT id FROM public.donor_profiles WHERE user_id = lookup_user_id);
    END IF;

    -- Deny snooping: only allow lookup of own ID, or if admin
    IF auth.uid() IS NULL OR (auth.uid() <> lookup_user_id AND NOT public.is_admin()) THEN
        RETURN NULL;
    END IF;
    RETURN (SELECT id FROM public.donor_profiles WHERE user_id = lookup_user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. Helper: get hospital ID for a user (strictly caller authorized)
CREATE OR REPLACE FUNCTION public.get_hospital_id_for_user(lookup_user_id UUID)
RETURNS UUID AS $$
BEGIN
    -- Allow service role
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN (SELECT id FROM public.hospitals WHERE user_id = lookup_user_id);
    END IF;

    -- Deny snooping: only allow lookup of own ID, or if admin
    IF auth.uid() IS NULL OR (auth.uid() <> lookup_user_id AND NOT public.is_admin()) THEN
        RETURN NULL;
    END IF;
    RETURN (SELECT id FROM public.hospitals WHERE user_id = lookup_user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 6. Helper: get hospital verification status (authorized facility owner, admin or service_role)
CREATE OR REPLACE FUNCTION public.get_hospital_is_verified(lookup_hosp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN (SELECT is_verified FROM public.hospitals WHERE id = lookup_hosp_id);
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.hospitals 
        WHERE id = lookup_hosp_id AND (user_id = auth.uid() OR public.is_admin())
    ) THEN
        RETURN FALSE;
    END IF;
    RETURN (SELECT is_verified FROM public.hospitals WHERE id = lookup_hosp_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 7. Helper: get hospital owner UUID (authorized facility owner, admin or service_role)
CREATE OR REPLACE FUNCTION public.get_hospital_user_id(lookup_hosp_id UUID)
RETURNS UUID AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN (SELECT user_id FROM public.hospitals WHERE id = lookup_hosp_id);
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.hospitals 
        WHERE id = lookup_hosp_id AND (user_id = auth.uid() OR public.is_admin())
    ) THEN
        RETURN NULL;
    END IF;
    RETURN (SELECT user_id FROM public.hospitals WHERE id = lookup_hosp_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 8. Helper: get donor verification status (authorized donor, admin or service_role)
CREATE OR REPLACE FUNCTION public.get_donor_is_verified(lookup_donor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN (SELECT is_verified FROM public.donor_profiles WHERE id = lookup_donor_id);
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.donor_profiles 
        WHERE id = lookup_donor_id AND (user_id = auth.uid() OR public.is_admin())
    ) THEN
        RETURN FALSE;
    END IF;
    RETURN (SELECT is_verified FROM public.donor_profiles WHERE id = lookup_donor_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 9. Helper: get donor total donations count (authorized donor, admin or service_role)
CREATE OR REPLACE FUNCTION public.get_donor_total_donations(lookup_donor_id UUID)
RETURNS INTEGER AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN COALESCE((SELECT total_donations FROM public.donor_profiles WHERE id = lookup_donor_id), 0);
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN 0;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.donor_profiles 
        WHERE id = lookup_donor_id AND (user_id = auth.uid() OR public.is_admin())
    ) THEN
        RETURN 0;
    END IF;
    RETURN (SELECT total_donations FROM public.donor_profiles WHERE id = lookup_donor_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 10. Helper: get blood request verification status (strictly caller authorized)
CREATE OR REPLACE FUNCTION public.get_request_verification_status(lookup_req_id UUID)
RETURNS VARCHAR AS $$
BEGIN
    -- Allow service role explicitly
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN (SELECT verification_status FROM public.blood_requests WHERE id = lookup_req_id);
    END IF;

    -- Require authenticated caller
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- Validate caller is:
    -- a) The patient who created the request, OR
    -- b) An active verified hospital user whose hospital is the hospital_id of the request, OR
    -- c) An active system admin
    IF NOT EXISTS (
        SELECT 1 FROM public.blood_requests br
        WHERE br.id = lookup_req_id 
          AND (br.patient_id = auth.uid() 
               OR (public.is_verified_hospital() AND br.hospital_id IN (
                   SELECT h.id FROM public.hospitals h 
                   JOIN public.users u ON h.user_id = u.id
                   WHERE h.user_id = auth.uid() AND h.is_verified = TRUE AND u.role = 'hospital' AND u.is_active = TRUE
               ))
               OR public.is_admin())
    ) THEN
        RETURN NULL;
    END IF;

    RETURN (SELECT verification_status FROM public.blood_requests WHERE id = lookup_req_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 11. Helper: get blood request patient UUID (strictly caller authorized)
CREATE OR REPLACE FUNCTION public.get_request_patient_id(lookup_req_id UUID)
RETURNS UUID AS $$
BEGIN
    -- Allow service role explicitly
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN (SELECT patient_id FROM public.blood_requests WHERE id = lookup_req_id);
    END IF;

    -- Require authenticated caller
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- Validate caller is the patient, an authorized attending verified hospital, or an active admin
    IF NOT EXISTS (
        SELECT 1 FROM public.blood_requests br
        WHERE br.id = lookup_req_id 
          AND (br.patient_id = auth.uid() 
               OR (public.is_verified_hospital() AND br.hospital_id IN (
                   SELECT h.id FROM public.hospitals h 
                   JOIN public.users u ON h.user_id = u.id
                   WHERE h.user_id = auth.uid() AND h.is_verified = TRUE AND u.role = 'hospital' AND u.is_active = TRUE
               ))
               OR public.is_admin())
    ) THEN
        RETURN NULL;
    END IF;

    RETURN (SELECT patient_id FROM public.blood_requests WHERE id = lookup_req_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 12. Helper: get blood request hospital ID (strictly caller authorized)
CREATE OR REPLACE FUNCTION public.get_request_hospital_id(lookup_req_id UUID)
RETURNS UUID AS $$
BEGIN
    -- Allow service role explicitly
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN (SELECT hospital_id FROM public.blood_requests WHERE id = lookup_req_id);
    END IF;

    -- Require authenticated caller
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- Validate caller is the patient, an authorized attending verified hospital, or an active admin
    IF NOT EXISTS (
        SELECT 1 FROM public.blood_requests br
        WHERE br.id = lookup_req_id 
          AND (br.patient_id = auth.uid() 
               OR (public.is_verified_hospital() AND br.hospital_id IN (
                   SELECT h.id FROM public.hospitals h 
                   JOIN public.users u ON h.user_id = u.id
                   WHERE h.user_id = auth.uid() AND h.is_verified = TRUE AND u.role = 'hospital' AND u.is_active = TRUE
               ))
               OR public.is_admin())
    ) THEN
        RETURN NULL;
    END IF;

    RETURN (SELECT hospital_id FROM public.blood_requests WHERE id = lookup_req_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 13. Helper: get blood request units fulfilled count (strictly caller authorized)
CREATE OR REPLACE FUNCTION public.get_request_units_fulfilled(lookup_req_id UUID)
RETURNS INTEGER AS $$
BEGIN
    -- Allow service role explicitly
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN COALESCE((SELECT units_fulfilled FROM public.blood_requests WHERE id = lookup_req_id), 0);
    END IF;

    -- Require authenticated caller
    IF auth.uid() IS NULL THEN
        RETURN 0;
    END IF;

    -- Validate caller is the patient, an authorized attending verified hospital, or an active admin
    IF NOT EXISTS (
        SELECT 1 FROM public.blood_requests br
        WHERE br.id = lookup_req_id 
          AND (br.patient_id = auth.uid() 
               OR (public.is_verified_hospital() AND br.hospital_id IN (
                   SELECT h.id FROM public.hospitals h 
                   JOIN public.users u ON h.user_id = u.id
                   WHERE h.user_id = auth.uid() AND h.is_verified = TRUE AND u.role = 'hospital' AND u.is_active = TRUE
               ))
               OR public.is_admin())
    ) THEN
        RETURN 0;
    END IF;

    RETURN (SELECT units_fulfilled FROM public.blood_requests WHERE id = lookup_req_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke PUBLIC execution privileges from all 13 helper functions
REVOKE EXECUTE ON FUNCTION public.get_auth_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_verified_hospital() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_donor_id_for_user(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_hospital_id_for_user(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_hospital_is_verified(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_hospital_user_id(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_donor_is_verified(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_donor_total_donations(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_request_verification_status(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_request_patient_id(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_request_hospital_id(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_request_units_fulfilled(UUID) FROM PUBLIC;

-- Grant EXECUTE privileges exclusively to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_verified_hospital() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_donor_id_for_user(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_hospital_id_for_user(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_hospital_is_verified(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_hospital_user_id(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_donor_is_verified(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_donor_total_donations(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_request_verification_status(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_request_patient_id(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_request_hospital_id(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_request_units_fulfilled(UUID) TO authenticated, service_role;

-- ==============================================================================
-- SECTION 3: IMMUTABLE NOTIFICATION INTEGRITY TRIGGER (USING IS DISTINCT FROM)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.trg_enforce_notification_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Service role can perform unrestricted operations
    IF (auth.jwt() ->> 'role') = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Enforce immutability of protected columns for client updates using IS DISTINCT FROM
    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Security violation: notification id is immutable.';
    END IF;
    IF NEW.recipient_id IS DISTINCT FROM OLD.recipient_id THEN
        RAISE EXCEPTION 'Security violation: recipient_id on notifications is immutable.';
    END IF;
    IF NEW.title IS DISTINCT FROM OLD.title THEN
        RAISE EXCEPTION 'Security violation: notification title is immutable.';
    END IF;
    IF NEW.message IS DISTINCT FROM OLD.message THEN
        RAISE EXCEPTION 'Security violation: notification message is immutable.';
    END IF;
    IF NEW.notification_type IS DISTINCT FROM OLD.notification_type THEN
        RAISE EXCEPTION 'Security violation: notification_type is immutable.';
    END IF;
    IF NEW.reference_request_id IS DISTINCT FROM OLD.reference_request_id THEN
        RAISE EXCEPTION 'Security violation: reference_request_id is immutable.';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Security violation: created_at timestamp is immutable.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_notification_fields ON public.notifications;
CREATE TRIGGER trg_protect_notification_fields
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_enforce_notification_immutability();



-- Protect account privilege and identity fields from self-service profile updates.
-- Users may update ordinary profile details, but not role/activation/demo status.
CREATE OR REPLACE FUNCTION public.trg_guard_user_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role'
       OR auth.uid() IS NULL
       OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.is_demo IS DISTINCT FROM OLD.is_demo
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Security violation: protected account identity and privilege fields cannot be changed by the user.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_guard_user_profile_updates ON public.users;
CREATE TRIGGER trg_guard_user_profile_updates
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_guard_user_profile_updates();

-- Protect request ownership and sensitive workflow fields against row reassignment.
-- Patients may edit descriptive request details, but cannot change ownership,
-- hospital assignment, verification, fulfillment, identity, or creation timestamp.
-- The assigned verified hospital may update workflow fields, but cannot reassign the patient.
CREATE OR REPLACE FUNCTION public.trg_guard_blood_request_updates()
RETURNS TRIGGER AS $$
DECLARE
    caller_role TEXT;
    caller_is_admin BOOLEAN;
    caller_is_hospital BOOLEAN;
BEGIN
    caller_role := auth.jwt() ->> 'role';

    IF caller_role = 'service_role' OR auth.uid() IS NULL THEN
        -- No end-user JWT (e.g. trusted SQL Editor/maintenance connection).
        -- Client roles remain blocked by table grants and RLS.
        RETURN NEW;
    END IF;

    caller_is_admin := public.is_admin();
    IF caller_is_admin THEN
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Security violation: request identity and creation timestamp are immutable.';
    END IF;

    IF auth.uid() = OLD.patient_id THEN
        IF NEW.patient_id IS DISTINCT FROM OLD.patient_id
           OR NEW.hospital_id IS DISTINCT FROM OLD.hospital_id
           OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
           OR NEW.units_fulfilled IS DISTINCT FROM OLD.units_fulfilled THEN
            RAISE EXCEPTION 'Security violation: patient cannot change request ownership, hospital assignment, verification, or fulfillment.';
        END IF;
        RETURN NEW;
    END IF;

    caller_is_hospital :=
        public.is_verified_hospital()
        AND OLD.hospital_id = public.get_hospital_id_for_user(auth.uid());

    IF caller_is_hospital THEN
        IF NEW.patient_id IS DISTINCT FROM OLD.patient_id
           OR NEW.hospital_id IS DISTINCT FROM OLD.hospital_id THEN
            RAISE EXCEPTION 'Security violation: hospital cannot reassign request ownership or hospital.';
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Security violation: caller is not authorized to update this request.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_guard_blood_request_updates ON public.blood_requests;
CREATE TRIGGER trg_guard_blood_request_updates
    BEFORE UPDATE ON public.blood_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_guard_blood_request_updates();

-- Donors may update their response status/ETA/notes, but cannot move a response
-- to another donor or another request.
CREATE OR REPLACE FUNCTION public.trg_guard_donor_response_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role'
       OR auth.uid() IS NULL
       OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.donor_id IS DISTINCT FROM OLD.donor_id
       OR NEW.request_id IS DISTINCT FROM OLD.request_id
       OR NEW.responded_at IS DISTINCT FROM OLD.responded_at THEN
        RAISE EXCEPTION 'Security violation: donor response identity and ownership fields are immutable.';
    END IF;

    IF auth.uid() IS NULL
       OR OLD.donor_id <> public.get_donor_id_for_user(auth.uid()) THEN
        RAISE EXCEPTION 'Security violation: only the response owner may update this response.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_guard_donor_response_updates ON public.donor_responses;
CREATE TRIGGER trg_guard_donor_response_updates
    BEFORE UPDATE ON public.donor_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_guard_donor_response_updates();

REVOKE EXECUTE ON FUNCTION public.trg_enforce_notification_immutability() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_guard_user_profile_updates() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_guard_blood_request_updates() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_guard_donor_response_updates() FROM PUBLIC;

-- ==============================================================================
-- SECTION 4: IDEMPOTENT POLICY CLEANUP (HANDLES ALL HISTORICAL VERSIONS)
-- ==============================================================================
-- Drop 001 legacy policies
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile (excluding role)" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Donors can manage own profile" ON public.donor_profiles;
DROP POLICY IF EXISTS "Public read available donors non-sensitive data" ON public.donor_profiles;
DROP POLICY IF EXISTS "Public read verified hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Hospitals can update own facility info" ON public.hospitals;
DROP POLICY IF EXISTS "Hospital user can insert own hospital" ON public.hospitals;
DROP POLICY IF EXISTS "Public read open blood requests" ON public.blood_requests;
DROP POLICY IF EXISTS "Authenticated users can create requests" ON public.blood_requests;
DROP POLICY IF EXISTS "Request creator or hospital can update request" ON public.blood_requests;
DROP POLICY IF EXISTS "Participants can read donor responses" ON public.donor_responses;
DROP POLICY IF EXISTS "Donors can submit response" ON public.donor_responses;
DROP POLICY IF EXISTS "Donors can update own response" ON public.donor_responses;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
DROP POLICY IF EXISTS "Donors and hospitals can view related donation history" ON public.donation_history;
DROP POLICY IF EXISTS "Hospitals can insert donation records" ON public.donation_history;
DROP POLICY IF EXISTS "Users view own verifications; Admins view all" ON public.verification_records;
DROP POLICY IF EXISTS "Admins update verifications" ON public.verification_records;
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No public updates to audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No public deletes to audit logs" ON public.audit_logs;

-- Drop 002 previously created hardened policies
DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_service_role_only" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin_only" ON public.users;

DROP POLICY IF EXISTS "donor_select_own_or_medical" ON public.donor_profiles;
DROP POLICY IF EXISTS "donor_insert_own_profile" ON public.donor_profiles;
DROP POLICY IF EXISTS "donor_update_own_profile" ON public.donor_profiles;
DROP POLICY IF EXISTS "donor_delete_own_or_admin" ON public.donor_profiles;

DROP POLICY IF EXISTS "hospitals_select_verified_or_owner" ON public.hospitals;
DROP POLICY IF EXISTS "hospitals_insert_unverified_only" ON public.hospitals;
DROP POLICY IF EXISTS "hospitals_update_own_facility" ON public.hospitals;
DROP POLICY IF EXISTS "hospitals_delete_admin_only" ON public.hospitals;

DROP POLICY IF EXISTS "blood_requests_select_authorized" ON public.blood_requests;
DROP POLICY IF EXISTS "blood_requests_insert_authorized" ON public.blood_requests;
DROP POLICY IF EXISTS "blood_requests_update_authorized" ON public.blood_requests;
DROP POLICY IF EXISTS "blood_requests_delete_restricted" ON public.blood_requests;

DROP POLICY IF EXISTS "donor_responses_select_participants" ON public.donor_responses;
DROP POLICY IF EXISTS "donor_responses_insert_donor_only" ON public.donor_responses;
DROP POLICY IF EXISTS "donor_responses_update_donor_only" ON public.donor_responses;
DROP POLICY IF EXISTS "donor_responses_delete_donor_or_admin" ON public.donor_responses;

DROP POLICY IF EXISTS "notifications_select_recipient_only" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_service_or_admin" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_recipient_read_only" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_recipient_only" ON public.notifications;

DROP POLICY IF EXISTS "donation_history_select_authorized" ON public.donation_history;
DROP POLICY IF EXISTS "donation_history_insert_verified_hospital_only" ON public.donation_history;
DROP POLICY IF EXISTS "donation_history_update_admin_only" ON public.donation_history;
DROP POLICY IF EXISTS "donation_history_delete_admin_only" ON public.donation_history;

DROP POLICY IF EXISTS "verification_records_select_subject_or_admin" ON public.verification_records;
DROP POLICY IF EXISTS "verification_records_insert_subject" ON public.verification_records;
DROP POLICY IF EXISTS "verification_records_update_admin_only" ON public.verification_records;
DROP POLICY IF EXISTS "verification_records_delete_admin_only" ON public.verification_records;

DROP POLICY IF EXISTS "audit_logs_select_admin_only" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_authorized" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_all_updates" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_all_deletes" ON public.audit_logs;

-- ==============================================================================
-- SECTION 5: HARDENED RLS POLICIES (EXACTLY 36 POLICIES)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE: public.users (4 policies)
-- ------------------------------------------------------------------------------
CREATE POLICY "users_select_own_or_admin" ON public.users
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND auth.uid() = id) OR public.is_admin()
    );

CREATE POLICY "users_insert_service_role_only" ON public.users
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'role') = 'service_role'
    );

CREATE POLICY "users_update_own_profile" ON public.users
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND auth.uid() = id) OR public.is_admin()
    )
    WITH CHECK (
        ((auth.uid() IS NOT NULL AND auth.uid() = id) 
         AND role = public.get_auth_user_role() 
         AND id = auth.uid()) 
        OR public.is_admin()
    );

CREATE POLICY "users_delete_admin_only" ON public.users
    FOR DELETE USING (
        public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 2. TABLE: public.donor_profiles (4 policies)
-- ------------------------------------------------------------------------------
CREATE POLICY "donor_select_own_or_medical" ON public.donor_profiles
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "donor_insert_own_profile" ON public.donor_profiles
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND user_id = auth.uid()
        AND is_verified = FALSE
        AND total_donations = 0
    );

CREATE POLICY "donor_update_own_profile" ON public.donor_profiles
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin()
    )
    WITH CHECK (
        -- Donors cannot modify their user_id, verification flag, or donation counts
        (auth.uid() IS NOT NULL 
         AND user_id = auth.uid()
         AND is_verified = public.get_donor_is_verified(id)
         AND total_donations = public.get_donor_total_donations(id))
        OR public.is_admin()
    );

CREATE POLICY "donor_delete_own_or_admin" ON public.donor_profiles
    FOR DELETE USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 3. TABLE: public.hospitals (4 policies)
-- ------------------------------------------------------------------------------
-- Anonymous users can select verified hospitals cleanly without evaluating is_admin() or any internal helper.
-- Only authenticated users evaluate the owner or admin branch.
CREATE POLICY "hospitals_select_verified_or_owner" ON public.hospitals
    FOR SELECT USING (
        is_verified = TRUE 
        OR (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_admin()))
    );

CREATE POLICY "hospitals_insert_unverified_only" ON public.hospitals
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND user_id = auth.uid() 
        AND is_verified = FALSE
    );

CREATE POLICY "hospitals_update_own_facility" ON public.hospitals
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin()
    )
    WITH CHECK (
        -- Facility owner cannot alter user_id or self-verify
        (auth.uid() IS NOT NULL 
         AND user_id = auth.uid()
         AND is_verified = public.get_hospital_is_verified(id)
         AND user_id = public.get_hospital_user_id(id))
        OR public.is_admin()
    );

CREATE POLICY "hospitals_delete_admin_only" ON public.hospitals
    FOR DELETE USING (
        public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 4. TABLE: public.blood_requests (4 policies)
-- ------------------------------------------------------------------------------
CREATE POLICY "blood_requests_select_authorized" ON public.blood_requests
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND patient_id = auth.uid())
        OR (
            public.is_verified_hospital()
            AND hospital_id = public.get_hospital_id_for_user(auth.uid())
        )
        OR public.is_admin()
    );

CREATE POLICY "blood_requests_insert_authorized" ON public.blood_requests
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND patient_id = auth.uid() AND verification_status = 'pending_verification' AND units_fulfilled = 0)
        OR (public.is_verified_hospital() AND hospital_id = public.get_hospital_id_for_user(auth.uid()))
        OR public.is_admin()
    );

-- Blood request UPDATE policy:
-- 1. Patient update: patient_id, verification_status, hospital_id, and units_fulfilled are immutable (locked to original row).
-- 2. Verified hospital update: patient_id is immutable (locked to original row). Verified attending hospital can update status & fulfillment.
-- 3. Administrator: unrestricted.
CREATE POLICY "blood_requests_update_authorized" ON public.blood_requests
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND patient_id = auth.uid()) 
        OR (public.is_verified_hospital() AND hospital_id = public.get_hospital_id_for_user(auth.uid()))
        OR public.is_admin()
    )
    WITH CHECK (
        -- Patient update constraints: patient_id, verification_status, hospital_id, units_fulfilled are locked
        (auth.uid() IS NOT NULL 
         AND patient_id = auth.uid() 
         AND verification_status = public.get_request_verification_status(id)
         AND patient_id = public.get_request_patient_id(id)
         AND hospital_id = public.get_request_hospital_id(id)
         AND units_fulfilled = public.get_request_units_fulfilled(id))
        -- Verified hospital update constraints: patient_id is locked to prevent reassigning ownership
        OR (public.is_verified_hospital() 
            AND hospital_id = public.get_hospital_id_for_user(auth.uid())
            AND patient_id = public.get_request_patient_id(id))
        -- Admin unrestricted
        OR public.is_admin()
    );

CREATE POLICY "blood_requests_delete_restricted" ON public.blood_requests
    FOR DELETE USING (
        (auth.uid() IS NOT NULL AND patient_id = auth.uid() AND status = 'open' AND verification_status = 'pending_verification')
        OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 5. TABLE: public.donor_responses (4 policies)
-- ------------------------------------------------------------------------------
CREATE POLICY "donor_responses_select_participants" ON public.donor_responses
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND donor_id = public.get_donor_id_for_user(auth.uid()))
        OR (
            auth.uid() IS NOT NULL
            AND request_id IN (
                SELECT br.id FROM public.blood_requests br
                WHERE br.patient_id = auth.uid()
            )
        )
        OR (
            public.is_verified_hospital()
            AND request_id IN (
                SELECT br.id FROM public.blood_requests br
                WHERE br.hospital_id = public.get_hospital_id_for_user(auth.uid())
            )
        )
        OR public.is_admin()
    );

CREATE POLICY "donor_responses_insert_donor_only" ON public.donor_responses
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND donor_id = public.get_donor_id_for_user(auth.uid())
    );

CREATE POLICY "donor_responses_update_donor_only" ON public.donor_responses
    FOR UPDATE USING (
        (auth.uid() IS NOT NULL AND donor_id = public.get_donor_id_for_user(auth.uid())) OR public.is_admin()
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND donor_id = public.get_donor_id_for_user(auth.uid())) OR public.is_admin()
    );

CREATE POLICY "donor_responses_delete_donor_or_admin" ON public.donor_responses
    FOR DELETE USING (
        (auth.uid() IS NOT NULL AND donor_id = public.get_donor_id_for_user(auth.uid())) OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 6. TABLE: public.notifications (4 policies)
-- ------------------------------------------------------------------------------
CREATE POLICY "notifications_select_recipient_only" ON public.notifications
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND recipient_id = auth.uid()
    );

CREATE POLICY "notifications_insert_service_or_admin" ON public.notifications
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'role') = 'service_role' OR public.is_admin()
    );

CREATE POLICY "notifications_update_recipient_read_only" ON public.notifications
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND recipient_id = auth.uid()
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND recipient_id = auth.uid()
    );

CREATE POLICY "notifications_delete_recipient_only" ON public.notifications
    FOR DELETE USING (
        (auth.uid() IS NOT NULL AND recipient_id = auth.uid()) OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 7. TABLE: public.donation_history (4 policies)
-- ------------------------------------------------------------------------------
CREATE POLICY "donation_history_select_authorized" ON public.donation_history
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND donor_id = public.get_donor_id_for_user(auth.uid()))
        OR (auth.uid() IS NOT NULL AND hospital_id = public.get_hospital_id_for_user(auth.uid()))
        OR public.is_admin()
    );

CREATE POLICY "donation_history_insert_verified_hospital_only" ON public.donation_history
    FOR INSERT WITH CHECK (
        (public.is_verified_hospital() AND hospital_id = public.get_hospital_id_for_user(auth.uid()))
        OR public.is_admin()
    );

CREATE POLICY "donation_history_update_admin_only" ON public.donation_history
    FOR UPDATE USING (
        public.is_admin()
    );

CREATE POLICY "donation_history_delete_admin_only" ON public.donation_history
    FOR DELETE USING (
        public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 8. TABLE: public.verification_records (4 policies)
-- ------------------------------------------------------------------------------
CREATE POLICY "verification_records_select_subject_or_admin" ON public.verification_records
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND target_user_id = auth.uid()) OR public.is_admin()
    );

CREATE POLICY "verification_records_insert_subject" ON public.verification_records
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND target_user_id = auth.uid() AND status = 'pending'
    );

CREATE POLICY "verification_records_update_admin_only" ON public.verification_records
    FOR UPDATE USING (
        public.is_admin()
    )
    WITH CHECK (
        public.is_admin()
    );

CREATE POLICY "verification_records_delete_admin_only" ON public.verification_records
    FOR DELETE USING (
        public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 9. TABLE: public.audit_logs (4 policies)
-- ------------------------------------------------------------------------------
CREATE POLICY "audit_logs_select_admin_only" ON public.audit_logs
    FOR SELECT USING (
        public.is_admin()
    );

CREATE POLICY "audit_logs_insert_authorized" ON public.audit_logs
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'role') = 'service_role'
        OR public.is_admin()
    );

CREATE POLICY "audit_logs_deny_all_updates" ON public.audit_logs
    FOR UPDATE USING (
        false
    );

CREATE POLICY "audit_logs_deny_all_deletes" ON public.audit_logs
    FOR DELETE USING (
        false
    );

-- ==============================================================================
-- SECTION 6: PRIVACY-PRESERVING PUBLIC VIEWS (WITH security_invoker = false)
-- ==============================================================================
-- Security Model: Defined with security_invoker = false (Definer model)
-- executing with owner permissions so anonymous users can read safe, aggregated,
-- and sanitized data without direct table access to private medical records.

DROP VIEW IF EXISTS public.available_donors_public_view;
DROP VIEW IF EXISTS public.emergency_blood_requests_public_feed;

-- 1. Aggregated Donor Availability Feed (Zero Donor UUIDs, Zero Direct Contact Data)
CREATE VIEW public.available_donors_public_view 
WITH (security_invoker = false) AS
SELECT
    dp.blood_group,
    dp.city,
    COUNT(*)::INTEGER AS available_donor_count
FROM public.donor_profiles dp
WHERE dp.availability_status = 'available'
  AND dp.is_verified = TRUE
GROUP BY dp.blood_group, dp.city
HAVING COUNT(*) >= 3;

-- 2. Sanitized Public Emergency Request Feed (Omits clinical notes, prescription file URLs)
CREATE VIEW public.emergency_blood_requests_public_feed 
WITH (security_invoker = false) AS
SELECT 
    br.id AS request_id,
    br.blood_group,
    br.units_required,
    br.units_fulfilled,
    br.urgency_level,
    br.status,
    br.verification_status,
    br.required_by,
    br.created_at,
    h.name AS hospital_name,
    h.city AS hospital_city
FROM public.blood_requests br
JOIN public.hospitals h ON br.hospital_id = h.id
WHERE br.status IN ('open', 'in_progress')
  AND br.verification_status = 'verified';

-- ==============================================================================
-- SECTION 7: EXHAUSTIVE PRIVILEGE HARDENING & TABLE GRANTS
-- ==============================================================================
-- Explicitly revoke all privileges from anon and authenticated across all 9 tables
REVOKE ALL ON public.users FROM anon, authenticated;
REVOKE ALL ON public.donor_profiles FROM anon, authenticated;
REVOKE ALL ON public.hospitals FROM anon, authenticated;
REVOKE ALL ON public.blood_requests FROM anon, authenticated;
REVOKE ALL ON public.donor_responses FROM anon, authenticated;
REVOKE ALL ON public.notifications FROM anon, authenticated;
REVOKE ALL ON public.donation_history FROM anon, authenticated;
REVOKE ALL ON public.verification_records FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;

-- Grant minimal required permissions to anon
-- 1. Anonymous can select from the two privacy views
GRANT SELECT ON public.available_donors_public_view TO anon;
GRANT SELECT ON public.emergency_blood_requests_public_feed TO anon;
-- 2. Anonymous can select from hospitals (verified hospitals filtered via RLS)
GRANT SELECT ON public.hospitals TO anon;

-- Grant minimal required permissions to authenticated
-- 1. Privacy views
GRANT SELECT ON public.available_donors_public_view TO authenticated;
GRANT SELECT ON public.emergency_blood_requests_public_feed TO authenticated;
-- 2. Users table (read/update own profile via RLS)
GRANT SELECT, UPDATE ON public.users TO authenticated;
-- 3. Donor profiles (manage own profile, medical access via RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donor_profiles TO authenticated;
-- 4. Hospitals (read directory, register facility, update own facility via RLS)
GRANT SELECT, INSERT, UPDATE ON public.hospitals TO authenticated;
-- 5. Blood requests (create, view authorized, update authorized via RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_requests TO authenticated;
-- 6. Donor responses (participate in emergency response via RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donor_responses TO authenticated;
-- 7. Notifications (read, mark read, clear own notifications via RLS)
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
-- 8. Donation history (view authorized, verified hospital insert via RLS)
GRANT SELECT, INSERT ON public.donation_history TO authenticated;
-- 9. Verification records (submit credentials, admin review via RLS)
GRANT SELECT, INSERT, UPDATE ON public.verification_records TO authenticated;
-- 10. Audit logs (read for admins only via RLS; client write explicitly revoked)
GRANT SELECT ON public.audit_logs TO authenticated;

-- Grant full operational privileges to service_role (trusted backend processes)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;


-- ==============================================================================
-- DEPLOYMENT / VERIFICATION NOTE
-- ==============================================================================
-- This migration has been statically reviewed only. It has NOT been executed
-- against Supabase or a local PostgreSQL instance in this workflow.
-- Run the accompanying multi-role RLS test plan in a disposable staging project
-- before production deployment. Never expose the service_role key to a browser.
