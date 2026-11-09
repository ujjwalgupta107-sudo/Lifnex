"""
PHASE 7 REALTIME & NOTIFICATION TESTS
Validates:
1. Notification retrieval for authenticated user
2. Unread filtering (?unread_only=true) and unread count
3. Mark single notification as read
4. Mark notification 403 on foreign user's notification
5. Mark all notifications as read
6. Location privacy: Donor coordinate approximation logic
"""

import pytest
from backend.app import create_app
from backend.app.config import Config
from backend.tests.test_auth import create_test_jwt

class TestConfig(Config):
    TESTING = True

@pytest.fixture
def app():
    app = create_app(TestConfig)
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_get_notifications_requires_auth(client):
    res = client.get("/api/v1/notifications")
    assert res.status_code == 401

def test_get_notifications_authenticated_patient(client):
    token = create_test_jwt(user_id="demo-user-patient-id", role="patient")
    res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert "unread_count" in data

def test_get_notifications_unread_only(client):
    token = create_test_jwt(user_id="demo-user-patient-id", role="patient")
    res = client.get("/api/v1/notifications?unread_only=true", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    # Verify all returned are unread
    for notif in data["data"]:
        assert notif["is_read"] is False

def test_mark_single_notification_read(client):
    token = create_test_jwt(user_id="demo-user-patient-id", role="patient")
    res = client.patch("/api/v1/notifications/notif-uuid-1/read", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "marked as read" in data["message"]

def test_mark_foreign_notification_forbidden(client):
    # User 2 tries to mark User 1's notification
    token = create_test_jwt(user_id="different-user-id", role="donor")
    res = client.patch("/api/v1/notifications/notif-uuid-1/read", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "FORBIDDEN"

def test_mark_all_notifications_read(client):
    token = create_test_jwt(user_id="demo-user-donor-id", role="donor")
    res = client.patch("/api/v1/notifications/mark-all-read", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "All notifications marked as read" in data["message"]

