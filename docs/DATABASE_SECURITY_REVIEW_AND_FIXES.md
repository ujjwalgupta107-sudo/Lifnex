# LIFNEX — DATABASE SECURITY REVIEW AND HARDENING FIXES (FINAL REVISION 3)

**Target Files:**  
- `backend/migrations/001_initial_schema.sql` (Base 3NF Schema & Constraints)  
- `backend/migrations/002_security_hardening.sql` (Hardened RLS, Safe Helpers, Views & Grants)  
**Target Project:** Supabase PostgreSQL 15+ (`ygbprigcrooveopipkcl`)  
**Status:** Hardened, Safe, Idempotent, and Ready for Deployment Review.  

---

## 1. Resolution of SQL Review Findings

### 1. Request Helper Authorization
- **Vulnerability:** Helpers `get_request_verification_status`, `get_request_patient_id`, `get_request_hospital_id`, and `get_request_units_fulfilled` could be abused to enumerate request attributes.
- **Correction:** Secured all 4 routines to strictly enforce caller authorization:
  ```sql
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
      RETURN NULL; -- or 0 for counts
  END IF;
  ```
  Unauthorized callers querying another user's request UUID receive `NULL` or `0`, completely preventing UUID enumeration while preserving legitimate `UPDATE` evaluations for the request's patient and attending hospital. Service-role bypass is explicitly preserved.

### 2. Anonymous Hospital Directory SELECT
- **Vulnerability:** Evaluating `OR public.is_admin()` inside the `public.hospitals` SELECT policy caused permission errors for `anon` users because `anon` does not have EXECUTE privileges on `is_admin()`.
- **Correction:** Rewrote the policy to evaluate `is_verified = TRUE` first, and only invoke `auth.uid()` and `is_admin()` when the caller is authenticated:
  ```sql
  CREATE POLICY "hospitals_select_verified_or_owner" ON public.hospitals
      FOR SELECT USING (
          is_verified = TRUE 
          OR (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_admin()))
      );
  ```
  Anonymous users can cleanly select verified medical facilities without triggering internal helper functions.

### 3. Blood Request Ownership Immutability
- **Vulnerability:** While patients could not reassign `patient_id`, a verified hospital updating a request could have inadvertently or maliciously altered `patient_id` during a verification/fulfillment update.
- **Correction:** Hardened the hospital branch of `blood_requests_update_authorized`:
  ```sql
  OR (public.is_verified_hospital() 
      AND hospital_id = public.get_hospital_id_for_user(auth.uid())
      AND patient_id = public.get_request_patient_id(id))
  ```
  Both patients and attending hospitals are strictly prevented from reassigning `patient_id`. Only an active administrator can change ownership.

### 4. Notification Field Immutability Trigger (`IS DISTINCT FROM`)
- **Vulnerability:** Standard equality operators (`<>` or `!=`) fail to detect modifications involving `NULL` values (e.g., transition between `NULL` and a string).
- **Correction:** Updated `trg_enforce_notification_immutability` to use `IS DISTINCT FROM` across all protected columns (`recipient_id`, `title`, `message`, `notification_type`, `reference_request_id`, `created_at`). Recipients can only toggle `is_read`.

---

## 2. Inventory of Helper Functions and Policies

### Helper Functions (13 Total)
1. `public.get_auth_user_role()`
2. `public.is_admin()`
3. `public.is_verified_hospital()`
4. `public.get_donor_id_for_user(lookup_user_id UUID)`
5. `public.get_hospital_id_for_user(lookup_user_id UUID)`
6. `public.get_hospital_is_verified(lookup_hosp_id UUID)`
7. `public.get_hospital_user_id(lookup_hosp_id UUID)`
8. `public.get_donor_is_verified(lookup_donor_id UUID)`
9. `public.get_donor_total_donations(lookup_donor_id UUID)`
10. `public.get_request_verification_status(lookup_req_id UUID)`
11. `public.get_request_patient_id(lookup_req_id UUID)`
12. `public.get_request_hospital_id(lookup_req_id UUID)`
13. `public.get_request_units_fulfilled(lookup_req_id UUID)`

### Actual RLS Policy Count (Exactly 36 Policies)
4 policies per table (SELECT, INSERT, UPDATE, DELETE) across all 9 relational tables:
- `users`: 4 policies
- `donor_profiles`: 4 policies
- `hospitals`: 4 policies
- `blood_requests`: 4 policies
- `donor_responses`: 4 policies
- `notifications`: 4 policies
- `donation_history`: 4 policies
- `verification_records`: 4 policies
- `audit_logs`: 4 policies
- **Total: 36 Policies**
