# Lifnex — Database Architecture & ER Specification

> **Engine:** Supabase PostgreSQL 15+  
> **Migration Scripts:** `backend/migrations/001_initial_schema.sql` and `backend/migrations/002_security_hardening.sql`

---

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| USERS : "1:1 id -> auth.users(id)"
    USERS ||--o| DONOR_PROFILES : "1:1 user_id"
    USERS ||--o| HOSPITALS : "1:1 user_id"
    USERS ||--o{ BLOOD_REQUESTS : "1:N patient_id"
    HOSPITALS ||--o{ BLOOD_REQUESTS : "1:N hospital_id"
    BLOOD_REQUESTS ||--o{ DONOR_RESPONSES : "1:N request_id"
    DONOR_PROFILES ||--o{ DONOR_RESPONSES : "1:N donor_id"
    USERS ||--o{ NOTIFICATIONS : "1:N recipient_id"
    BLOOD_REQUESTS ||--o{ NOTIFICATIONS : "1:N reference_request_id"
    DONOR_PROFILES ||--o{ DONATION_HISTORY : "1:N donor_id"
    HOSPITALS ||--o{ DONATION_HISTORY : "1:N hospital_id"
    BLOOD_REQUESTS ||--o{ DONATION_HISTORY : "1:N request_id"
    USERS ||--o{ VERIFICATION_RECORDS : "1:N target_user_id"
    USERS ||--o{ VERIFICATION_RECORDS : "1:N reviewed_by"
    USERS ||--o{ AUDIT_LOGS : "1:N actor_id"

    USERS {
        uuid id PK
        varchar email UK
        varchar full_name
        varchar phone_number
        varchar role
        boolean is_active
        boolean is_demo
        timestamptz created_at
    }
    DONOR_PROFILES {
        uuid id PK
        uuid user_id FK
        varchar blood_group
        date date_of_birth
        decimal latitude
        decimal longitude
        varchar city
        integer travel_radius_km
        varchar availability_status
        boolean is_verified
    }
    HOSPITALS {
        uuid id PK
        uuid user_id FK
        varchar name
        varchar license_number UK
        text address
        varchar city
        decimal latitude
        decimal longitude
        boolean is_verified
        jsonb current_inventory_status
    }
    BLOOD_REQUESTS {
        uuid id PK
        uuid patient_id FK
        uuid hospital_id FK
        varchar blood_group
        integer units_required
        integer units_fulfilled
        varchar urgency_level
        varchar status
        varchar verification_status
        timestamptz required_by
        boolean is_demo
    }
    DONOR_RESPONSES {
        uuid id PK
        uuid request_id FK
        uuid donor_id FK
        varchar response_status
        integer estimated_arrival_minutes
        timestamptz responded_at
    }
    NOTIFICATIONS {
        uuid id PK
        uuid recipient_id FK
        uuid reference_request_id FK
        varchar title
        text message
        varchar notification_type
        boolean is_read
    }
    DONATION_HISTORY {
        uuid id PK
        uuid donor_id FK
        uuid hospital_id FK
        uuid request_id FK
        date donation_date
        integer units_donated
        varchar verification_certificate_no UK
    }
    VERIFICATION_RECORDS {
        uuid id PK
        uuid target_user_id FK
        varchar verification_type
        varchar status
        uuid reviewed_by FK
    }
    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        varchar action
        varchar entity_type
        uuid entity_id
        inet client_ip
        jsonb old_values
        jsonb new_values
    }
```

---

## 2. Table Definitions (9 Core Tables)

| Table | Primary Key | Foreign Keys | Key Constraints & Checks |
|---|---|---|---|
| `public.users` | `id` (`UUID`) | `auth.users(id)` `ON DELETE CASCADE` | `email` UNIQUE; `role IN ('patient','donor','hospital','admin')` |
| `public.donor_profiles` | `id` (`UUID`) | `users(id)` UNIQUE `ON DELETE CASCADE` | `blood_group` 8 ABO/Rh values; `travel_radius_km BETWEEN 1 AND 100`; `availability_status IN ('available','busy','inactive','cooldown')` |
| `public.hospitals` | `id` (`UUID`) | `users(id)` UNIQUE `ON DELETE CASCADE` | `license_number` UNIQUE; `jsonb_typeof(current_inventory_status) = 'object'` |
| `public.blood_requests` | `id` (`UUID`) | `users(id)` (`patient_id`), `hospitals(id)` (`hospital_id` `RESTRICT`) | `units_required BETWEEN 1 AND 20`; `units_fulfilled <= units_required`; `urgency_level IN ('normal','urgent','critical')` |
| `public.donor_responses` | `id` (`UUID`) | `blood_requests(id)` `CASCADE`, `donor_profiles(id)` `CASCADE` | `UNIQUE (request_id, donor_id)` prevents duplicate handshakes; `estimated_arrival_minutes >= 0` |
| `public.notifications` | `id` (`UUID`) | `users(id)` (`recipient_id`), `blood_requests(id)` `SET NULL` | `notification_type IN ('emergency_alert','response_update','verification','system')` |
| `public.donation_history` | `id` (`UUID`) | `donor_profiles(id)` `RESTRICT`, `hospitals(id)` `RESTRICT`, `blood_requests(id)` `SET NULL` | `verification_certificate_no` UNIQUE; `units_donated > 0` |
| `public.verification_records` | `id` (`UUID`) | `users(id)` (`target_user_id`), `users(id)` (`reviewed_by` `SET NULL`) | `verification_type IN ('hospital_license','donor_health_screen','medical_request')` |
| `public.audit_logs` | `id` (`UUID`) | `users(id)` (`actor_id` `SET NULL`) | Append-only JSONB `old_values`/`new_values` with `INET client_ip` |

---

## 3. Indexing Strategy (`001_initial_schema.sql`)

- **Composite Matching Indexes:** `idx_donors_matching (blood_group, availability_status, last_donation_date)` and `idx_donors_city_blood_availability (city, blood_group, availability_status)`.
- **Geospatial Coordinate Indexes:** `idx_donors_coords (latitude, longitude)` and `idx_hospitals_coords (latitude, longitude)`.
- **Request Queue Indexes:** `idx_requests_status_urgency (status, urgency_level, blood_group)` and partial index `idx_requests_required_by (required_by) WHERE status IN ('open', 'in_progress')`.
- **Notification & Audit Indexes:** `idx_notifications_recipient_read (recipient_id, is_read)` and `idx_audit_created (created_at DESC)`.

---

## 4. Row-Level Security (RLS) Design

- **Fail-Closed Base (`001_initial_schema.sql`):** Enables `ROW LEVEL SECURITY` on all 9 tables and executes `REVOKE ALL ON TABLE ... FROM anon, authenticated;` so no data is exposed prior to policy installation.
- **Security Hardening (`002_security_hardening.sql`):** Installs `SECURITY DEFINER` helper functions (`get_auth_user_role()`, `is_admin()`, `is_verified_hospital()`, etc.) pinned to `SET search_path = public, pg_temp` with `PUBLIC` execution revoked, enforcing strict ownership and role-based read/write isolation at the PostgreSQL layer.
