# LIFNEX — FRONTEND PAGE INVENTORY

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Stage:** Phase 2 — Complete Frontend UI/UX Development  
**Base Directory:** `frontend/`  
**Technology:** HTML5, Modern CSS3 (Grid/Flexbox/Variables), Vanilla JavaScript (ES6+), Leaflet.js, Chart.js  

---

## 1. Page-by-Page Inventory & Specifications

| # | File Name | Route Type | Target Audience | Key Components & Features | Primary Asset Used |
|---|---|---|---|---|---|
| 1 | `index.html` | Public Landing | All Visitors | Hero banner, live emergency feed with blood group & urgency filters, interactive Blood Compatibility Matrix, clinical disclaimers, simulated metric cards, responsive navbar & footer. | `lifnex-logo.png`<br>`63880284821092a1499a052d23a92755.jpg` |
| 2 | `about.html` | Public Information | Patients, Donors, Hospitals | Platform mission & vision, 3 core architectural pillars (Privacy, Clinical Integrity, Velocity), medical transfusion safety alerts. | `lifnex-logo.png`<br>`85416b7ff61fad517b30461eb0580d96.jpg` |
| 3 | `how-it-works.html` | Public Educational | Patients, Donors, Hospitals | 3-way step-by-step workflow cards (Patient requisition, Voluntary donor dispatch, Hospital certification) and clinical deferral timeline. | `lifnex-logo.png`<br>`e3d4322b0d6ecf157920a83176916cef.jpg` |
| 4 | `hospitals.html` | Public Discovery | Patients, Donors, Coordinators | Interactive Leaflet.js map with OpenStreetMap tiles, custom hospital and donor map pins, demo hospital directory cards with direct desk hotlines. | `lifnex-logo.png`<br>Leaflet Map Markers |
| 5 | `contact.html` | Public Support | All Users | Validated technical & hospital onboarding inquiry form, headquarters contact data, voluntary donor network badge. | `lifnex-logo.png`<br>`a85d36a49b94b9f1882397279955e05b.jpg` |
| 6 | `login.html` | Authentication | Returning Users | Email/password sign-in form, password visibility toggle, role preview selector (Patient, Donor, Hospital, Admin), remember session checkbox. | `lifnex-logo.png` |
| 7 | `register.html` | Authentication | New Users | Role-based dynamic registration (Patient, Voluntary Donor, Hospital), conditional medical fields (blood group, alert radius, hospital license), legal/clinical disclaimer agreement. | `lifnex-logo.png` |
| 8 | `forgot-password.html`| Authentication | Password Recovery | Recovery email input form, interactive toast feedback simulation. | `lifnex-logo.png` |
| 9 | `patient-dashboard.html`| Authenticated Portal | Patients & Families | Active emergency requisition tracker, live incoming donor responses with ETAs, simulated Gemini AI emergency triage assistant, create request modal, request history. | `lifnex-logo.png`<br>Emergency Card Concept 1 |
| 10 | `donor-dashboard.html` | Authenticated Portal | Voluntary Donors | Real-time availability toggle switch (`Available` / `Inactive`), Haversine compatible emergency cards, accept/decline actions with ETA modal, 90-day cooldown status, verified donation ledger. | `lifnex-logo.png`<br>`a85d36a49b94b9f1882397279955e05b.jpg` |
| 11 | `hospital-dashboard.html`| Authenticated Portal | Hospital Transfusion Desks | Incoming donor arrivals monitor with one-click donation confirmation, cold-chain blood bank reserve progress bars, embedded 4km radar Leaflet map, broadcast shortage modal. | `lifnex-logo.png`<br>Portal Concept 2 |
| 12 | `admin-dashboard.html` | Authenticated Portal | System Administrators | Chart.js visualizations (Blood group distribution doughnut, monthly emergency vs fulfillment trend bars, response velocity curve), live tamper-evident audit log stream, user governance table. | `lifnex-logo.png`<br>Chart.js Engine |

---

## 2. Static Assets & Scripts Architecture

### CSS Modular Stylesheets (`frontend/static/css/`)
1. `variables.css`: Palette tokens (Crimson `#E11D48`, Slates, status colors), elevation shadows, font stacks, layout constants.
2. `base.css`: CSS reset, typography hierarchies, accessibility focus rings, utility classes.
3. `components.css`: Buttons, status badges, pulsing critical tags, cards, modal backdrops, toast alerts, form inputs, responsive tables.
4. `layout.css`: Header navbar, responsive hamburger drawer, hero grid, feature cards, blood compatibility matrix grid, dark footer.
5. `dashboards.css`: Sidebar navigation, topbar with notification popovers, metric cards, emergency feed cards, availability switch, AI triage assistant box.

### JavaScript Modules (`frontend/static/js/`)
1. `main.js`: Synthetic demo store (`LifnexDemoStore`), global Toast system (`Toast.show()`), modal dialog controller (`Modal.open()`), Blood Compatibility interactive matrix engine.
2. `auth.js`: Password visibility toggles, login simulation with role routing, dynamic registration form field toggles.
3. `dashboards.js`: Donor availability switch events, accept/decline action handlers, emergency request creation modal processor, simulated Gemini AI triage parser.
4. `maps.js`: Leaflet.js map initialization with OpenStreetMap tiles, custom hospital/donor markers, radius overlays.
5. `charts.js`: Chart.js configuration for blood group doughnut chart, monthly volume bar charts, and response speed curve.
6. `requests.js`: Dynamic emergency feed rendering with real-time blood group and clinical urgency filters.

