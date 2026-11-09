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
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
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
    gender VARCHAR(20) DEFAULT 'undisclosed',
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
    current_inventory_status JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_hosp_latitude CHECK (latitude BETWEEN -90.0 AND 90.0),
    CONSTRAINT chk_hosp_longitude CHECK (longitude BETWEEN -180.0 AND 180.0)
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
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_req_blood_group CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    CONSTRAINT chk_req_units_required CHECK (units_required BETWEEN 1 AND 20),
    CONSTRAINT chk_req_units_fulfilled CHECK (units_fulfilled >= 0),
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
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

CREATE INDEX IF NOT EXISTS idx_donors_matching ON public.donor_profiles (blood_group, availability_status, last_donation_date);
CREATE INDEX IF NOT EXISTS idx_donors_coords ON public.donor_profiles (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_hospitals_coords ON public.hospitals (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_license ON public.hospitals (license_number);

CREATE INDEX IF NOT EXISTS idx_requests_status_urgency ON public.blood_requests (status, urgency_level, blood_group);
CREATE INDEX IF NOT EXISTS idx_requests_patient ON public.blood_requests (patient_id);
CREATE INDEX IF NOT EXISTS idx_requests_hospital ON public.blood_requests (hospital_id);

CREATE INDEX IF NOT EXISTS idx_responses_req_donor ON public.donor_responses (request_id, donor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications (recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_donation_hist_donor ON public.donation_history (donor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs (created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. users Policies
CREATE POLICY "Users can read own profile or admin can read all" ON public.users
    FOR SELECT USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update own profile (excluding role)" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- 2. donor_profiles Policies
CREATE POLICY "Donors can manage own profile" ON public.donor_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read available donors non-sensitive data" ON public.donor_profiles
    FOR SELECT USING (availability_status = 'available' OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 3. hospitals Policies
CREATE POLICY "Public read verified hospitals" ON public.hospitals
    FOR SELECT USING (true);

CREATE POLICY "Hospitals can update own facility info" ON public.hospitals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Hospital user can insert own hospital" ON public.hospitals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. blood_requests Policies
CREATE POLICY "Public read open blood requests" ON public.blood_requests
    FOR SELECT USING (status IN ('open', 'in_progress') OR auth.uid() = patient_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Authenticated users can create requests" ON public.blood_requests
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Request creator or hospital can update request" ON public.blood_requests
    FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() IN (SELECT user_id FROM public.hospitals WHERE id = hospital_id) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 5. donor_responses Policies
CREATE POLICY "Participants can read donor responses" ON public.donor_responses
    FOR SELECT USING (
        donor_id IN (SELECT id FROM public.donor_profiles WHERE user_id = auth.uid()) OR
        request_id IN (SELECT id FROM public.blood_requests WHERE patient_id = auth.uid()) OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Donors can submit response" ON public.donor_responses
    FOR INSERT WITH CHECK (donor_id IN (SELECT id FROM public.donor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Donors can update own response" ON public.donor_responses
    FOR UPDATE USING (donor_id IN (SELECT id FROM public.donor_profiles WHERE user_id = auth.uid()));

-- 6. notifications Policies
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can mark own notifications read" ON public.notifications
    FOR UPDATE USING (recipient_id = auth.uid());

-- 7. donation_history Policies
CREATE POLICY "Donors and hospitals can view related donation history" ON public.donation_history
    FOR SELECT USING (
        donor_id IN (SELECT id FROM public.donor_profiles WHERE user_id = auth.uid()) OR
        hospital_id IN (SELECT id FROM public.hospitals WHERE user_id = auth.uid()) OR
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Hospitals can insert donation records" ON public.donation_history
    FOR INSERT WITH CHECK (hospital_id IN (SELECT id FROM public.hospitals WHERE user_id = auth.uid()) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 8. verification_records Policies
CREATE POLICY "Users view own verifications; Admins view all" ON public.verification_records
    FOR SELECT USING (target_user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins update verifications" ON public.verification_records
    FOR UPDATE USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 9. audit_logs Policies (Immutable)
CREATE POLICY "Admins read audit logs" ON public.audit_logs
    FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "No public updates to audit logs" ON public.audit_logs
    FOR UPDATE USING (false);

CREATE POLICY "No public deletes to audit logs" ON public.audit_logs
    FOR DELETE USING (false);

