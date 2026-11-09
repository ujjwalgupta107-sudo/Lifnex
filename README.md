# Lifnex — Connecting Lives When Every Second Matters

[![CI Tests](https://img.shields.io/badge/pytest-56%20passed-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/python-3.11-blue.svg)]()
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL%2015-emerald.svg)]()
[![AI](https://img.shields.io/badge/Gemini-2.5--Flash-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

> **Lifnex** is an emergency blood donor coordination platform combining geospatial proximity matching, Supabase PostgreSQL with strict Row-Level Security, Google Gemini AI triage assistance, and real-time response synchronization to eliminate critical dispatch delays.

---

## 🚀 Key Features

- **🚨 Emergency Requisitions:** Real-time blood requests with ABO/Rh group filtering, required units, and urgency levels (Critical, High, Normal).
- **🩸 Intelligent Matching Engine:** Great-circle Haversine distance proximity calculation, donor availability enforcement, travel radius adherence, and composite urgency/distance ranking.
- **🤖 Gemini AI Assistance:**
  - Clinical request triage and automated parameter extraction.
  - Emergency dispatch summary generation.
  - Educational donor guidance with mandatory clinical boundary advisories.
  - Admin operational insights and high-demand blood group trend analytics.
- **📍 Privacy-Preserving Geospatial Discovery:**
  - Integrated Leaflet.js and OpenStreetMap visualizer.
  - Approximate donor location blurring (~500m radius) to prevent tracking.
  - Hospital cold storage stock and direct turn-by-turn routing navigation links.
- **⚡ Real-Time Coordination:** Live Supabase Realtime subscriptions for instantaneous donor dispatch notifications and request feed updates.
- **🛡️ Enterprise Database Security:** PostgreSQL 15 schema with 36 Row-Level Security (RLS) policies, immutable audit logging, and role-based permissions (`patient`, `donor`, `hospital`, `admin`).

---

## 📁 Repository Structure

```
Lifnex/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Legacy compatibility endpoints
│   │   ├── core/            # Configuration & clients
│   │   ├── routes/          # REST API routes (auth, blood_requests, donors, ai, notifications)
│   │   ├── services/        # Matching, notification, audit, and Gemini AI services
│   │   ├── utils/           # Auth guards, geo calculations, and audit loggers
│   │   └── validators/      # Pydantic data schemas
│   ├── migrations/          # Canonical SQL migrations (001_initial_schema, 002_security_hardening)
│   └── tests/               # 56 automated unit, integration, and E2E tests
├── frontend/                # Vanilla HTML5 / CSS3 / JavaScript frontend
│   ├── static/js/           # Maps (Leaflet), Realtime, Dashboards, Auth
│   └── *.html               # Dashboards & public portal pages
├── docs/                    # Architectural plans, threat models, API and deployment guides
├── render.yaml              # Render blueprint for zero-downtime deployment
├── run.py                   # Flask server entrypoint
└── requirements.txt         # Production dependencies
```

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Virtual Environment tool (`venv`)
- Supabase Project or local PostgreSQL 15 instance

### 2. Environment Configuration
Copy `.env.example` to `backend/.env`:
```powershell
cp .env.example backend/.env
```
Populate `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `GEMINI_API_KEY`.

### 3. Installation
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Running the Test Suite
```powershell
$env:PYTHONPATH="."
.\venv\Scripts\pytest backend/tests -v
```

### 5. Running the Local Backend Server
```powershell
python run.py
```
Backend will be available at `http://localhost:5000`.

---

## 🔒 Security & Privacy Notice
- **Medical Disclaimer:** Lifnex does not diagnose medical conditions or certify biological donor compatibility. Clinical cross-matching must be conducted by certified medical personnel before transfusion.
- **Data Privacy:** Exact donor GPS coordinates and personal contact numbers are strictly masked until a donor explicitly accepts a request.

---

## 📄 Documentation Links
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment Runbook](docs/DEPLOYMENT_GUIDE.md)
- [Security Threat Model](SECURITY_THREAT_MODEL.md)
- [Database Schema Reference](docs/DATABASE_SCHEMA_REFERENCE.md)
