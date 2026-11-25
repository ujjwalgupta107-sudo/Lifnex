# Lifnex — End-to-End System Workflows

---

## 1. User Authentication & Native Supabase OTP Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend (/register, /verify-otp)
    participant API as Flask API (/api/v1/auth)
    participant SupaAuth as Supabase Auth
    participant DB as Supabase PostgreSQL

    User->>FE: Submit Registration (email, password, role)
    FE->>API: POST /api/v1/auth/register
    API->>API: Validate RegisterRequest (block role=admin -> 403)
    API->>SupaAuth: anon.auth.sign_up({ email, password, options })
    SupaAuth-->>User: Send 6-digit {{ .Token }} OTP Email
    API->>DB: Upsert public.users (is_active=false) + donor_profiles
    API-->>FE: 201 Created (otp_required: true)

    User->>FE: Enter 6-digit OTP on /verify-otp
    FE->>API: POST /api/v1/auth/verify-otp
    API->>SupaAuth: anon.auth.verify_otp({ email, token, type: "signup" })
    SupaAuth-->>API: Verified Session + ES256 Access Token
    API->>DB: Update public.users (is_active=true) + log_audit_event
    API-->>FE: 200 OK (user + Bearer access_token)
    FE->>FE: Store token & redirect to /dashboard/<role>
```

---

## 2. Emergency Blood Request & Donor Discovery Flow

```mermaid
flowchart LR
    P["Patient / Hospital"] -->|Submit Requisition| FE["PatientDashboard.tsx"]
    FE -->|POST /api/v1/blood-requests| Auth["@require_auth + @require_roles"]
    Auth --> Val["BloodRequestCreate (Pydantic)"]
    Val -->|Insert status=open| DB[("public.blood_requests")]
    DB --> Audit["log_audit_event(REQUEST_CREATED)"]
    FE -->|GET /blood-requests/id/matching-donors| Match["match_donors_for_request()"]
    Match -->|Filter: available + ABO/Rh + Haversine <= radius| Ranked["Sorted Donor List (km, ETA)"]
    Ranked --> FE
```

---

## 3. Donor Feed & Handshake Response Flow

```mermaid
flowchart LR
    D["Voluntary Donor"] -->|Open Portal| Feed["GET /api/v1/donors/feed"]
    Feed --> Rank["rank_requests_for_donor()<br/>Urgency ASC, Distance ASC"]
    Rank --> D
    D -->|Accept + ETA| Resp["POST /api/v1/donors/respond"]
    Resp --> Dup{"Duplicate check<br/>(request_id, donor_id)"}
    Dup -->|Exists| E409["409 DUPLICATE_RESPONSE"]
    Dup -->|New| Ins["Insert public.donor_responses"]
    Ins --> Notif["notify_patient_of_donor_response()<br/>Insert public.notifications"]
    Ins --> Audit["log_audit_event(DONOR_RESPONDED)"]
```

---

## 4. Hospital Coordination & Accreditation Flow

```mermaid
flowchart LR
    H["Hospital User"] -->|POST /api/v1/hospitals| Reg["Create Facility (is_verified=false)"]
    Admin["Platform Admin"] -->|PATCH /api/v1/hospitals/id/verify| Verify["Set is_verified=true + Audit Log"]
    Verify --> Public["Visible in GET /api/v1/hospitals"]
```

---

## 5. Notification Lifecycle Flow

```mermaid
flowchart LR
    Trigger["Request Created / Donor Responded"] --> Svc["notification_service.py"]
    Svc -->|Insert| DB[("public.notifications")]
    Client["Authenticated User"] -->|GET /api/v1/notifications?unread_only=true| API["notifications_bp"]
    API -->|Filter recipient_id = g.user.id| Client
    Client -->|PATCH /notifications/id/read| Mark["Ownership Check -> is_read=true"]
```
