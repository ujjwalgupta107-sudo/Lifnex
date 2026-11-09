# LIFNEX — ASSET USAGE MAP & SPECIFICATIONS

**Source Directory:** `demo-assests/` (Original assets preserved without modification or deletion)  
**Standardized Web Target:** `frontend/src/assets/` & `frontend/static/assets/`  
**Purpose:** Canonical asset mapping across all 12 platform pages.

---

## 1. Asset Catalog & Page Assignments

| # | Original File Name | Standardized Web Path | Visual Content Description | Canonical Page & Section Usage | Alt Text |
|---|---|---|---|---|---|
| **1** | `Lifnex AI Blood Donor Network Logo use this logo in website.png` | `assets/logo/lifnex-logo.png` | Official Lifnex brand mark: medical crimson shield, emergency blood drop, clean navy typography. | **All 12 Pages:** Navbar header brand link, footer branding, auth card headers. | `Lifnex AI Emergency Blood Donor Network official logo` |
| **2** | `63880284821092a1499a052d23a92755.jpg` | `assets/images/hero-medical-team.jpg` | Two healthcare professionals warmly caring for a volunteer blood donor in a modern clinic. | `index.html`: Hero Section 2-column showcase card. | `Medical team assisting a voluntary blood donor in a healthcare facility` |
| **3** | `85416b7ff61fad517b30461eb0580d96.jpg` | `assets/images/compatibility-lab.jpg` | Laboratory technician conducting biological compatibility and serological cross-matching. | `about.html`: Clinical safety section; `index.html`: Compatibility matrix visual card. | `Laboratory technician performing blood compatibility testing` |
| **4** | `e3d4322b0d6ecf157920a83176916cef.jpg` | `assets/images/clinical-verification.jpg` | Nurse checking blood pressure and pre-donation vitals of a registered donor. | `how-it-works.html`: Step 3 "Verified Hospital Checkpoint" card. | `Clinician checking donor vitals prior to emergency blood donation` |
| **5** | `a85d36a49b94b9f1882397279955e05b.jpg` | `assets/images/voluntary-donor.jpg` | Smiling voluntary blood donor with donor badge and compression bandage. | `donor-dashboard.html`: Profile avatar banner; `contact.html`: Community care card. | `Verified voluntary blood donor smiling after completing donation` |
| **6** | `3aa5007a157ca4f3c16c3d1076c7a946.jpg` | `assets/images/hospital-facility.jpg` | Modern multi-specialty hospital emergency wing with ambulance trauma bay. | `hospitals.html`: Hero header; `hospital-dashboard.html`: Facility profile banner. | `Accredited hospital emergency care and blood bank facility` |
| **7** | `ui and ux idea 1.png` | `assets/images/platform-preview-1.png` | Design reference displaying executive dashboard, live metrics, and emergency response feed. | `patient-dashboard.html`: Live status visual helper; `about.html`: Architecture overview. | `Lifnex emergency coordination interface showing live metrics` |
| **8** | `ui and ux idea 2.png` | `assets/images/platform-preview-2.png` | Mobile-optimized emergency triage card showing ETA countdown and donor distance. | `how-it-works.html`: Mobile dispatch preview card; `contact.html`: Emergency guide. | `Mobile emergency blood dispatch and distance tracking interface` |

---

## 2. Integrity and Optimization Rules

1. **Non-destructive Preservation:** The original `demo-assests/` directory is never modified, deleted, or renamed.
2. **Proper MIME & Paths:** Assets are accessible via both Vite development bundling (`/src/assets/...`) and Flask/Vercel static routing (`/static/assets/...` or build output).
3. **Explicit Dimensions:** All `<img>` tags declare `width`, `height`, and `loading="lazy"` (except hero images which use `loading="eager"` and `fetchpriority="high"`).
4. **Accessible Alt Text:** Every asset incorporates descriptive, clinical-grade accessibility labels.

