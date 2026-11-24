# LIFNEX — Connecting Lives When Every Second Matters

[![CI Tests](https://img.shields.io/badge/pytest-94%20passed-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/python-3.11.9-blue.svg)]()
[![Frontend](https://img.shields.io/badge/React-18.3.1%20%2F%20Vite%208-blueviolet.svg)]()
[![Database](https://img.shields.io/badge/Supabase-Lifnex--Staging%20Connected-emerald.svg)]()
[![SMTP](https://img.shields.io/badge/SMTP-Resend%20Ready-red.svg)]()
[![AI Engine](https://img.shields.io/badge/Google%20Gemini-1.5%20Pro-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

> **LIFNEX** is an AI-assisted emergency blood donor coordination and hospital triage dispatch platform. Built with a high-performance React 18 frontend, Python Flask REST API gateway, and Supabase PostgreSQL with strict Row-Level Security, Lifnex eliminates operational latency during clinical blood emergencies through mathematical proximity matching and automated biological compatibility filtering.

---

## ⚠️ Medical & Scope Boundary Disclaimer

**Lifnex is strictly a digital logistics, donor discovery, and emergency communication platform.**  
Lifnex is **not** a blood bank, does not store or distribute physical blood products, and does not perform clinical diagnosis or medical compatibility cross-matching. All biological transfusions must follow accredited hospital laboratory protocols and the National Blood Transfusion Council (NBTC) regulations.

---

## 🚀 Key Features

- **🚨 Instant Emergency Requisition Desk:** Submit urgent multi-unit blood requests with clinical urgency classification (*Critical < 2h*, *Urgent 2-4h*, *Routine 24h*).
- **🩸 Algorithmic ABO/Rh Compatibility Engine:** Strict physiological matching logic ensuring zero incompatible transfusions (Universal donor $O^-$, Universal recipient $AB^+$).
- **📍 Haversine Geospatial Vector Discovery:** Great-circle distance calculations matching voluntary donors within custom travel radiuses (5 km to 50 km).
- **🤝 Bilateral Handshake Coordination:** Single-click response dispatch with estimated transit arrival times (ETA) and travel modality.
- **🏥 Hospital Cold-Chain Cryo-Reserve:** Real-time monitoring and stock level adjustments across 8 blood groups (-20°C to +4°C).
- **🤖 Gemini AI Clinical Governance Shield:** Pre-execution PII redaction (masking phone numbers and addresses), adversarial prompt defense, and mandatory non-diagnostic disclaimer injection.
- **🛡️ Enterprise Security & Privacy:** Row-Level Security (RLS) across 9 relational tables, Argon2/Scrypt password encryption, 6-digit email OTP verification, and an append-only SHA-256 audit ledger.
- **📱 Android Companion App:** Standalone Android APK build profile powered by React Native and Expo SDK 51.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend Framework** | React 18.3.1, TypeScript, Vite 8.3.7, Tailwind CSS v4.3.5 |
| **Animation & 3D** | Lucide Icons, Three.js 0.187.0 |
| **Backend REST API** | Python 3.11.9, Flask 3.1.0, Blueprint architecture |
| **Authentication** | Supabase Auth + PyJWT 2.11.0 (HS256/RS256 signature verification) |
| **Active Database** | Supabase PostgreSQL 15.x / PostgREST |
| **Migration Target** | Azure Database for PostgreSQL Flexible Server (Planned DR target) |
| **AI Governance** | Google Gemini 1.5 Pro / Flash |
| **Mapping Engine** | Leaflet 1.9.4 / OpenStreetMap |
| **Mobile App** | React Native 0.74.5, Expo SDK 51 (EAS Build standalone APK) |
| **Automated Testing** | Pytest 9.2.0 (81 tests, 100% pass rate) |

---

## 📁 Repository Structure

```text
Lifnex/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Legacy compatibility endpoints
│   │   ├── core/            # Core configuration & client factories
│   │   ├── database/        # Supabase connection manager
│   │   ├── models/          # Data schemas & Pydantic validators
│   │   ├── routes/          # REST Blueprints (auth, blood_requests, donors, hospitals, notifications, ai)
│   │   ├── services/        # Matching engine, AI service, audit logger, notification service
│   │   └── utils/           # Auth guard (require_auth, require_roles), audit logger
│   ├── migrations/          # Canonical SQL migrations (001_initial_schema, 002_security_hardening)
│   └── tests/               # 81 automated tests across 10 modules
├── frontend/
│   ├── dist/                # Production build output
│   ├── src/                 # React 18 SPA (pages, components, context, styles)
│   └── static/              # Vanilla static HTML fallbacks and Leaflet maps
├── mobile/                  # React Native / Expo companion app (app.json, eas.json)
├── docs/                    # Architectural audits, integration plans, and proposals
├── run.py                   # Flask server entrypoint (Port 5000)
├── package.json             # Frontend Vite & React dependencies
└── requirements.txt         # Production Python dependencies
```

---

## ⚙️ Installation & Local Setup

### 1. Prerequisites
- **Python:** 3.11+
- **Node.js:** v18+ with `npm`
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/ujjwalgupta107-sudo/Lifnex.git
cd Lifnex
```

### 3. Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows PowerShell
# source venv/bin/activate  # macOS / Linux

# Install dependencies
pip install -r requirements.txt
pip install reportlab markdown
```

### 4. Frontend Setup
```bash
# Install frontend npm dependencies
npm install

# Build static production assets
npm run build
```

---

## 🔐 Environment Configuration

Create a `.env` file in the project root directory (`c:\Users\Ujjwal\Desktop\Lifnex\.env`):

```env
# ==============================================================================
# LIFNEX APPLICATION ENVIRONMENT CONFIGURATION
# ==============================================================================

# Supabase Project Configuration (From your Supabase project 'Lifnex')
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-publishable-key>
SUPABASE_SECRET_KEY=<your-service-role-secret-key>
SUPABASE_JWKS_URL=https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json

# Google Gemini AI Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Flask Application Settings
FLASK_APP=backend.app:create_app
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=lifnex-super-secret-session-key-dev-only-change-in-prod
PORT=5000
CORS_ORIGINS=*
```

> **Security Note:** Never commit `.env` to GitHub. The repository `.gitignore` strictly protects `.env`, `backend/.env`, and all credentials.

---

## 🗄️ Database Setup & Migrations (Supabase)

Lifnex requires nine relational tables with 45 Row-Level Security policies:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Run `backend/migrations/001_initial_schema.sql` to initialize all 9 tables, indexes, and constraints.
4. Run `backend/migrations/002_security_hardening.sql` to enforce Row-Level Security (RLS) policies.

---

## 🚀 Running Locally

### Start Backend API Server (Port 5000)
```powershell
$env:PYTHONPATH="."
.\venv\Scripts\python run.py
```
*API will be live at `http://127.0.0.1:5000`.*

### Start Frontend Development Server (Port 5173)
```powershell
npm run dev
```
*Web application will be live at `http://localhost:5173`.*

---

## 🧪 Testing Suite Execution

Lifnex includes an automated regression test suite covering all modules:

```powershell
# Run the complete test suite (81 tests)
$env:LIFNEX_FORCE_OFFLINE="1"
$env:PYTHONPATH="."
.\venv\Scripts\pytest -p no:asyncio backend/tests/ -v
```

**Verified Test Result:** `81 passed in 1.49s (100% Pass Rate)`.

---

## 📱 Mobile Application (Android APK)

The companion mobile app is configured in `mobile/`:
```bash
cd mobile
npm install

# Build standalone preview Android APK via EAS
eas build -p android --profile preview
```

---

## 📄 Key Project Documentation

- **Master Project Proposal:** [docs/LIFNEX_COMPLETE_PROJECT_PROPOSAL.md](docs/LIFNEX_COMPLETE_PROJECT_PROPOSAL.md) / [docs/LIFNEX_COMPLETE_PROJECT_PROPOSAL.pdf](docs/LIFNEX_COMPLETE_PROJECT_PROPOSAL.pdf)
- **Current Progress Report:** [CURRENT_PROGRESS.md](CURRENT_PROGRESS.md)
- **Previous Git Commit Log:** [PREVIOUS_COMMIT.md](PREVIOUS_COMMIT.md)
- **Full Project Proposal (Root):** [PROJECT_PROPOSAL.md](PROJECT_PROPOSAL.md)
- **Supabase Integration Guide:** [docs/SUPABASE_INTEGRATION_GUIDE.md](docs/SUPABASE_INTEGRATION_GUIDE.md)
- **System Architecture Audit:** [docs/SYSTEM_ARCHITECTURE_AUDIT.md](docs/SYSTEM_ARCHITECTURE_AUDIT.md)

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
