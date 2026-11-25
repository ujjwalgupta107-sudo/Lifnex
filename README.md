# Lifnex: Connecting Lives When Every Second Matters

Emergency blood donor coordination. React + Vite frontend, Flask API, Supabase database.

## Easiest way: let Antigravity do it

1. Unzip this file somewhere short, such as `C:\Lifnex` (long folder paths can break on Windows).
2. In Antigravity choose **Open Folder** and pick the `Lifnex` folder that contains this README.
3. Paste this into the Gemini agent chat:

> Read README.md and follow "Run it yourself" for my operating system. Delete any existing node_modules and venv folders first, then install, build and start the app. Do not edit code, .env, package versions or the database. When http://localhost:5000 and http://localhost:5000/api/v1/health both return 200, open the site and give me the link. If something fails, use the Troubleshooting table.

## Run it yourself

Install first: [Node.js 22 LTS](https://nodejs.org) (20.19+ also works) and [Python 3.11 or newer](https://python.org) (on Windows, tick "Add Python to PATH"). Then open a terminal **inside this folder**, where `package.json` and `run.py` are.

**Windows (PowerShell)**

```powershell
npm install
npm run build
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python run.py
```

**macOS / Linux**

```bash
rm -rf node_modules
npm install
npm run build
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt
./.venv/bin/python run.py
```

Open **http://localhost:5000**. One server runs both the site and the API. Stop it with Ctrl+C.

Next time, only the last command is needed. After changing frontend code, run `npm run build` again.

**Live reload while editing:** keep `run.py` running, run `npm run dev` in a second terminal, and open http://localhost:5173.

## Signing in

The sign-in page has demo buttons: Patient, Donor, Hospital, Admin. Pick one and press **Sign in**.

- **Without a `.env` file** the app runs in offline demo mode and these accounts always work. This is the mode that was tested.
- **With the included `.env`** it uses the real Supabase project, so accounts must exist there and requests are saved for real.

To try it offline, rename `.env` to `.env.off` and restart. Rename it back for real data.

## Environment variables

Copy `.env.example` to `.env` if you don't have one.

| Name | Needed for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL` | Real accounts and data |
| `SECRET_KEY` | Production |
| `GEMINI_API_KEY` | AI triage (optional) |
| `SMTP_*` | Email through your own provider (optional) |
| `CORS_ORIGINS` | Only if site and API are on different domains |

**Never upload `.env` to GitHub or share it publicly.** Its secret key has full database access. If this zip went to anyone outside the team, change that key in Supabase.

New database? In the Supabase SQL Editor run `backend/migrations/001_initial_schema.sql`, then `002_security_hardening.sql`.

## Make it live

**Render (recommended, one service).** `render.yaml` is ready.

1. Push this folder to a GitHub repository (`.gitignore` already leaves out `.env`).
2. On [render.com](https://render.com): New > Blueprint > pick the repository.
3. Fill in the Supabase variables when asked, then deploy.

Any other Python host: build with `npm install --include=dev && npm run build && pip install -r requirements.txt`, start with `gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`.

The build step is required. Without it every page is blank.

**Vercel.** Import the repository, add the variables and deploy. If the home page shows 404, replace `vercel.json` with:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.py" },
    { "source": "/((?!api/|static/|assets/).*)", "destination": "/index.html" }
  ]
}
```

Neither host has been tried live with this version yet.

## Troubleshooting

| Problem | Fix |
|---|---|
| `node` or `python` not recognized | Install it, then close and reopen the terminal |
| `npm install` ERESOLVE error | Make sure the `.npmrc` file is in the folder (it is hidden on macOS/Linux) |
| Vite or rolldown "native binding" error | Delete `node_modules`, run `npm install` again |
| Vite asks for a newer Node | Install Node 22 LTS |
| Blank page | Run `npm run build`, then hard refresh (Ctrl+Shift+R) |
| Port 5000 busy (common on macOS) | `./.venv/bin/python -m flask --app run run --port 5001`, then open port 5001. On Windows use `.\.venv\Scripts\python`. |
| Port 5173 pages load but data doesn't | `run.py` must also be running on port 5000 |
| Demo sign-in fails | Use offline mode, see Signing in |
| "Filename too long" | Move the folder to `C:\Lifnex` |

## Checks

```powershell
npm run build
.\.venv\Scripts\python -m pytest backend/tests
```

Expected without Supabase: 93 passed, 4 errors. Those 4 tests need a live Supabase project. `scripts/browser_live_test.py` targets the old pages and is out of date.

## Where things are

| Path | What |
|---|---|
| `frontend/src/pages` | Screens |
| `frontend/src/styles/tokens.css` | All colours, day and night |
| `frontend/src/lib/liquid.ts` | Theme and page transitions |
| `frontend/src/components/3d/BloodStream.tsx` | 3D hero |
| `frontend/src/components/reactbits` | React Bits components and their licence |
| `scripts/make-shells.js` | Regenerates the HTML shells (`npm run shells`) |
| `backend/app` | Flask API |

UI credits: [React Bits](https://reactbits.dev) by David Haz (MIT + Commons Clause), Mona Sans (SIL OFL), Three.js, Framer Motion, Lucide.

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
| **Automated Testing** | Pytest |

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

## 📱 Mobile Application (Android APK)

The companion mobile app is configured in `mobile/`:
```bash
cd mobile
npm install

# Build standalone preview Android APK via EAS
eas build -p android --profile preview
```

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
