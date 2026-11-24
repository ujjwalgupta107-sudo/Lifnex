# LIFNEX — MOBILE APK BUILD REPORT
**Document ID:** LFX-MOB-2026-007  
**Auditor:** Mobile Application Engineer  
**Date:** November 2026  
**Status:** CONFIGURED & VERIFIED  

---

## 1. Mobile Architecture Overview

The Lifnex Android mobile client is architected as an Expo / React Native hybrid application container located in `mobile/`. It wraps the responsive Lifnex dark-mode web platform with native mobile capabilities:
- Native Android status bar theme integration (`#0A0D14`).
- Geolocation permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`) for emergency donor discovery.
- Native Android push notification services (`POST_NOTIFICATIONS`) for instant dispatch alerts.

---

## 2. Configuration Files & Build Profiles

1. **`mobile/package.json`**: React 18.2.0, React Native 0.74.5, Expo SDK ~51.0.0, `react-native-webview` 13.8.6.
2. **`mobile/app.json`**:
   - App Name: `LIFNEX - Blood Donor Network`
   - Package Identifier: `org.lifnex.donorapp`
   - Orientation: `portrait`
   - Background Color: `#0A0D14`
3. **`mobile/eas.json`**:
   - `preview` profile configured with `"android": { "buildType": "apk" }` to generate downloadable standalone APK binaries.
   - `production` profile configured for Google Play AAB app bundles.

---

## 3. Build Command Execution Guide

To generate the standalone Android APK using EAS CLI:

```bash
cd mobile
npm install
eas build --platform android --profile preview
```

---
*Report certified by Mobile Engineering Lead.*
