# LIFNEX — DATABASE SCHEMA REFERENCE

**Database Engine:** Supabase PostgreSQL 15  
**Project Reference:** LifnexDB (`https://ygbprigcrooveopipkcl.supabase.co`)  
**Architecture:** Third Normal Form (3NF) Relational Model with Row Level Security (RLS)  

---

## 1. Relational Entities Summary

The Lifnex database architecture contains 9 normalized tables:

1. **`users`**:
   - `id (UUID)`: Primary key, linked 1:1 to `auth.users(id)`.
   - `email (VARCHAR)`: Unique registered user email.
   - `full_name (VARCHAR)`: Legal name or organization display name.
   - `role (VARCHAR)`: Role check `CHECK (role IN ('patient', 'donor', 'hospital', 'admin'))`.
   - `is_active (BOOLEAN)`: Default true.
   - `is_demo (BOOLEAN)`: Synthetic demo flag.

2. **`donor_profiles`**:
   - `id (UUID)`: Primary key (`gen_random_uuid()`).
   - `user_id (UUID)`: Foreign key referencing `users(id)`.
   - `blood_group (VARCHAR)`: `CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))`.
   - `date_of_birth (DATE)`: Clinical age validation.
   - `latitude / longitude (DECIMAL)`: GPS coordinates bounded by valid geographical ranges.
   - `travel_radius_km (INTEGER)`: Alert search radius (1 - 100 km).
   - `availability_status (VARCHAR)`: `available`, `busy`, `inactive`, `cooldown`.
   - `last_donation_date (DATE)`: Date of last confirmed donation.
   - `total_donations (INTEGER)`: Verified donation count.

3. **`hospitals`**:
   - `id (UUID)`: Primary key.
   - `user_id (UUID)`: Reference to `users(id)`.
   - `name (VARCHAR)`: Official medical facility name.
   - `license_number (VARCHAR)`: Unique regulatory registration license.
   - `emergency_phone (VARCHAR)`: 24/7 emergency coordination desk telephone.
   - `has_blood_bank (BOOLEAN)`: Cold-chain blood storage capacity.
   - `current_inventory_status (JSONB)`: Reserve stock level indicators.

4. **`blood_requests`**:
   - `id (UUID)`: Primary key.
   - `patient_id (UUID)`: Reference to `users(id)`.
   - `hospital_id (UUID)`: Reference to `hospitals(id)`.
   - `blood_group (VARCHAR)`: Requisitioned blood type.
   - `units_required (INTEGER)`: Units required (1 - 20).
   - `units_fulfilled (INTEGER)`: Completed donor units.
   - `urgency_level (VARCHAR)`: `normal`, `urgent`, `critical`.
   - `status (VARCHAR)`: `open`, `in_progress`, `fulfilled`, `cancelled`, `expired`.
   - `verification_status (VARCHAR)`: `pending_verification`, `verified`, `rejected`.
   - `required_by (TIMESTAMPTZ)`: Clinical deadline.

5. **`donor_responses`**:
   - `id (UUID)`: Primary key.
   - `request_id (UUID)`: Reference to `blood_requests(id)`.
   - `donor_id (UUID)`: Reference to `donor_profiles(id)`.
   - `response_status (VARCHAR)`: `accepted`, `declined`, `en_route`, `completed`, `cancelled`.
   - `estimated_arrival_minutes (INTEGER)`: Arrival ETA.
   - `UNIQUE (request_id, donor_id)`: Prevents duplicate active responses.

6. **`notifications`**:
   - `id (UUID)`: Primary key.
   - `recipient_id (UUID)`: Reference to `users(id)`.
   - `reference_request_id (UUID)`: Optional reference to `blood_requests(id)`.
   - `title (VARCHAR)`: Notification subject.
   - `message (TEXT)`: Alert details.
   - `notification_type (VARCHAR)`: `emergency_alert`, `response_update`, `verification`, `system`.
   - `is_read (BOOLEAN)`: Status.

7. **`donation_history`**:
   - `id (UUID)`: Primary key.
   - `donor_id (UUID)`: Reference to `donor_profiles(id)`.
   - `hospital_id (UUID)`: Reference to `hospitals(id)`.
   - `request_id (UUID)`: Reference to `blood_requests(id)`.
   - `donation_date (DATE)`: Clinical collection date.
   - `units_donated (INTEGER)`: Units contributed.
   - `verification_certificate_no (VARCHAR)`: Unique certificate serial.

8. **`verification_records`**:
   - `id (UUID)`: Primary key.
   - `target_user_id (UUID)`: Reference to `users(id)`.
   - `verification_type (VARCHAR)`: `hospital_license`, `donor_health_screen`, `medical_request`.
   - `status (VARCHAR)`: `pending`, `approved`, `rejected`.
   - `reviewed_by (UUID)`: Admin reviewer.

9. **`audit_logs`**:
   - `id (UUID)`: Primary key.
   - `actor_id (UUID)`: Acting user UUID.
   - `action (VARCHAR)`: System event identifier (e.g. `REQUEST_CREATED`).
   - `entity_type (VARCHAR)`: Target table name.
   - `entity_id (UUID)`: Target record UUID.
   - `client_ip (INET)`: Origin IP.
   - `old_values / new_values (JSONB)`: Audit state change diffs.

---

## 2. Row Level Security (RLS) Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `users` | Self or Admin | Service Role | Self (excluding role) | Admin only |
| `donor_profiles` | Available Donors (Public) / Self | Self (`user_id = auth.uid()`) | Self | Self / Admin |
| `hospitals` | Public (Verified) | Hospital owner | Hospital owner | Admin only |
| `blood_requests`| Public (Open) / Creator | Authenticated Patient | Creator / Attending Hospital | Admin only |
| `donor_responses`| Participants / Hospital | Matched Donor | Responding Donor | Responding Donor |
| `notifications` | Recipient only | Service Role | Recipient (`is_read`) | Recipient only |
| `donation_history`| Donor / Hospital / Admin | Hospital / Admin | Admin only | Admin only |
| `verification_records` | Target User / Admin | Target User / System | Admin only | Admin only |
| `audit_logs` | Admin only | Service Role | **BLOCKED (false)** | **BLOCKED (false)** |

