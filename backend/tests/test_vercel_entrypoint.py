"""
VERCEL ENTRYPOINT REGRESSION TEST
Ensures api.index.app loads identically to local Flask application and services requests.
"""

from api.index import app

def test_vercel_entrypoint_initialization():
    assert app is not None
    assert app.name == "backend.app"

def test_vercel_entrypoint_health_endpoint():
    client = app.test_client()
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["platform"] == "Lifnex API v1"

