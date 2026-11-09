# LIFNEX — SYSTEM REQUIREMENTS SPECIFICATION (SRS)

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Document Stage:** Phase 1 — Complete Project Planning & System Design  
**Standard:** IEEE 830-compliant Structure

---

## 1. Functional Requirements

### 1.1 Module 1: User Identity & Profile Management
- **FR-101 (Authentication)**: The platform shall authenticate users using Supabase Auth (Email/Password & JWT sessions).
- **FR-102 (User Roles)**: The system shall support four distinct roles: `patient`, `donor`, `hospital`, and `admin`.
- **FR-103 (Role Assignment)**: User roles shall be strictly enforced via database profiles linked to `auth.users(id)`. Privileged roles (`hospital`, `admin`) cannot be self-selected via frontend inputs.
- **FR-104 (Donor Profile)**: Donors shall record their blood group (A+, A-, B+, B-, AB+, AB-, O+, O-), date of birth, gender, contact number, geographic coordinates (latitude, longitude), and operational radius (km).
- **FR-105 (Availability State)**: Donors shall toggle their availability status between `available`, `busy`, and `inactive`. The system shall automatically switch a donor to `cooldown` for 90 days following a verified donation.
- **FR-106 (Hospital Profile)**: Hospitals and blood banks shall maintain facility name, license number, emergency desk phone, address, coordinates, and contact doctor/coordinator.

### 1.2 Module 2: Blood Request Management
- **FR-201 (Request Creation)**: Patients or attending hospitals shall submit an emergency blood request specifying blood group, units required, hospital ID/name, urgency level (`normal`, `urgent`, `critical`), required date/time, and clinical notes.
- **FR-202 (Request Verification)**: Requests shall support a verification status: `pending_verification`, `verified`, `rejected`, or `auto_verified` (if submitted by an authenticated hospital).
- **FR-203 (Request Lifecycle)**: Requests shall transition through finite states: `open` -> `in_progress` -> `fulfilled` / `cancelled` / `expired`.
- **FR-204 (Request Tracking)**: Patients and hospitals shall track real-time response count, accepted donors, and donation confirmation in a live interface.

### 1.3 Module 3: Proximity-Based Donor Discovery & Matching
- **FR-301 (Compatibility Matrix)**: The system shall calculate biological ABO/Rh compatibility:
  - O- can donate to All.
  - O+ can donate to O+, A+, B+, AB+.
  - A- can donate to A-, A+, AB-, AB+.
  - A+ can donate to A+, AB+.
  - B- can donate to B-, B+, AB-, AB+.
  - B+ can donate to B+, AB+.
  - AB- can donate to AB-, AB+.
  - AB+ can donate to AB+ only.
- **FR-302 (Haversine Distance Engine)**: The system shall compute great-circle distance between donor location and hospital coordinates:
  $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **FR-303 (Donor Filtering)**: The matching engine shall query donors where:
  - Compatible blood group == true
  - Availability == 'available'
  - Last donation date <= (Current Date - 90 days)
  - Distance <= donor search radius (default 15 km)
- **FR-304 (Response Handling)**: Matched donors shall receive notifications and submit an explicit response: `accepted` or `declined` with estimated arrival time.

### 1.4 Module 4: Hospital & Blood Bank Coordination
- **FR-401 (Coordination Dashboard)**: Hospitals shall monitor incoming donor arrivals for verified cases.
- **FR-402 (Donation Confirmation)**: Hospital personnel shall confirm when an accepted donor completes the donation, updating `donation_history` and setting donor cooldown.
- **FR-403 (Inventory Oversight)**: Hospitals shall broadcast urgent facility shortages to nearby verified donors.

### 1.5 Module 5: Google Gemini AI Integration
- **FR-501 (Emergency Triage Assistant)**: Gemini AI shall review unformatted user descriptions and extract structured blood request parameters (group, units, urgency).
- **FR-502 (Donor Guidance & Compatibility Explainer)**: Gemini AI shall explain blood group compatibility nuances and preparation guidelines (hydration, sleep, dietary precautions) to prospective donors.
- **FR-503 (Synthetic Predictive Analytics)**: Gemini AI shall summarize simulated emergency patterns and supply deficits for administrator reports.

### 1.6 Module 6: Maps & Realtime Visualization
- **FR-601 (OpenStreetMap & Leaflet Display)**: Interactive map showing hospital locations, emergency zones, and donor response clusters.
- **FR-602 (Realtime Events)**: Supabase Realtime channels shall deliver instant push events on request state changes, donor responses, and emergency alerts without polling.

### 1.7 Module 7: Administrative Governance & Audit Logs
- **FR-701 (User Management)**: Admins can activate, suspend, or verify hospital and user accounts.
- **FR-702 (Audit Trail)**: The system shall log all security-relevant events (logins, role alterations, request status overrides) with actor UUID, IP, and timestamp.
- **FR-703 (Analytics Dashboard)**: Chart.js visualizations displaying monthly request volume, fulfillment ratios, donor blood group distribution, and response time metrics.

---

## 2. Non-Functional Requirements (NFRs)

| ID | Category | Requirement Description | Target Metric |
|---|---|---|---|
| **NFR-01** | **Performance** | API response time for request matching under standard load | < 250 ms |
| **NFR-02** | **Latency** | Real-time push notification latency via Supabase WebSocket | < 1.0 s |
| **NFR-03** | **Security** | Row Level Security (RLS) enforcement on all public tables | 100% tables protected |
| **NFR-04** | **Data Protection** | Donor telephone numbers & precise GPS shielded until response accept | Anonymized until consent |
| **NFR-05** | **Availability** | Web uptime on deployment target (Render free/starter tier) | 99.5% uptime |
| **NFR-06** | **Usability** | Emergency request creation flow completion | < 4 clicks / 60 seconds |
| **NFR-07** | **Compatibility** | Cross-browser compatibility (Chrome, Firefox, Safari, Edge) | Modern standards (ES6+) |
| **NFR-08** | **Zero-Azure** | Prohibition of Azure dependencies | Zero Azure references in code |

---

## 3. Data Integrity & Validation Rules

1. **Blood Group Enum**: Restrict strictly to `['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']`.
2. **Urgency Levels**: Restrict to `['normal', 'urgent', 'critical']`.
3. **Coordinates Range**: Latitude `[-90.000000, 90.000000]`, Longitude `[-180.000000, 180.000000]`.
4. **Units Required**: Integer between `1` and `20` per individual emergency broadcast.
5. **Cooldown Policy**: Minimum 90 days (12 weeks) between consecutive blood donations for standard red blood cell donations.

