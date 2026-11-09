# LIFNEX — UI DESIGN SYSTEM & FRONTEND SPECIFICATION

**Project:** Lifnex — Connecting Lives When Every Second Matters  
**Document Stage:** Phase 1 — Complete Project Planning & System Design  
**Technology Base:** Native HTML5, Pure Modern CSS3 (Custom Properties & Grid/Flexbox), Vanilla JavaScript ES6+  
**Visual Foundation:** Derived from `demo-assests/` UI/UX Reference Concepts & Master Branding

---

## 1. Visual Identity & Brand Concept

Lifnex embodies an urgent, clinical, trustworthy, and modern digital healthcare aesthetic. The visual hierarchy combines high-contrast alert tones for life-critical blood dispatch with calming slate backgrounds that promote focus and composure during medical emergencies.

```
Primary Identity: Official Lifnex Logo
Source Asset: demo-assests/Lifnex AI Blood Donor Network Logo use this logo in website.png
Key Motifs: Deep Blood Drop, Neural AI Nexus Lines, High-Precision Healthcare Cross
```

---

## 2. Color Palette & CSS Custom Properties

```css
:root {
  /* Brand Primary & Emergency Crimson */
  --crimson-50:  #fff1f2;
  --crimson-100: #ffe4e6;
  --crimson-200: #fecdd3;
  --crimson-400: #fb7185;
  --crimson-500: #f43f5e;
  --crimson-600: #e11d48;  /* Primary Brand Action */
  --crimson-700: #be123c;
  --crimson-800: #9f1239;
  --crimson-900: #881337;

  /* Neutral Medical Slates */
  --slate-50:  #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1e293b;
  --slate-900: #0f172a;  /* Primary Dark Surface */
  --slate-950: #020617;  /* Canvas Background */

  /* Healthcare Status Indicators */
  --status-critical: #ef4444; /* Emergency / Critical */
  --status-urgent:   #f59e0b; /* Urgent Attention */
  --status-normal:   #3b82f6; /* Standard Priority */
  --status-success:  #10b981; /* Confirmed / Fulfilled / Available */
  --status-cooldown: #8b5cf6; /* Cooldown Period (90 days) */

  /* Surface & Glassmorphic Variables */
  --bg-primary: #0f172a;
  --bg-card: rgba(30, 41, 59, 0.7);
  --border-card: rgba(255, 255, 255, 0.1);
  --blur-glass: blur(12px);
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

## 3. Typography & Sizing Scale

| Scale Role | Font Weight | Font Size | Line Height | Usage |
|---|---|---|---|---|
| **Display 1** | Bold (700) | `2.50rem` (40px) | `1.2` | Hero Section Headline, Critical Alert Banners |
| **Heading 2** | Semi-Bold (600) | `1.75rem` (28px) | `1.3` | Section Headers, Dashboard Page Titles |
| **Heading 3** | Semi-Bold (600) | `1.25rem` (20px) | `1.4` | Card Titles, Modal Headers, Blood Group Badges |
| **Body Large** | Regular (400) | `1.00rem` (16px) | `1.6` | Lead Paragraphs, Clinical Instructions |
| **Body Small** | Regular (400) | `0.875rem` (14px) | `1.5` | Form Field Inputs, Table Rows, Metadata |
| **Caption / Tag**| Medium (500) | `0.75rem` (12px) | `1.4` | Status Pills, Timestamp Flags, Distance Tags |

---

## 4. Reusable UI Components

### 4.1 Emergency Request Card (From `demo-assests/ui and ux idea 1.png`)
- **Structure**:
  - Top: Blood group badge (e.g. `[ O- CRITICAL ]`) + Hospital Name + Distance (e.g. `2.4 km away`).
  - Middle: Required units count (`2 / 3 Units Needed`) with visual progress pill.
  - Bottom: Countdown timer (`Expires in 42 mins`) + Quick Action CTA (`[ Accept & Respond ]`).

### 4.2 Blood Group Compatibility Matrix Grid
- Quick interactive matrix grid displaying the 8 blood types (`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`) with donor/recipient highlights on hover or click.

### 4.3 Leaflet.js Geolocation Map Container
- Clean container with custom styled marker pins:
  - Red pulsing marker: Critical blood emergency at hospital.
  - Emerald green marker: Verified available voluntary donor.
  - Blue marker: Verified blood bank with cold chain inventory.
  - Proximity circle overlay (5 km / 15 km search radius).

### 4.4 Realtime Status Pill Badges
- `.badge-critical`: Pulsing red background with white text.
- `.badge-urgent`: Amber background with dark text.
- `.badge-verified`: Emerald badge with shield icon.
- `.badge-demo`: Distinctive cyan badge reading `SYNTHETIC DEMO`.

---

## 5. Responsive Layout Architecture

- **Desktop (1024px and up)**: Split dual-pane layout. Left pane contains live emergency feed, donor responses, and quick triage input; Right pane displays the interactive Leaflet.js geospatial map.
- **Tablet (768px – 1023px)**: Responsive stacked column with sticky summary ribbon.
- **Mobile (< 768px - guided by `demo-assests/3aa5007a157ca4f3c16c3d1076c7a946.jpg`)**:
  - Full-width mobile emergency dispatch card.
  - Sticky bottom action bar (`[ Respond Now ]` / `[ Decline ]`).
  - Slide-over drawer for patient details and navigation route to hospital.

