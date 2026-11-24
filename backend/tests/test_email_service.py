"""
UNIT & MOCK TESTS FOR LIFNEX EMAIL SERVICE & RESEND SMTP DISPATCH
Tests SMTP configuration checks, SSL vs STARTTLS dispatching, error handling,
and responsive HTML email templates (OTP, Password Reset, Blood Alerts, Hospital Updates).
"""

import pytest
from unittest.mock import patch, MagicMock
import smtplib
from backend.app.config import Config
from backend.app.services.email_service import (
    is_smtp_configured,
    get_smtp_username,
    send_smtp_email,
    send_otp_email,
    send_password_reset_email,
    send_blood_alert_email,
    send_hospital_verification_email,
    generate_otp_email_html,
    generate_password_reset_email_html,
    generate_blood_request_alert_email_html,
    generate_hospital_verification_email_html
)


def test_is_smtp_configured_logic(monkeypatch):
    """Verifies is_smtp_configured returns True only when all mandatory variables exist."""
    monkeypatch.setattr(Config, "SMTP_HOST", "")
    monkeypatch.setattr(Config, "SMTP_USERNAME", "")
    monkeypatch.setattr(Config, "SMTP_USER", "")
    monkeypatch.setattr(Config, "SMTP_PASSWORD", "")
    assert is_smtp_configured() is False

    # Partial configuration
    monkeypatch.setattr(Config, "SMTP_HOST", "smtp.resend.com")
    monkeypatch.setattr(Config, "SMTP_USERNAME", "resend")
    assert is_smtp_configured() is False

    # Full configuration with SMTP_USERNAME
    monkeypatch.setattr(Config, "SMTP_PASSWORD", "re_mock_key_12345")
    assert is_smtp_configured() is True
    assert get_smtp_username() == "resend"

    # Full configuration with fallback SMTP_USER
    monkeypatch.setattr(Config, "SMTP_USERNAME", "")
    monkeypatch.setattr(Config, "SMTP_USER", "resend_user")
    assert is_smtp_configured() is True
    assert get_smtp_username() == "resend_user"


def test_otp_html_template_generation():
    """Verifies the OTP email template has Lifnex branding, digit spans, and security warnings."""
    html = generate_otp_email_html("482910", "Dr. Jane Doe")
    assert "482910" in html
    for d in "482910":
        assert f">{d}</span>" in html
    assert "Dr. Jane Doe" in html
    assert "LIFNEX" in html
    assert "Connecting Lives When Every Second Matters" in html
    assert "Valid for 10 minutes" in html
    assert "Security Notice:" in html


def test_password_reset_html_template_generation():
    """Verifies password reset template contains action link and security advisory."""
    reset_url = "https://lifnex.space/auth/reset-password?token=abc123xyz"
    html = generate_password_reset_email_html(reset_url, "Rahul Sharma")
    assert reset_url in html
    assert "Rahul Sharma" in html
    assert "Reset Your Password" in html
    assert "Connecting Lives When Every Second Matters" in html
    assert "valid for 15 minutes" in html


def test_blood_request_alert_template_pii_safety():
    """Verifies blood request alert contains urgency and logistics info, but NO patient PII."""
    html = generate_blood_request_alert_email_html(
        blood_group="O+",
        units_needed=2,
        hospital_name="City General Hospital",
        city="Metro South",
        urgency="critical",
        requisition_id="req-998877"
    )
    assert "O+" in html
    assert "2 Unit(s)" in html
    assert "City General Hospital" in html
    assert "Metro South" in html
    assert "CRITICAL" in html
    assert "Connecting Lives When Every Second Matters" in html
    assert "Privacy & Safety:" in html
    # Ensure sensitive private words do not appear
    assert "patient medical records" not in html.lower()


def test_hospital_verification_template():
    """Verifies hospital verification template formats status properly."""
    html = generate_hospital_verification_email_html(
        hospital_name="Apollo Care",
        status="approved",
        notes="All credential documentation verified."
    )
    assert "Apollo Care" in html
    assert "APPROVED & VERIFIED" in html
    assert "All credential documentation verified." in html


def test_send_smtp_email_when_unconfigured(monkeypatch):
    """Verifies send_smtp_email gracefully returns SMTP_NOT_CONFIGURED if variables are absent."""
    monkeypatch.setattr(Config, "SMTP_HOST", "")
    success, msg = send_smtp_email("test@example.com", "Test Subject", "<p>Test</p>")
    assert success is False
    assert msg == "SMTP_NOT_CONFIGURED"


def test_send_smtp_email_starttls_flow(monkeypatch):
    """Tests STARTTLS port 587 dispatch flow with mocked smtplib.SMTP."""
    monkeypatch.setattr(Config, "SMTP_HOST", "smtp.resend.com")
    monkeypatch.setattr(Config, "SMTP_PORT", 587)
    monkeypatch.setattr(Config, "SMTP_USERNAME", "resend")
    monkeypatch.setattr(Config, "SMTP_PASSWORD", "re_mock_test_key")
    monkeypatch.setattr(Config, "SMTP_FROM", "noreply@lifnex.space")
    monkeypatch.setattr(Config, "SMTP_FROM_NAME", "Lifnex Emergency Network")
    monkeypatch.setattr(Config, "SMTP_USE_TLS", True)
    monkeypatch.setattr(Config, "SMTP_USE_SSL", False)

    mock_server = MagicMock()
    with patch("smtplib.SMTP", return_value=mock_server) as mock_smtp_cls:
        mock_server.__enter__.return_value = mock_server

        success, status = send_smtp_email(
            to_email="recipient@example.com",
            subject="Test Emergency Alert",
            html_content="<p>Test Content</p>",
            text_content="Test Content"
        )

        assert success is True
        assert status == "DELIVERED_VIA_SMTP"
        mock_smtp_cls.assert_called_once_with("smtp.resend.com", 587, timeout=10)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("resend", "re_mock_test_key")
        mock_server.sendmail.assert_called_once()


def test_send_smtp_email_ssl_port_465_flow(monkeypatch):
    """Tests direct SSL port 465 dispatch flow with mocked smtplib.SMTP_SSL."""
    monkeypatch.setattr(Config, "SMTP_HOST", "smtp.resend.com")
    monkeypatch.setattr(Config, "SMTP_PORT", 465)
    monkeypatch.setattr(Config, "SMTP_USERNAME", "resend")
    monkeypatch.setattr(Config, "SMTP_PASSWORD", "re_mock_test_key")
    monkeypatch.setattr(Config, "SMTP_FROM", "noreply@lifnex.space")
    monkeypatch.setattr(Config, "SMTP_FROM_NAME", "Lifnex Emergency Network")
    monkeypatch.setattr(Config, "SMTP_USE_TLS", False)
    monkeypatch.setattr(Config, "SMTP_USE_SSL", True)

    mock_ssl_server = MagicMock()
    with patch("smtplib.SMTP_SSL", return_value=mock_ssl_server) as mock_ssl_cls:
        mock_ssl_server.__enter__.return_value = mock_ssl_server

        success, status = send_smtp_email(
            to_email="ssl_recipient@example.com",
            subject="SSL Test Subject",
            html_content="<p>SSL Content</p>"
        )

        assert success is True
        assert status == "DELIVERED_VIA_SMTP"
        mock_ssl_cls.assert_called_once_with("smtp.resend.com", 465, timeout=10)
        mock_ssl_server.login.assert_called_once_with("resend", "re_mock_test_key")
        mock_ssl_server.sendmail.assert_called_once()


def test_send_smtp_email_auth_failure_handling(monkeypatch):
    """Tests clean error classification when SMTP credentials fail authentication."""
    monkeypatch.setattr(Config, "SMTP_HOST", "smtp.resend.com")
    monkeypatch.setattr(Config, "SMTP_PORT", 587)
    monkeypatch.setattr(Config, "SMTP_USERNAME", "resend")
    monkeypatch.setattr(Config, "SMTP_PASSWORD", "invalid_api_key")

    mock_server = MagicMock()
    mock_server.__enter__.return_value = mock_server
    mock_server.login.side_effect = smtplib.SMTPAuthenticationError(535, b"Authentication credentials invalid")

    with patch("smtplib.SMTP", return_value=mock_server):
        success, status = send_smtp_email("user@example.com", "Test", "<p>Hi</p>")
        assert success is False
        assert status == "SMTP_AUTH_FAILED"


def test_send_otp_email_dispatches_smtp_when_configured(monkeypatch):
    """Verifies send_otp_email prioritizes configured SMTP relay."""
    monkeypatch.setattr(Config, "SMTP_HOST", "smtp.resend.com")
    monkeypatch.setattr(Config, "SMTP_USERNAME", "resend")
    monkeypatch.setattr(Config, "SMTP_PASSWORD", "re_valid_key")

    with patch("backend.app.services.email_service.send_smtp_email", return_value=(True, "DELIVERED_VIA_SMTP")):
        success, code = send_otp_email("donor@example.com", "123456", "John Donor")
        assert success is True
        assert code == "DISPATCHED_SMTP"
