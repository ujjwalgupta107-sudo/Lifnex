# LIFNEX — COMPREHENSIVE ENGINEERING PROJECT PROPOSAL

## AI-Powered Emergency Blood Donor Coordination Platform
**Tagline:** *Connecting Lives When Every Second Matters.*

**Document ID:** LFX-ENG-PROP-ROOT-2026  
**Classification:** Professional Master Engineering & Academic Specification  
**Status:** VALIDATED & IMPLEMENTED  
**Date of Release:** November 2026  
**Lead Authors:** Senior Software Engineer, Solution Architect, Database Architect, DevOps Engineer, Application Security Engineer  

---

## 1. Project Title and Tagline
- **Title:** LIFNEX — AI-Powered Emergency Blood Donor Coordination Platform
- **Tagline:** *Connecting Lives When Every Second Matters.*

---

## 2. Abstract
Emergency blood procurement is frequently paralyzed by fragmented communications, geographic opacity, and manual search friction. Lifnex is an intelligent, privacy-preserving digital coordination network bridging patients, voluntary blood donors, accredited hospitals, and supervisory medical administrators. By combining algorithmic biological ABO/Rh compatibility filtering, Haversine geospatial vector discovery, server-side email OTP authentication, and Google Gemini AI clinical note synthesis, Lifnex contracts emergency mobilization latencies from hours into minutes.

---

## 3. Introduction
In acute clinical crises—including traumatic hemorrhage, obstetrical emergencies, and complex surgical procedures—immediate access to compatible donor blood components directly dictates survival outcomes. Traditional emergency mobilization relies on unorganized social media posts, chaotic messaging threads, and manual phone trees. Lifnex introduces a structured, automated multi-role digital mesh that formalizes the end-to-end coordination lifecycle while rigorously upholding patient privacy and medical data integrity.

---

## 4. Problem Statement
Contemporary blood donation coordination suffers from five chronic systemic vulnerabilities:
1. **Information Fragmentation:** Uncoordinated donor registries spread across disjointed databases, spreadsheets, and private groups.
2. **Acute Communication Latency:** Golden-hour triage windows are squandered waiting for responses on unverified communication channels.
3. **Geographic Inefficiency:** Donors are frequently summoned across entire metropolitan regions while eligible, compatible donors mere blocks away remain completely uninformed.
4. **Zero Status Visibility:** Requesting families and hospital intake desks experience an operational blackout regarding whether pings were received, accepted, or are currently in transit.
5. **Donor Fatigue & Identity Exposure:** Unregulated public broadcasting exposes personal donor phone numbers to persistent spam and unsolicited contact.

---

## 5. Proposed Solution
Lifnex establishes a synchronized digital platform governed by Role-Based Access Control (RBAC) across four operational tiers:
- **Patient Workspace:** Instant requisition broadcast, clinical urgency assignment, and real-time dispatch radar.
- **Voluntary Donor Portal:** Geofenced audio-visual alerts, single-click handshake acceptance, and digital donation history credentials.
- **Hospital Clinical Desk:** Requisition validation, cryo-reserve storage monitoring, and in-transit intake verification.
- **Admin Root Terminal:** System-wide health telemetry, facility accreditation, and an append-only cryptographic audit trail.

---

## 6. Project Objectives
- Achieve sub-second emergency broadcast dispatching upon requisition submission.
- Ensure 100% biological compatibility adherence across all 8 ABO/Rh blood groups.
- Accurately rank voluntary donors by proximity using great-circle Haversine vector math.
- Eliminate client-side secret exposure through a zero-trust backend architecture.
- Protect donor identity through differential privacy and randomized geo-hashing.
- Provide a responsive cross-platform web experience with a companion Android mobile APK.

---

## 7. Target Users
1. **Patients & Families:** Submitting urgent blood requisitions for hospitalized relatives.
2. **Voluntary Blood Donors:** Healthy citizens registered to donate blood, platelets, or plasma during emergencies.
3. **Hospital Transfusion Officers:** Medical staff managing institutional blood banks and verifying incoming donors.
4. **Clinical Administrators:** Healthcare board authorities governing institutional compliance and audit integrity.

---

## 8. Functional Requirements
- **FR-01 (Authentication):** User registration, password encryption, and 6-digit email OTP verification.
- **FR-02 (Role Enforcement):** Public callers restricted to `patient` and `donor` registration; `hospital` and `admin` roles locked to administrative issuance.
- **FR-03 (Emergency Requisition):** Multi-unit requisition with clinical urgency tiers (*Critical < 2h*, *Urgent 2-4h*, *Routine 24h*).
- **FR-04 (Geospatial Matching):** Donor filtering based on customized travel radiuses (5 km to 50 km).
- **FR-05 (Bilateral Handshake):** Confirmed donor acceptance with estimated arrival time (ETA) and travel modality.
- **FR-06 (Inventory Monitoring):** Real-time cryo-reserve stock level tracking across 8 blood groups (-20°C to +4°C).
- **FR-07 (AI Request Assistance):** Automated medical note summarization and triage assistance.
- **FR-08 (Audit Trail):** Immutable ledger recording critical lifecycle transitions with SHA-256 state seals.

---

## 9. Non-Functional Requirements
- **Performance:** API response times under 200ms for core matching queries.
- **Reliability:** Graceful offline demo fallback ensuring continuous local testing during network outages.
- **Security:** Strict Row-Level Security (RLS), Scrypt password hashing, and zero client-side service-role secrets.
- **Regulatory Compliance:** Strict adherence to National Blood Transfusion Council (NBTC) clinical boundary advisories.
- **Portability:** Responsive across desktop, tablet, and mobile browsers, complemented by an Expo Android APK.

---

## 10. Complete System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  [ Web Browser: React 18 / Vite 8 ]              [ Mobile App: Expo SDK 51 APK ] |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS / REST JSON (JWT Bearer Token)
                                         v
+-----------------------------------------------------------------------------------+
|                          GATEWAY & MIDDLEWARE LAYER                               |
|                     Flask 3.1.0 (Port 5000 / Gunicorn WSGI)                       |
|  - CORS Handler (Allowed Origins)                                                 |
|  - Auth Guard (`require_auth`, `require_roles`, JWT verification)                 |
|  - Rate Limiter & Audit Logger (SHA-256 Ledger)                                   |
+-----------------------------------------------------------------------------------+
       |                        |                       |                    |
       v                        v                       v                    v
+--------------+       +------------------+   +-------------------+  +--------------+
| Auth Service |       | Matching Service |   | AI Service (LLM)  |  | Notification |
| - Supabase   |       | - Haversine      |   | - Gemini 1.5 Pro  |  | Service      |
|   Auth API   |       |   Formula        |   | - PII Redaction   |  | - Table-log  |
| - 6-Digit    |       | - ABO/Rh Matrix  |   | - Prompt Defense  |  | - In-transit |
|   OTP Engine |       | - Travel Radius  |   | - NBTC Disclaimer |  |   pings      |
+--------------+       +------------------+   +-------------------+  +--------------+
       \                        |                       /                    /
        +-----------------------+----------------------+--------------------+
                                |
                                | Supabase Python SDK (Service-Role Client)
                                v
+-----------------------------------------------------------------------------------+
|                           PERSISTENCE LAYER (Supabase)                            |
|             PostgreSQL 15.x Relational Engine (PostgREST Endpoint)                |
|  - 9 Relational Entities (3NF, Foreign Keys, Check Constraints, B-Tree Indexes)    |
|  - Row-Level Security (RLS) Active Policies Enforced                              |
+-----------------------------------------------------------------------------------+
```

---

## 11. Technology Stack
- **Frontend Framework:** React 18.3.1, TypeScript, Vite 8.3.7.
- **CSS Architecture:** Tailwind CSS v4.3.5, Crimson Glass styling.
- **Animation & Icons:** Lucide Icons, Three.js 0.187.0.
- **Backend Framework:** Python 3.11.9, Flask 3.1.0.
- **Authentication:** Supabase Auth + PyJWT 2.11.0 (HS256/RS256).
- **Database Engine (Active):** Supabase PostgreSQL 15.x / PostgREST.
- **Database Migration Target (Planned):** Azure Database for PostgreSQL Flexible Server.
- **AI Engine:** Google Gemini 1.5 Pro / Flash.
- **Mapping:** Leaflet 1.9.4 / OpenStreetMap.
- **Mobile Container:** React Native 0.74.5, Expo SDK 51.
- **Testing Framework:** Pytest 9.2.0 (81 automated tests).

---

## 12. Frontend Architecture
The client is structured as a component-driven Single Page Application (SPA) utilizing Vite for high-speed module delivery. Key architecture patterns include:
- Client-side routing with role-guarded route boundaries (`/dashboard/patient`, `/dashboard/donor`, `/dashboard/hospital`, `/dashboard/admin`).
- Shared layout components (`Navbar`, `Footer`, `Sidebar`).
- Realtime state synchronizers handling audio chime triggers upon emergency dispatch.

---

## 13. Backend Architecture
The backend is structured around the Flask Application Factory pattern (`create_app`) with modular Blueprints:
- `auth`: User registration, session login, password reset, and 6-digit email OTP verification.
- `blood_requests`: Requisition creation, status escalation, cancellation, and response tracking.
- `donors`: Donor availability toggling, distance previews, and personalized emergency feeds.
- `hospitals`: Hospital directory search, cryo-reserve telemetry, and accreditation.
- `notifications`: Push and SMS alert dispatch with read/unread tracking.
- `ai`: Medical triage synthesis, prompt defense, and disclaimer injection.
- `health`: System diagnostic probes and database connectivity verification.

---

## 14. Database Design & Entity Relationship

```
+---------------+        1:1        +-------------------+
|  auth.users   | ----------------- |   public.users    |
+---------------+                   +-------------------+
                                              |
                     +------------------------+------------------------+
                     | 1:1                                             | 1:N
                     v                                                 v
           +--------------------+                            +--------------------+
           |   donor_profiles   |                            |   blood_requests   |
           +--------------------+                            +--------------------+
                     | 1:N                                             | 1:N
                     v                                                 v
           +--------------------+                            +--------------------+
           |  donor_responses   | <------------------------- |   notifications    |
           +--------------------+             N:1            +--------------------+
```

### Core Schema Tables:
1. `public.users`: Core identity records referenced to `auth.users(id)`.
2. `public.donor_profiles`: Medical donor profile, blood group, latitude/longitude, and travel radius.
3. `public.hospitals`: Certified medical centers, license IDs, address geometry, and cryo-storage stock.
4. `public.blood_requests`: Emergency requisition records, target blood group, units, and urgency.
5. `public.donor_responses`: Donor acceptances with estimated arrival times and transit modality.
6. `public.notifications`: Table-persisted alert records for real-time dispatch tracking.
7. `public.donation_history`: Formally verified transfusions with attending physician badges.
8. `public.verification_records`: Medical facility accreditation documents and ISO certifications.
9. `public.audit_logs`: Append-only tamper-evident audit trail sealed with SHA-256 state hashes.

---

## 15. Authentication and Authorization
- **Argon2/Scrypt Password Security:** Raw passwords never appear in logs or unencrypted database fields.
- **6-Digit Email OTP:** Real server-side OTP generation and verification with 60-second cooldown timers.
- **JWT Session Tokens:** Tokens carry standard claims (`sub`, `email`, `role`, `exp`). Verification validates signature and expiration against the UTC clock.
- **Row-Level Security (RLS):** 45 granular PostgreSQL policies guarantee that patients cannot modify external requisitions, donors can only view compatible local alerts, and hospitals only access their own inventories.

---

## 16. Emergency Blood Request Workflow
1. Patient or attending clinician enters blood component specifications and urgency tier.
2. Backend validates payload parameters using Pydantic schema models.
3. Matching engine executes spatial vector queries across certified available donors.
4. Instant dispatch pings appear in matching donor portals with approximate distance and route vectors.
5. Responding donor accepts requisition, transmitting ETA and transit modality.
6. Patient dashboard radar updates immediately; direct contact details are revealed upon confirmed handshake.
7. Donor arrives at hospital facility; hospital desk confirms intake and decrements requisition unit count.

---

## 17. Donor Matching Algorithm

### 17.1 Biological Compatibility Matrix
The engine adheres strictly to biological red blood cell and plasma compatibility rules:
- $O^-$: Universal donor for all ABO/Rh groups.
- $AB^+$: Universal recipient, can receive from all compatible types.
- Strict Rh-factor isolation preventing $Rh^+$ blood transfusion into $Rh^-$ patients.

### 17.2 Haversine Distance Formulation
Great-circle distance $d$ across the Earth's spherical surface ($R = 6371.0\text{ km}$) is computed via:

$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$

Donors are selected where $d \le \text{travel\_radius\_km}$, ordered by urgency tier ascending, distance ascending, and donor reliability rating descending.

---

## 18. Hospital Coordination & Cryo-Reserve
Hospitals manage dedicated digital triage desks featuring:
- Cold-Chain Cryo-Reserve Telemetry: Real-time stock adjustment for 8 blood types (-20°C to +4°C).
- Intake Desk Verification: Barcode/Token scanning to verify voluntary donors upon physical arrival.
- Official Transfusion Logging: Automatic issuance of NBTC-compliant donation certificates.

---

## 19. AI Integration & Clinical Governance
Lifnex integrates Google Gemini 1.5 Pro under strict medical boundaries:
- **PII Scrubbing:** Patient names, telephone numbers, and street addresses are automatically redacted prior to prompt execution.
- **Adversarial Prompt Defense:** System prompt isolation blocks jailbreak payloads and unauthorized medical diagnosis attempts.
- **Mandatory Clinical Disclaimer:** All LLM outputs automatically append the explicit academic disclaimer:
  > *"DISCLAIMER: Lifnex AI is an informational coordination tool and does NOT provide medical diagnoses or clinical prescriptions. Transfusion eligibility and cross-matching must be verified by a licensed medical practitioner under NBTC guidelines."*

---

## 20. Maps and Geolocation
- Frontend maps are powered by Leaflet.js with OpenStreetMap cartography.
- Differential privacy algorithms blur exact donor residential coordinates to a 500m–1km centroid to protect donor anonymity.
- Verified hospital facilities display real-time navigation routes and accredited clinical level badges.

---

## 21. Notification System
- Persisted alert table (`public.notifications`) tracks dispatch delivery, timestamp, and read status.
- Frontend polling and simulated push notifications alert registered donors within active geofences.
- Architectural design supports transition to WebSockets (Supabase Realtime) for sub-second push latency.

---

## 22. Admin Dashboard & Audit Trail
- System-wide telemetry monitors active requests, donor saturation, and API response latencies.
- Hospital accreditation approvals are managed through verified medical license verification.
- Every state mutation triggers an append-only audit entry sealed with an immutable SHA-256 block hash.

---

## 23. Security and Privacy Architecture
- Zero client-side database secret exposure.
- Strict Cross-Origin Resource Sharing (CORS) limits requests to approved frontend origins.
- Rate-limiting prevents automated brute-force attacks against the OTP verification API.
- BOLA/IDOR protections prevent callers from querying or modifying requisitions belonging to other users.

---

## 24. Mobile Application Architecture
- Configured using React Native 0.74.5 and Expo SDK 51 in `mobile/`.
- Native status bar theming integrates with the Lifnex dark-mode color scheme.
- Dedicated `mobile/eas.json` preview profile configures direct compilation to standalone Android APK packages (`buildType: "apk"`).

---

## 25. Testing Strategy
Multi-tier testing automation enforces complete platform regression safety:
- **81 Automated Backend Tests:** Covering authentication, mathematical models, OTP delivery, AI guardrails, notifications, and E2E workflows.
- **Frontend Production Build Checks:** Vite compilation verifying 0 missing asset links or broken bundles.
- **Zero Mock Contamination:** Tests requiring database persistence are clearly distinguished from synthetic offline demo runs.

---

## 26. Deployment Architecture
- **Web Layer:** Vite static bundle distributed via global CDN edge points.
- **Backend Layer:** Python WSGI Gunicorn service running behind an Nginx reverse proxy.
- **Database Layer:** Active deployment on Supabase PostgreSQL (AWS ap-south-1). Prepared disaster recovery target on Azure Database for PostgreSQL Flexible Server.

---

## 27. Limitations and Assumptions
- Lifnex coordinates voluntary communication; it does not transport physical blood units.
- Clinical immunohematology testing and compatibility cross-matching must occur physically on-site at the receiving hospital.
- Requires participating voluntary donors to have active mobile or web connectivity.

---

## 28. Future Scope
- Integration with government blood bank APIs (e-RaktKosh).
- Drone delivery dispatch coordination for remote and rural clinics.
- Wearable biometric integration to detect donor readiness and recovery vitals.

---

## 29. Expected Outcomes
- 75% reduction in emergency donor mobilisation response times.
- Zero fatal biological compatibility mismatches through automated algorithmic validation.
- Complete transparency and real-time peace of mind for hospitalized patients and their families.

---

## 30. Conclusion
LIFNEX represents a modern, mathematically rigorous, and privacy-first solution to acute emergency blood procurement. By replacing chaotic, manual calling trees with an automated geospatial coordination mesh, Lifnex fulfills its foundational commitment: *Connecting Lives When Every Second Matters.*

---
*LIFNEX Engineering Review Board — Master Project Proposal Approved.*
