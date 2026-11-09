# Lifnex — AI-Powered Emergency Blood Donor Coordination Platform
> **Tagline:** Connecting Lives When Every Second Matters.

Lifnex is an intelligent, real-time emergency blood donor coordination platform designed to bridge the critical gap between patients needing blood, nearby voluntary donors, hospitals, and accredited blood banks.

---

## 🚀 Project Overview

- **Core Mission**: Accelerate life-saving voluntary blood donor discovery from hours to minutes using location intelligence, real-time synchronization, and Google Gemini AI-driven assistance.
- **Medical Disclaimer**: Lifnex is strictly a **communication and coordination platform**, NOT a blood bank or clinical laboratory. Biological compatibility and donor eligibility are always confirmed on-site by authorized healthcare professionals.
- **Data Policy**: Synthetic demonstration data only. All demo records, hospitals, and coordinates are simulated for demonstration and academic evaluation.

---

## 🛠️ Mandatory Technology Stack

- **Frontend**: HTML5, Modern CSS3, Vanilla JavaScript (ES6+), Leaflet.js (OpenStreetMap), Chart.js
- **Backend (Planned)**: Python Flask, RESTful APIs, Gunicorn
- **Database & Auth**: Supabase PostgreSQL 15, Supabase Auth, Row Level Security (RLS)
- **Storage & Realtime**: Supabase Storage, Supabase Realtime (WebSockets)
- **AI Engine**: Google Gemini API
- **Deployment**: Render Cloud PaaS
- **Version Control**: Git & GitHub

---

## 📁 Repository Structure

```
Lifnex/
├── demo-assests/                  # Original, immutable branding & UI reference assets
├── frontend/                      # Phase 2 Complete Frontend (12 pages + pure CSS/JS)
│   ├── index.html                 # Landing page & emergency broadcast feed
│   ├── about.html                 # Platform mission, vision & 3 pillars
│   ├── how-it-works.html          # Patient, donor & hospital coordination workflows
│   ├── hospitals.html             # Hospital discovery directory with Leaflet.js map
│   ├── contact.html               # Support & hospital onboarding desk
│   ├── login.html                 # Authentication & portal role selector
│   ├── register.html              # Role-based onboarding with conditional fields
│   ├── forgot-password.html       # Password recovery simulation
│   ├── patient-dashboard.html     # Patient emergency requisition hub & AI triage
│   ├── donor-dashboard.html       # Donor hub, availability toggle & response actions
│   ├── hospital-dashboard.html    # Transfusion desk, arrival queue & inventory meters
│   ├── admin-dashboard.html       # Platform telemetry, Chart.js metrics & audit logs
│   └── static/
│       ├── css/                   # Modular stylesheets (variables, base, components, etc.)
│       ├── js/                    # Modular scripts (auth, dashboards, maps, charts, requests)
│       └── assets/                # Web-ready logo & visuals
├── API_DESIGN_PLAN.md             # REST API specifications (/api/v1/*)
├── ASSET_INVENTORY.md             # Detailed inventory of demo-assests/
├── DATABASE_DESIGN_PLAN.md        # Normalized 3NF PostgreSQL schema & RLS policies
├── DEVELOPMENT_ROADMAP.md         # Nine-phase execution roadmap
├── FRONTEND_PAGE_INVENTORY.md     # Phase 2 frontend page breakdown
├── FRONTEND_TEST_REPORT.md        # Responsive & functional test verification suite
├── PHASE_1_COMPLETION_REPORT.md   # Phase 1 planning completion summary
├── PHASE_2_COMPLETION_REPORT.md   # Phase 2 frontend completion summary
├── PROJECT_OVERVIEW.md            # Platform scope, disclaimer & objectives
├── REQUIREMENTS.md                # Functional & non-functional requirements
├── SECURITY_THREAT_MODEL.md       # STRIDE analysis & OWASP security mitigations
├── SUPABASE_SETUP_GUIDE.md        # Supabase LifnexDB configuration plan
├── SYSTEM_ARCHITECTURE.md         # Architecture diagrams & component flows
└── UI_DESIGN_SYSTEM.md            # Design tokens, color palette & typography
```

---

## 📌 Development Roadmap

- [x] **Phase 1:** Project Planning and System Design
- [x] **Phase 2:** Complete Frontend UI/UX Development
- [ ] **Phase 3:** Flask Backend and Supabase PostgreSQL Integration
- [ ] **Phase 4:** Supabase Authentication and Role-Based Access Control
- [ ] **Phase 5:** Blood Request Management and Donor Matching
- [ ] **Phase 6:** Google Gemini AI Integration
- [ ] **Phase 7:** Maps, Notifications, Storage and Realtime
- [ ] **Phase 8:** Admin Analytics, Database Optimization and Security Audit
- [ ] **Phase 9:** Testing, Deployment, GitHub and Final Documentation

---

## ⚖️ License & Disclaimer

Academic demonstration prototype. Built with pure web standards. All donor and patient details are fictional synthetic records.
