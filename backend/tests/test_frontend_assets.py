"""
FRONTEND ASSETS & STATIC DELIVERY REGRESSION TEST
Ensures stylesheets, JavaScript modules, images, and HTML pages return 200 OK with correct MIME types.
"""

import pytest
from backend.app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_homepage_serves_html(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers.get("Content-Type", "")
    assert b"Lifnex" in res.data
    assert b"Connecting Lives" in res.data

def test_static_stylesheets_serve_correct_mime(client):
    stylesheets = ["variables.css", "base.css", "components.css", "layout.css", "dashboards.css"]
    for sheet in stylesheets:
        res = client.get(f"/static/css/{sheet}")
        assert res.status_code == 200, f"Stylesheet /static/css/{sheet} failed to load"
        assert "text/css" in res.headers.get("Content-Type", ""), f"/static/css/{sheet} returned wrong MIME"
        assert len(res.data) > 0

def test_static_javascript_serves_correct_mime(client):
    scripts = ["main.js", "auth.js", "requests.js", "dashboards.js", "maps.js", "charts.js", "realtime.js"]
    for script in scripts:
        res = client.get(f"/static/js/{script}")
        assert res.status_code == 200, f"Script /static/js/{script} failed to load"
        assert "javascript" in res.headers.get("Content-Type", "").lower(), f"/static/js/{script} returned wrong MIME"
        assert len(res.data) > 0

def test_static_images_serve_correct_mime(client):
    images = [
        ("logo/lifnex-logo.png", "image/png"),
        ("images/hero-medical-team.jpg", "image/jpeg"),
        ("images/compatibility-lab.jpg", "image/jpeg"),
        ("images/clinical-verification.jpg", "image/jpeg"),
        ("images/voluntary-donor.jpg", "image/jpeg"),
        ("images/hospital-facility.jpg", "image/jpeg"),
        ("images/platform-preview-1.png", "image/png"),
        ("images/platform-preview-2.png", "image/png"),
    ]
    for path, expected_mime in images:
        res = client.get(f"/static/assets/{path}")
        assert res.status_code == 200, f"Image /static/assets/{path} failed to load"
        assert expected_mime in res.headers.get("Content-Type", "").lower()
        assert len(res.data) > 1000

def test_all_12_platform_pages_return_200(client):
    pages = [
        "/index.html",
        "/about.html",
        "/how-it-works.html",
        "/hospitals.html",
        "/contact.html",
        "/login.html",
        "/register.html",
        "/forgot-password.html",
        "/patient-dashboard.html",
        "/donor-dashboard.html",
        "/hospital-dashboard.html",
        "/admin-dashboard.html",
    ]
    for page in pages:
        res = client.get(page, follow_redirects=True)
        assert res.status_code == 200, f"Page {page} returned status {res.status_code}"
        assert "text/html" in res.headers.get("Content-Type", "")
        assert b"Lifnex" in res.data

def test_extensionless_page_routes_return_200(client):
    routes = [
        "/about",
        "/how-it-works",
        "/hospitals",
        "/contact",
        "/login",
        "/register",
        "/forgot-password",
        "/patient-dashboard",
        "/donor-dashboard",
        "/hospital-dashboard",
        "/admin-dashboard",
    ]
    for route in routes:
        res = client.get(route)
        assert res.status_code == 200, f"Route {route} returned status {res.status_code}"
        assert "text/html" in res.headers.get("Content-Type", "")
