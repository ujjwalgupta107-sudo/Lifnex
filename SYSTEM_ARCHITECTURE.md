# LIFNEX — SYSTEM ARCHITECTURE SPECIFICATION

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Document Stage:** Phase 1 — Complete Project Planning & System Design  
**Architecture Pattern:** Modular Monolithic Backend with Decoupled Single-Page Client

---

## 1. Architectural Philosophy

Lifnex uses a **Modular Monolith** pattern:
- **Presentation Layer**: Static Vanilla HTML5, CSS3, and ES6 JavaScript served directly or via Flask static routes, eliminating heavy client-side bundlers.
- **Application Services Layer (Flask REST API)**: Clean, testable Python Flask blueprints orchestrating business logic, AI interactions, distance calculations, and authorization.
- **Data & Realtime Layer (Supabase)**: High-performance PostgreSQL database, managed identity (Supabase Auth), Row Level Security (RLS), real-time WebSockets, and file storage.
- **External AI & Geodata Engines**: Google Gemini API for intelligent parsing/triage, OpenStreetMap and Leaflet.js for mapping.

```mermaid
graph TD
    subgraph ClientLayer["Frontend Layer (HTML5 / CSS3 / Vanilla JS)"]
        Landing["Landing Page & Hero"]
        PatientUI["Patient Request & Tracker"]
        DonorUI["Donor Discovery & Responses"]
        HospitalUI["Hospital Coordination Center"]
        AdminUI["Admin Analytics & Logs"]
        MapEngine["Leaflet.js + OpenStreetMap"]
        Charts["Chart.js Analytics"]
    end

    subgraph BackendLayer["Flask Backend (Python 3.10+)"]
        API_GW["Flask Blueprint API Router"]
        AuthMiddleware["JWT Authentication Guard"]
        MatchEngine["Matching & Haversine Service"]
        CoordService["Request & Hospital Coordinator"]
        GeminiService["Gemini AI Service"]
        AuditService["Audit Logger Service"]
    end

    subgraph SupabasePlatform["Supabase Cloud Platform (LifnexDB)"]
        SupaAuth["Supabase Auth (GoTrue)"]
        PG_DB[("PostgreSQL 15 (Tables + RLS)")]
        SupaRT["Supabase Realtime (WebSockets)"]
        SupaStorage["Supabase Storage (Prescriptions/IDs)"]
    end

    subgraph ExternalServices["External AI & Geodata Services"]
        GeminiAPI["Google Gemini 1.5 / Flash API"]
        OSM_Tiles["OpenStreetMap Tile Server"]
    end

    %% Client Interactions
    ClientLayer -->|HTTPS REST JSON Requests| API_GW
    ClientLayer -->|Direct Auth Session Verification| SupaAuth
    ClientLayer -->|WebSocket Realtime Subscription| SupaRT
    ClientLayer -->|Map Tiles Fetch| OSM_Tiles

    %% Backend Routing & Business Logic
    API_GW --> AuthMiddleware
    AuthMiddleware --> MatchEngine
    AuthMiddleware --> CoordService
    AuthMiddleware --> GeminiService
    AuthMiddleware --> AuditService

    %% Backend to Supabase Interactions
    MatchEngine -->|PostgREST / psycopg3| PG_DB
    CoordService -->|State Transitions & Checks| PG_DB
    CoordService -->|Prescription Storage Check| SupaStorage
    AuditService -->|Write Immutable Audit Logs| PG_DB

    %% External Connections
    GeminiService -->|HTTPS Prompt & Payload| GeminiAPI
```

---

## 2. Layered Component Responsibilities

### 2.1 Frontend Presentation Layer (Vanilla Web Stack)
- **Technology**: Native HTML5, modern modular CSS3, Vanilla ES6 JavaScript (Fetch API, DOM manipulation).
- **Zero-Build Architecture**: Runs in any modern browser without Webpack, Vite, or Node.js runtime dependencies on the client side.
- **Leaflet.js & OpenStreetMap**: Interactive map rendering, marker clustering for donors and hospitals, radius overlays.
- **Chart.js**: Dynamic visual dashboards for blood inventory, request trends, and donor demographics.

### 2.2 Flask Application Service Layer (Backend REST API)
- **Blueprints**:
  - `auth_bp`: Token validation helper, user registration profile synchronizer.
  - `requests_bp`: Emergency blood request creation, listing, status updates, and tracking.
  - `donors_bp`: Donor profile management, availability toggle, and response submission.
  - `matching_bp`: Blood compatibility matrix and Haversine distance ranking algorithms.
  - `hospitals_bp`: Hospital directory, inventory status, and verification actions.
  - `ai_bp`: Interface with Google Gemini API for intelligent medical request structuring and donor advisory.
  - `admin_bp`: Audit log review, user management, and system-wide metrics.

### 2.3 Data, Auth, and Storage Layer (Supabase Platform)
- **PostgreSQL 15**: ACID-compliant relational storage with custom constraints, triggers, and indexes.
- **Row Level Security (RLS)**: Enforces table-level and row-level authorization directly in the database engine.
- **Supabase Realtime**: Listens to PostgreSQL `WAL` (Write-Ahead Logging) to broadcast `INSERT` and `UPDATE` events to connected frontend clients instantaneously.
- **Supabase Storage**: Secure buckets for medical prescriptions, identity verifications, and hospital license documents.

---

## 3. Data Flow Architectures

### 3.1 Emergency Request Submission & Donor Notification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient / Attending Family
    participant Web as Web Frontend (Vanilla JS)
    participant Flask as Flask API (requests_bp)
    participant Gemini as Google Gemini AI
    participant DB as Supabase PostgreSQL
    participant Realtime as Supabase Realtime
    actor Donor as Matched Voluntary Donor

    Patient->>Web: Fill Emergency Blood Request Form
    Web->>Flask: POST /api/v1/requests (with Auth Bearer Token)
    Flask->>Gemini: Validate & structure triage details
    Gemini-->>Flask: Structured triage summary
    Flask->>DB: INSERT into blood_requests (status='open')
    DB-->>Flask: blood_request record created (UUID)
    Flask->>DB: Execute matching query (compatible blood group + within radius)
    DB-->>Flask: List of eligible donor IDs
    Flask->>DB: INSERT into notifications (donor_ids, request_id)
    DB->>Realtime: Publish 'NEW_BLOOD_REQUEST' event
    Realtime-->>Donor: Push instant alert on Donor UI / Map
    Flask-->>Web: 201 Created (request tracking details)
```

### 3.2 Donor Response & Hospital Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Donor as Voluntary Donor
    participant Web as Donor Interface
    participant Flask as Flask API (donors_bp)
    participant DB as Supabase PostgreSQL
    participant Realtime as Supabase Realtime
    actor Hospital as Hospital Coordinator

    Donor->>Web: Click 'Accept Request' (ETA: 30 mins)
    Web->>Flask: POST /api/v1/donors/respond (status='accepted', eta=30)
    Flask->>DB: INSERT into donor_responses & UPDATE blood_requests count
    DB->>Realtime: Broadcast 'DONOR_ACCEPTED'
    Realtime-->>Hospital: Hospital Dashboard receives incoming donor alert
    Note over Donor,Hospital: Donor travels to hospital & donates
    Hospital->>Flask: POST /api/v1/hospitals/confirm-donation
    Flask->>DB: INSERT into donation_history & UPDATE donor_profile (cooldown 90 days)
    DB-->>Hospital: Confirmation recorded successfully
```

---

## 4. Deployment Topology (Render & Supabase Cloud)

```mermaid
graph LR
    subgraph Users["End Users"]
        U1["Desktop Users"]
        U2["Mobile Users"]
    end

    subgraph RenderPlatform["Render Cloud PaaS"]
        WebWorker["Flask Gunicorn Server (Python 3.10+)"]
        StaticRouter["Static Assets Router (/frontend)"]
    end

    subgraph SupabaseCloud["Supabase Managed Cloud"]
        SupaPostgres[("LifnexDB (PostgreSQL 15)")]
        SupaAuthService["Supabase Auth GoTrue"]
        SupaWS["Supabase Realtime WebSockets"]
    end

    subgraph GoogleCloud["Google AI Platform"]
        GeminiREST["Gemini API Endpoint"]
    end

    Users -->|HTTPS / WSS| RenderPlatform
    Users -->|WSS Realtime Subscriptions| SupaWS
    WebWorker -->|Connection Pooling| SupaPostgres
    WebWorker -->|HTTPS API Requests| GeminiREST
    WebWorker -->|Admin JWT Verify| SupaAuthService
```

