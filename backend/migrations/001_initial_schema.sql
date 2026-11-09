-- ==============================================================================
-- LIFNEX COMPREHENSIVE DATABASE MIGRATION SCRIPT (3NF)
-- Engine: Supabase PostgreSQL 15
-- Application: Lifnex - AI-Powered Emergency Blood Donor Coordination Platform
-- Tables: 9 Relational Tables with Foreign Keys, Constraints, Indexes & RLS
-- ==============================================================================

-- Enable UUID extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLE: users (Application user profiles linked to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    role VARCHAR(30) NOT NULL DEFAULT 'patient',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_role CHECK (role IN ('patient', 'donor', 'hospital', 'admin'))
);

-- ==============================================================================
-- 2. TABLE: donor_profiles (Donor medical parameters, location, and availability)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.donor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    blood_group VARCHAR(5) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL DEFAULT 'undisclosed',
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    city VARCHAR(100) NOT NULL,
    travel_radius_km INTEGER NOT NULL DEFAULT 15,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'available',
    last_donation_date DATE,
    total_donations INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_donor_blood_group CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    CONSTRAINT chk_donor_gender CHECK (gender IN ('male', 'female', 'other', 'undisclosed')),
    CONSTRAINT chk_donor_latitude CHECK (latitude BETWEEN -90.0 AND 90.0),
    CONSTRAINT chk_donor_longitude CHECK (longitude BETWEEN -180.0 AND 180.0),
    CONSTRAINT chk_donor_radius CHECK (travel_radius_km BETWEEN 1 AND 100),
    CONSTRAINT chk_donor_availability CHECK (availability_status IN ('available', 'busy', 'inactive', 'cooldown')),
    CONSTRAINT chk_donor_donations_count CHECK (total_donations >= 0)
);

-- ==============================================================================
-- 3. TABLE: hospitals (Accredited medical centers & blood banks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    emergency_phone VARCHAR(30) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    has_blood_bank BOOLEAN NOT NULL DEFAULT TRUE,
    current_inventory_status JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_hosp_latitude CHECK (latitude BETWEEN -90.0 AND 90.0),
    CONSTRAINT chk_hosp_longitude CHECK (longitude BETWEEN -180.0 AND 180.0),
    CONSTRAINT chk_hosp_inventory_object CHECK (jsonb_typeof(current_inventory_status) = 'object')
);

-- ==============================================================================
-- 4. TABLE: blood_requests (Emergency blood requisitions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    blood_group VARCHAR(5) NOT NULL,
    units_required INTEGER NOT NULL,
    units_fulfilled INTEGER NOT NULL DEFAULT 0,
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'urgent',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending_verification',
    clinical_notes TEXT,
    prescription_file_url TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    required_by TIMESTAMPTZ NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_req_blood_group CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    CONSTRAINT chk_req_units_required CHECK (units_required BETWEEN 1 AND 20),
    CONSTRAINT chk_req_units_fulfilled CHECK (units_fulfilled >= 0),
    CONSTRAINT chk_req_units_fulfilled_not_over_required CHECK (units_fulfilled <= units_required),
    CONSTRAINT chk_req_urgency CHECK (urgency_level IN ('normal', 'urgent', 'critical')),
    CONSTRAINT chk_req_status CHECK (status IN ('open', 'in_progress', 'fulfilled', 'cancelled', 'expired')),
    CONSTRAINT chk_req_verification CHECK (verification_status IN ('pending_verification', 'verified', 'rejected')),
    CONSTRAINT chk_req_latitude CHECK (latitude BETWEEN -90.0 AND 90.0),
    CONSTRAINT chk_req_longitude CHECK (longitude BETWEEN -180.0 AND 180.0)
);

-- ==============================================================================
-- 5. TABLE: donor_responses (Responses from donors alerted to an emergency)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.donor_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
    response_status VARCHAR(20) NOT NULL DEFAULT 'accepted',
    estimated_arrival_minutes INTEGER,
    notes TEXT,
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_request_donor_response UNIQUE (request_id, donor_id),
    CONSTRAINT chk_resp_status CHECK (response_status IN ('accepted', 'declined', 'en_route', 'completed', 'cancelled')),
    CONSTRAINT chk_resp_eta CHECK (estimated_arrival_minutes >= 0)
);

-- ==============================================================================
-- 6. TABLE: notifications (In-app alerts and notifications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reference_request_id UUID REFERENCES public.blood_requests(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) NOT NULL DEFAULT 'emergency_alert',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notif_type CHECK (notification_type IN ('emergency_alert', 'response_update', 'verification', 'system'))
);

-- ==============================================================================
-- 7. TABLE: donation_history (Verified record of completed blood donations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.donation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE RESTRICT,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    request_id UUID REFERENCES public.blood_requests(id) ON DELETE SET NULL,
    donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    units_donated INTEGER NOT NULL DEFAULT 1,
    blood_group VARCHAR(5) NOT NULL,
    verification_certificate_no VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_hist_units CHECK (units_donated > 0)
);

-- ==============================================================================
-- 8. TABLE: verification_records (Audit logs of healthcare credentials & licenses)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_verif_type CHECK (verification_type IN ('hospital_license', 'donor_health_screen', 'medical_request')),
    CONSTRAINT chk_verif_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- ==============================================================================
-- 9. TABLE: audit_logs (Tamper-evident system activity log)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    client_ip INET,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

CREATE INDEX IF NOT EXISTS idx_donors_matching ON public.donor_profiles (blood_group, availability_status, last_donation_date);
CREATE INDEX IF NOT EXISTS idx_donors_coords ON public.donor_profiles (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_donors_city_blood_availability ON public.donor_profiles (city, blood_group, availability_status);

CREATE INDEX IF NOT EXISTS idx_hospitals_coords ON public.hospitals (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_city_verified ON public.hospitals (city, is_verified);

CREATE INDEX IF NOT EXISTS idx_requests_status_urgency ON public.blood_requests (status, urgency_level, blood_group);
CREATE INDEX IF NOT EXISTS idx_requests_patient ON public.blood_requests (patient_id);
CREATE INDEX IF NOT EXISTS idx_requests_hospital ON public.blood_requests (hospital_id);
CREATE INDEX IF NOT EXISTS idx_requests_required_by ON public.blood_requests (required_by) WHERE status IN ('open', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_responses_donor ON public.donor_responses (donor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications (recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_hist_donor ON public.donation_history (donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_hist_hospital ON public.donation_history (hospital_id);
CREATE INDEX IF NOT EXISTS idx_donation_hist_request ON public.donation_history (request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_target_status ON public.verification_records (target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_verification_reviewed_by ON public.verification_records (reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs (actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs (created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) — FAIL-CLOSED BASE SCHEMA
-- ==============================================================================
-- Migration 001 creates the tables and enables RLS, but deliberately creates
-- NO client-facing policies. This prevents an insecure access window between
-- Migration 001 and Migration 002. Migration 002 is responsible for creating
-- the reviewed 36 policies and granting the minimum required table privileges.
--
-- Until Migration 002 is applied, anon/authenticated have no table privileges.
-- The trusted backend service_role is managed separately by Supabase.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    public.users,
    public.donor_profiles,
    public.hospitals,
    public.blood_requests,
    public.donor_responses,
    public.notifications,
    public.donation_history,
    public.verification_records,
    public.audit_logs
FROM anon, authenticated;

-- NOTE:
-- 1. Migration 002 must be applied immediately after this migration.
-- 2. Do not expose these base tables through the client until Migration 002
--    has installed its RLS policies and explicit grants.
-- 3. Keep real accounts/requests is_demo = FALSE. Set TRUE explicitly only
--    for synthetic demonstration records.
-- 4. This script uses CREATE TABLE IF NOT EXISTS; it does not repair an
--    already-existing table with a different definition. Use a new ALTER
--    migration for any deployed schema changes.

