from playwright.sync_api import sync_playwright

def test_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for role, expected_page in [
            ("Demo Patient", "patient-dashboard.html"),
            ("Demo Donor", "donor-dashboard.html"),
            ("Demo Hospital", "hospital-dashboard.html"),
            ("Demo Admin", "admin-dashboard.html")
        ]:
            page = browser.new_page()
            page.goto("http://localhost:5173/login.html", wait_until="networkidle")
            page.click(f"button:has-text('{role}')")
            page.click(".btn-login-submit")
            page.wait_for_timeout(2500)
            print(f"{role} -> URL: {page.url}")
            assert expected_page in page.url, f"Expected {expected_page}, got {page.url}"
            page.close()
        print("\n[ALL PASS] All 4 demo roles login and redirect perfectly in the browser!")
        browser.close()

if __name__ == "__main__":
    test_all()
