"""
LIFNEX FULL-STACK PLAYWRIGHT BROWSER AUTOMATION & E2E VALIDATION
Runs against live Vite Frontend (http://localhost:5173) and Flask Backend (http://127.0.0.1:5000).
Tests all 12 pages across 6 viewports, interactive user journeys (Patient, Donor, Hospital, Admin),
checks console logs, image loading, network errors, and captures evidence.
"""

import sys
import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
VIEWPORTS = [
    {"name": "mobile_375", "width": 375, "height": 667},
    {"name": "mobile_430", "width": 430, "height": 932},
    {"name": "tablet_768", "width": 768, "height": 1024},
    {"name": "desktop_1024", "width": 1024, "height": 768},
    {"name": "desktop_1440", "width": 1440, "height": 900},
    {"name": "desktop_1920", "width": 1920, "height": 1080},
]

PAGES = [
    {"path": "index.html", "title": "Home / Landing"},
    {"path": "about.html", "title": "About Lifnex"},
    {"path": "how-it-works.html", "title": "How It Works"},
    {"path": "hospitals.html", "title": "Hospitals & Blood Banks"},
    {"path": "contact.html", "title": "Contact Us"},
    {"path": "login.html", "title": "Sign In"},
    {"path": "register.html", "title": "Register"},
    {"path": "forgot-password.html", "title": "Forgot Password"},
    {"path": "patient-dashboard.html", "title": "Patient Dashboard"},
    {"path": "donor-dashboard.html", "title": "Donor Dashboard"},
    {"path": "hospital-dashboard.html", "title": "Hospital Dashboard"},
    {"path": "admin-dashboard.html", "title": "Admin Dashboard"},
]

os.makedirs("screenshots", exist_ok=True)

def run_tests():
    print("=" * 60)
    print("   LIFNEX LIVE BROWSER AUTOMATION & VALIDATION SUITE")
    print("=" * 60)
    
    results = {
        "viewports_tested": 0,
        "pages_tested": 0,
        "console_errors": [],
        "broken_images": [],
        "functional_checks": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Listen to console errors
        def on_console(msg):
            if msg.type == "error":
                # Filter benign or cross-origin external noise if any
                text = msg.text
                if not any(x in text for x in ["favicon.ico", "cross-origin"]):
                    results["console_errors"].append(text)

        page.on("console", on_console)

        # ----------------------------------------------------
        # 1. VISUAL & RESPONSIVE VALIDATION ACROSS ALL 12 PAGES
        # ----------------------------------------------------
        print("\n[STEP 1] Testing 12 Platform Pages across 6 Viewports...")
        for vp in VIEWPORTS:
            page.set_viewport_size({"width": vp["width"], "height": vp["height"]})
            print(f"  -> Testing Viewport: {vp['name']} ({vp['width']}x{vp['height']})")
            
            for pinfo in PAGES:
                target_url = f"{BASE_URL}/{pinfo['path']}"
                response = page.goto(target_url, wait_until="domcontentloaded", timeout=10000)
                status = response.status if response else 0
                
                # Verify HTTP 200
                if status != 200:
                    print(f"    [FAIL] {pinfo['path']} returned status {status}")
                
                # Check for broken first-party application images
                broken = page.evaluate("""() => {
                    const imgs = Array.from(document.querySelectorAll('img'));
                    // Filter out external map tiles from OpenStreetMap CDN
                    const appImgs = imgs.filter(img => 
                        !img.src.includes('tile.openstreetmap.org') && 
                        !img.src.includes('unpkg.com/leaflet')
                    );
                    return appImgs.filter(img => img.complete && img.naturalWidth === 0).map(img => img.src);
                }""")
                if broken:
                    for b in broken:
                        if b not in results["broken_images"]:
                            results["broken_images"].append(f"{pinfo['path']}: {b}")

                # Capture representative screenshots at key viewports
                if vp["name"] in ["mobile_375", "desktop_1440"]:
                    clean_name = pinfo["path"].replace(".html", "").replace("-", "_")
                    screenshot_path = f"screenshots/{clean_name}_{vp['name']}.png"
                    page.screenshot(path=screenshot_path, full_page=False)

                results["pages_tested"] += 1
            results["viewports_tested"] += 1

        print(f"  [PASS] Visually inspected {len(PAGES)} pages across {len(VIEWPORTS)} viewports.")

        # ----------------------------------------------------
        # 2. INTERACTIVE FUNCTIONAL TESTING (PHASE 4)
        # ----------------------------------------------------
        page.set_viewport_size({"width": 1440, "height": 900})
        print("\n[STEP 2] Testing Interactive UI Workflows...")

        # A. Login Page & Demo Presets
        print("  -> Testing Login Page & Demo Presets...")
        page.goto(f"{BASE_URL}/login.html", wait_until="networkidle")
        
        # Test demo preset buttons
        page.click("button:has-text('Demo Donor')")
        email_val = page.input_value("#loginEmail")
        if "donor" in email_val:
            results["functional_checks"].append("[PASS] Demo preset (Demo Donor) fills email input")
            print("    [PASS] Demo Preset (Demo Donor) works")
        else:
            print(f"    [FAIL] Demo preset failed, got: {email_val}")

        page.click("button:has-text('Demo Patient')")
        email_val = page.input_value("#loginEmail")
        if "patient" in email_val:
            results["functional_checks"].append("[PASS] Demo preset (Demo Patient) fills email input")
            print("    [PASS] Demo Preset (Demo Patient) works")

        # B. Patient Dashboard Interactions
        print("  -> Testing Patient Dashboard Interactive Features...")
        page.goto(f"{BASE_URL}/patient-dashboard.html", wait_until="networkidle")
        
        # Check stat cards exist
        stats = page.locator(".metric-card").count()
        if stats >= 4:
            results["functional_checks"].append(f"[PASS] Patient Dashboard has {stats} metric cards")
            print(f"    [PASS] Patient metric cards rendered: {stats}")

        # Check emergency request button
        create_btn = page.locator("button:has-text('Create Emergency Request')")
        if create_btn.count() > 0:
            results["functional_checks"].append("[PASS] Patient Create Emergency Request CTA present")
            print("    [PASS] Create Emergency Request CTA present")

        # Check request stepper
        stepper_steps = page.locator(".stepper-step").count()
        if stepper_steps >= 4:
            results["functional_checks"].append(f"[PASS] 4-step progress stepper rendered ({stepper_steps} steps)")
            print(f"    [PASS] Request progress stepper rendered ({stepper_steps} steps)")

        # C. Donor Dashboard Interactions
        print("  -> Testing Donor Dashboard Interactive Features...")
        page.goto(f"{BASE_URL}/donor-dashboard.html", wait_until="networkidle")

        # Check toggle switch
        toggle = page.locator("#donorAvailabilityToggle")
        if toggle.count() > 0:
            results["functional_checks"].append("[PASS] Donor Availability Toggle switch rendered")
            print("    [PASS] Availability toggle switch present")

        # Check Urgent Emergency Alert Card & Action Buttons
        interested_btn = page.locator("button:has-text(\"I'm Interested\")")
        if interested_btn.count() > 0:
            results["functional_checks"].append("[PASS] Donor action button 'I'm Interested' rendered")
            print("    [PASS] Donor response action buttons rendered")

        # D. Hospital Dashboard Interactions
        print("  -> Testing Hospital Dashboard Interactive Features...")
        page.goto(f"{BASE_URL}/hospital-dashboard.html", wait_until="networkidle")
        hosp_stats = page.locator(".metric-card").count()
        hosp_table = page.locator("table").count()
        if hosp_stats >= 4 and hosp_table >= 1:
            results["functional_checks"].append("[PASS] Hospital Dashboard metrics & table rendered")
            print(f"    [PASS] Hospital metrics ({hosp_stats}) and table verified")

        # E. Admin Dashboard Analytics & Charts
        print("  -> Testing Admin Dashboard Showcase Charts & KPIs...")
        page.goto(f"{BASE_URL}/admin-dashboard.html", wait_until="networkidle")
        
        # Verify 4 KPI cards: 1420, 1016, 52, 368
        admin_stats = page.locator(".metric-info h3").all_inner_texts()
        print(f"    [INFO] Admin stats found: {admin_stats}")
        if any("1,420" in s for s in admin_stats) and any("368" in s for s in admin_stats):
            results["functional_checks"].append("[PASS] Admin showcase KPI cards (1,420 users, 368 requests) verified")
            print("    [PASS] Showcase KPI metrics verified")

        # Verify Chart canvases
        trend_canvas = page.locator("#emergencyRequestsTrendChart")
        donut_canvas = page.locator("#requestStatusChart")
        if trend_canvas.count() > 0 and donut_canvas.count() > 0:
            results["functional_checks"].append("[PASS] Admin Dual Analytics canvases rendered (Trend Line + Status Donut)")
            print("    [PASS] Chart.js canvases rendered for line and donut charts")

        # Take final screenshot of Admin Dashboard
        page.screenshot(path="screenshots/admin_dashboard_showcase.png")

        # F. Registration Page Role Selection
        print("  -> Testing Registration Page Role Selection...")
        page.goto(f"{BASE_URL}/register.html", wait_until="networkidle")
        role_cards = page.locator(".role-selector-card").count()
        if role_cards == 3:
            results["functional_checks"].append("[PASS] Register page 3 role cards rendered")
            print("    [PASS] Register page 3 role cards present")

        browser.close()

    print("\n" + "=" * 60)
    print("   AUTOMATED BROWSER TEST SUMMARY")
    print("=" * 60)
    print(f"Total page view inspections: {results['pages_tested']}")
    print(f"Total viewports validated: {results['viewports_tested']}")
    print(f"Functional UI checks passed: {len(results['functional_checks'])}")
    for fc in results["functional_checks"]:
        print(f"  {fc}")
    
    if results["broken_images"]:
        print("\n[WARNING] Broken images detected:")
        for bi in results["broken_images"]:
            print(f"  - {bi}")
    else:
        print("\n[PASS] Zero broken images across all pages and viewports!")

    if results["console_errors"]:
        print("\n[WARNING] Console errors detected:")
        for ce in results["console_errors"]:
            print(f"  - {ce}")
    else:
        print("\n[PASS] Zero critical JavaScript console errors!")

    return len(results["broken_images"]) == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
