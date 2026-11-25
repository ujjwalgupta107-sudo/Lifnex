"""
EMAIL DISPATCH SERVICE FOR LIFNEX
Handles secure email OTP delivery for account verification, password reset,
emergency blood donor dispatch alerts, and hospital verification notices.
Supports Resend SMTP (smtp.resend.com), custom SMTP relays, and Supabase Auth.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple, Optional
from backend.app.config import Config

logger = logging.getLogger(__name__)


def is_smtp_configured() -> bool:
    """Returns True if local/remote SMTP environment variables are fully configured."""
    user = Config.SMTP_USERNAME or Config.SMTP_USER
    return bool(Config.SMTP_HOST and user and Config.SMTP_PASSWORD)


def get_smtp_username() -> str:
    """Returns the effective SMTP username (e.g., 'resend' for Resend SMTP)."""
    return Config.SMTP_USERNAME or Config.SMTP_USER or ""


# ==============================================================================
# HTML EMAIL TEMPLATES (LIFNEX CYBER-MEDICAL DESIGN SYSTEM)
# ==============================================================================

def generate_otp_email_html(otp_code: str, full_name: Optional[str] = None) -> str:
    """Generates a responsive, cyber-medical Lifnex branded HTML verification email."""
    display_name = full_name or "Lifnex User"

    digit_boxes = "".join(
        f'<span style="display:inline-block; width:38px; height:46px; line-height:46px; margin:0 4px; '
        f'background:#0B1120; border:1px solid #FF2E54; border-radius:8px; color:#FFFFFF; '
        f'font-size:24px; font-weight:800; font-family:monospace; text-align:center;">{d}</span>'
        for d in str(otp_code).strip()
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lifnex Email Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#050811; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#050811; padding:30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px; background:#0B1120; border:1px solid rgba(255, 255, 255, 0.12); border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,46,84,0.15); overflow:hidden;">
          
          <!-- Crimson Top Accent Bar -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #FF2E54 0%, #E11D48 50%, #38BDF8 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 16px 32px; text-align:center;">
              <div style="display:inline-block; margin-bottom:12px;">
                <span style="display:inline-block; width:44px; height:44px; line-height:44px; border-radius:12px; background:rgba(255, 46, 84, 0.15); border:1px solid rgba(255, 46, 84, 0.3); color:#FF2E54; font-size:22px; font-weight:900; text-align:center;">+</span>
              </div>
              <h1 style="margin:0; font-size:24px; font-weight:900; color:#FFFFFF; letter-spacing:-0.02em;">LIFNEX</h1>
              <p style="margin:4px 0 0 0; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#94A3B8; font-weight:700;">Connecting Lives When Every Second Matters</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:16px 32px 24px 32px; text-align:center;">
              <h2 style="margin:0 0 10px 0; font-size:18px; font-weight:800; color:#FFFFFF;">Verify Your Email Address</h2>
              <p style="margin:0 0 20px 0; font-size:13px; line-height:1.6; color:#CBD5E1;">
                Hello <strong style="color:#FFFFFF;">{display_name}</strong>,<br>
                Thank you for joining the Lifnex emergency network. Please use the six-digit verification code below to activate your account:
              </p>

              <!-- OTP Code Display -->
              <div style="margin:24px 0; padding:18px; background:rgba(15, 23, 42, 0.8); border:1px solid rgba(255, 255, 255, 0.08); border-radius:14px; text-align:center;">
                <div style="margin-bottom:8px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#94A3B8; font-weight:700;">Verification Code</div>
                <div style="display:none; font-size:0; line-height:0; max-height:0; mso-hide:all;">Code: {otp_code}</div>
                <div>{digit_boxes}</div>
                <div style="margin-top:10px; font-size:11px; color:#F43F5E; font-weight:600;">Valid for 10 minutes • Single use only</div>
              </div>

              <!-- Security Notice -->
              <div style="background:rgba(2, 6, 23, 0.6); border:1px solid rgba(255, 255, 255, 0.05); border-radius:10px; padding:12px; font-size:11px; line-height:1.5; color:#94A3B8; text-align:left;">
                <strong style="color:#E2E8F0;">Security Notice:</strong> Lifnex personnel will never ask for this code. If you did not create a Lifnex account, please safely disregard this email.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; background:rgba(2, 6, 23, 0.8); border-top:1px solid rgba(255, 255, 255, 0.06); text-align:center;">
              <p style="margin:0; font-size:11px; color:#64748B;">
                © 2026 Lifnex Healthcare Network. Connecting Lives When Every Second Matters.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def generate_password_reset_email_html(reset_target: str, full_name: Optional[str] = None) -> str:
    """Generates a responsive HTML email template for password reset."""
    display_name = full_name or "Lifnex User"
    
    # Check if target is a URL or a code
    is_url = reset_target.startswith("http://") or reset_target.startswith("https://")
    action_block = (
        f'<a href="{reset_target}" style="display:inline-block; padding:12px 28px; background:linear-gradient(135deg, #FF2E54 0%, #E11D48 100%); color:#FFFFFF; text-decoration:none; font-weight:700; font-size:14px; border-radius:10px; box-shadow:0 4px 15px rgba(255, 46, 84, 0.3);">Reset My Password</a>'
        if is_url else
        f'<div style="font-size:22px; font-weight:800; font-family:monospace; color:#FF2E54; letter-spacing:0.15em; background:#0B1120; padding:12px 24px; border-radius:8px; display:inline-block; border:1px solid #FF2E54;">{reset_target}</div>'
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lifnex Password Reset Request</title>
</head>
<body style="margin:0; padding:0; background-color:#050811; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#050811; padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px; background:#0B1120; border:1px solid rgba(255, 255, 255, 0.12); border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,46,84,0.15); overflow:hidden;">
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #FF2E54 0%, #E11D48 50%, #38BDF8 100%);"></td>
          </tr>
          <tr>
            <td style="padding:32px 32px 16px 32px; text-align:center;">
              <h1 style="margin:0; font-size:24px; font-weight:900; color:#FFFFFF;">LIFNEX</h1>
              <p style="margin:4px 0 0 0; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#94A3B8; font-weight:700;">Connecting Lives When Every Second Matters</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px 32px; text-align:center;">
              <h2 style="margin:0 0 10px 0; font-size:18px; font-weight:800; color:#FFFFFF;">Reset Your Password</h2>
              <p style="margin:0 0 20px 0; font-size:13px; line-height:1.6; color:#CBD5E1;">
                Hello <strong style="color:#FFFFFF;">{display_name}</strong>,<br>
                We received a request to reset the password for your Lifnex account. Use the button below to set a new password:
              </p>
              <div style="margin:24px 0;">
                {action_block}
              </div>
              <p style="font-size:12px; color:#94A3B8; margin:0 0 16px 0;">
                This link/code is valid for 15 minutes.
              </p>
              <div style="background:rgba(2, 6, 23, 0.6); border:1px solid rgba(255, 255, 255, 0.05); border-radius:10px; padding:12px; font-size:11px; line-height:1.5; color:#94A3B8; text-align:left;">
                <strong style="color:#E2E8F0;">Security Advisory:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; background:rgba(2, 6, 23, 0.8); border-top:1px solid rgba(255, 255, 255, 0.06); text-align:center;">
              <p style="margin:0; font-size:11px; color:#64748B;">
                © 2026 Lifnex Healthcare Network. Connecting Lives When Every Second Matters.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def generate_blood_request_alert_email_html(
    blood_group: str,
    units_needed: int,
    hospital_name: str,
    city: str,
    urgency: str = "critical",
    requisition_id: str = ""
) -> str:
    """Generates an emergency blood match alert email for matched donors (Zero sensitive patient PII)."""
    urgency_color = "#FF2E54" if urgency.lower() in ("critical", "emergency") else "#F59E0B"
    urgency_label = urgency.upper()

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emergency Blood Request Alert</title>
</head>
<body style="margin:0; padding:0; background-color:#050811; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#050811; padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px; background:#0B1120; border:1px solid rgba(255, 255, 255, 0.12); border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,46,84,0.25); overflow:hidden;">
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #FF2E54 0%, #E11D48 50%, #38BDF8 100%);"></td>
          </tr>
          <tr>
            <td style="padding:28px 32px 12px 32px; text-align:center;">
              <div style="display:inline-block; padding:4px 12px; background:rgba(255, 46, 84, 0.15); border:1px solid {urgency_color}; border-radius:20px; color:{urgency_color}; font-size:11px; font-weight:800; letter-spacing:0.1em; margin-bottom:12px;">
                🚨 {urgency_label} DONOR MATCH
              </div>
              <h1 style="margin:0; font-size:24px; font-weight:900; color:#FFFFFF;">LIFNEX</h1>
              <p style="margin:4px 0 0 0; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#94A3B8; font-weight:700;">Connecting Lives When Every Second Matters</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px 32px;">
              <h2 style="margin:0 0 12px 0; font-size:18px; font-weight:800; color:#FFFFFF; text-align:center;">
                Urgent Blood Request in Your Area
              </h2>
              <p style="margin:0 0 16px 0; font-size:13px; line-height:1.6; color:#CBD5E1; text-align:center;">
                A nearby hospital has an urgent need for blood matching your blood group. Every second counts.
              </p>

              <!-- Blood Match Specs Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="background:rgba(15, 23, 42, 0.8); border:1px solid rgba(255, 255, 255, 0.08); border-radius:12px; margin-bottom:20px;">
                <tr>
                  <td style="font-size:12px; color:#94A3B8; font-weight:600;">Blood Group:</td>
                  <td align="right" style="font-size:16px; color:#FF2E54; font-weight:900;">{blood_group}</td>
                </tr>
                <tr>
                  <td style="font-size:12px; color:#94A3B8; font-weight:600;">Units Needed:</td>
                  <td align="right" style="font-size:14px; color:#FFFFFF; font-weight:700;">{units_needed} Unit(s)</td>
                </tr>
                <tr>
                  <td style="font-size:12px; color:#94A3B8; font-weight:600;">Hospital:</td>
                  <td align="right" style="font-size:13px; color:#FFFFFF; font-weight:700;">{hospital_name}</td>
                </tr>
                <tr>
                  <td style="font-size:12px; color:#94A3B8; font-weight:600;">Location:</td>
                  <td align="right" style="font-size:13px; color:#38BDF8; font-weight:600;">{city}</td>
                </tr>
              </table>

              <!-- Action Button -->
              <div style="text-align:center; margin:20px 0;">
                <a href="https://lifnex.space/donor/dashboard" style="display:inline-block; padding:12px 32px; background:linear-gradient(135deg, #FF2E54 0%, #E11D48 100%); color:#FFFFFF; text-decoration:none; font-weight:800; font-size:14px; border-radius:10px; box-shadow:0 4px 15px rgba(255, 46, 84, 0.4);">
                  View Request & Respond
                </a>
              </div>

              <div style="background:rgba(2, 6, 23, 0.6); border:1px solid rgba(255, 255, 255, 0.05); border-radius:10px; padding:12px; font-size:11px; line-height:1.5; color:#94A3B8; text-align:left;">
                <strong style="color:#E2E8F0;">Privacy & Safety:</strong> Patient medical details remain strictly confidential and protected by privacy protocols. You will only be connected directly if you accept.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; background:rgba(2, 6, 23, 0.8); border-top:1px solid rgba(255, 255, 255, 0.06); text-align:center;">
              <p style="margin:0; font-size:11px; color:#64748B;">
                © 2026 Lifnex Healthcare Network. Connecting Lives When Every Second Matters.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def generate_hospital_verification_email_html(
    hospital_name: str,
    status: str,
    notes: Optional[str] = None
) -> str:
    """Generates an email template notifying a hospital of their institutional verification status."""
    is_approved = status.lower() == "approved"
    badge_color = "#10B981" if is_approved else "#F59E0B"
    badge_text = "APPROVED & VERIFIED" if is_approved else status.upper()

    notes_section = f'<p style="font-size:12px; color:#CBD5E1; background:rgba(15,23,42,0.8); padding:10px; border-radius:8px;">{notes}</p>' if notes else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hospital Verification Status Update</title>
</head>
<body style="margin:0; padding:0; background-color:#050811; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#050811; padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px; background:#0B1120; border:1px solid rgba(255, 255, 255, 0.12); border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.8); overflow:hidden;">
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #FF2E54 0%, #38BDF8 100%);"></td>
          </tr>
          <tr>
            <td style="padding:28px 32px 12px 32px; text-align:center;">
              <h1 style="margin:0; font-size:24px; font-weight:900; color:#FFFFFF;">LIFNEX</h1>
              <p style="margin:4px 0 0 0; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#94A3B8; font-weight:700;">Connecting Lives When Every Second Matters</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px 32px; text-align:center;">
              <div style="display:inline-block; padding:4px 14px; background:rgba(16, 185, 129, 0.1); border:1px solid {badge_color}; border-radius:20px; color:{badge_color}; font-size:11px; font-weight:800; letter-spacing:0.08em; margin-bottom:16px;">
                STATUS: {badge_text}
              </div>
              <h2 style="margin:0 0 12px 0; font-size:18px; font-weight:800; color:#FFFFFF;">
                Hospital Verification Update
              </h2>
              <p style="margin:0 0 16px 0; font-size:13px; line-height:1.6; color:#CBD5E1;">
                Institutional review for <strong style="color:#FFFFFF;">{hospital_name}</strong> has been updated to: <span style="color:{badge_color}; font-weight:700;">{badge_text}</span>.
              </p>
              {notes_section}
              <div style="margin:20px 0;">
                <a href="https://lifnex.space/hospital/dashboard" style="display:inline-block; padding:12px 28px; background:linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color:#FFFFFF; text-decoration:none; font-weight:700; font-size:13px; border-radius:10px;">
                  Access Hospital Portal
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; background:rgba(2, 6, 23, 0.8); border-top:1px solid rgba(255, 255, 255, 0.06); text-align:center;">
              <p style="margin:0; font-size:11px; color:#64748B;">
                © 2026 Lifnex Healthcare Network. Connecting Lives When Every Second Matters.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


# ==============================================================================
# SMTP DISPATCH LOGIC (RESEND / TLS / SSL / MOCK)
# ==============================================================================

def send_smtp_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Sends an email using configured SMTP credentials (supports Resend: smtp.resend.com).
    Strictly handles TLS (port 587) vs SSL (port 465) mutually exclusively.
    Returns (success: bool, message: str)
    """
    if not is_smtp_configured():
        return False, "SMTP_NOT_CONFIGURED"

    smtp_user = get_smtp_username()
    from_header = f"{Config.SMTP_FROM_NAME} <{Config.SMTP_FROM}>"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_header
        msg["To"] = to_email

        # Fallback plain text
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        else:
            msg.attach(MIMEText("Please view this email in an HTML-capable email client.", "plain"))

        # Rich HTML content
        msg.attach(MIMEText(html_content, "html"))

        # Determine SSL vs STARTTLS mutually exclusively
        use_ssl = Config.SMTP_USE_SSL or (Config.SMTP_PORT == 465)
        use_tls = Config.SMTP_USE_TLS and not use_ssl

        if use_ssl:
            with smtplib.SMTP_SSL(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
                server.login(smtp_user, Config.SMTP_PASSWORD)
                server.sendmail(Config.SMTP_FROM, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
                if use_tls:
                    server.starttls()
                server.login(smtp_user, Config.SMTP_PASSWORD)
                server.sendmail(Config.SMTP_FROM, [to_email], msg.as_string())

        logger.info(f"Successfully dispatched email to {to_email} via SMTP relay ({Config.SMTP_HOST})")
        return True, "DELIVERED_VIA_SMTP"

    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error(f"SMTP authentication failure sending to {to_email}: {auth_err}")
        return False, "SMTP_AUTH_FAILED"
    except smtplib.SMTPConnectError as conn_err:
        logger.error(f"SMTP connection error to {Config.SMTP_HOST}:{Config.SMTP_PORT}: {conn_err}")
        return False, "SMTP_CONNECT_FAILED"
    except Exception as e:
        logger.error(f"SMTP delivery failed to {to_email}: {e}")
        return False, str(e)


# ==============================================================================
# CONVENIENCE DISPATCHERS
# ==============================================================================

def send_otp_email(to_email: str, otp_code: str, full_name: Optional[str] = None) -> Tuple[bool, str]:
    """
    Dispatches a real 6-digit OTP verification email to the user.
    Uses Resend/SMTP relay if configured, or reports Supabase Auth provider delivery status.
    """
    subject = f"Verify Your Lifnex Account — Code: {otp_code}"
    html = generate_otp_email_html(otp_code, full_name)
    plain_text = (
        f"Your Lifnex verification code is: {otp_code}. "
        f"Valid for 10 minutes. Connecting Lives When Every Second Matters."
    )

    # 1. If custom SMTP is configured, dispatch directly via SMTP relay
    if is_smtp_configured():
        success, msg = send_smtp_email(to_email, subject, html, plain_text)
        if success:
            return True, "DISPATCHED_SMTP"
        logger.warning(f"SMTP relay failed ({msg}); checking secondary delivery options.")

    # 2. Check if Supabase native Auth resend can be dispatched
    try:
        from backend.app.database.supabase_client import get_supabase_anon
        anon = get_supabase_anon()
        if anon:
            anon.auth.resend({"type": "signup", "email": to_email})
            logger.info(f"Supabase Auth confirmation dispatched to {to_email}")
            return True, "DISPATCHED_SUPABASE"
    except Exception as e:
        err_str = str(e).lower()
        if "rate limit" in err_str or "over_email" in err_str:
            logger.warning(f"Supabase default email rate limit reached: {e}")
            return False, "SUPABASE_EMAIL_RATE_LIMITED"
        if "not authorized" in err_str or "email_address_not_authorized" in err_str:
            logger.warning(f"Supabase default email recipient restriction triggered: {e}")
            return False, "SUPABASE_EMAIL_NOT_AUTHORIZED"
        logger.warning(f"Supabase resend attempt note: {e}")

    # 3. Fallback when SMTP is unconfigured
    if not is_smtp_configured():
        return False, "SMTP_UNCONFIGURED_RATE_LIMITED"

    return False, "DELIVERY_FAILED"


def send_password_reset_email(to_email: str, reset_target: str, full_name: Optional[str] = None) -> Tuple[bool, str]:
    """Dispatches a password reset email via SMTP relay or Supabase Auth."""
    subject = "Reset Your Lifnex Password"
    html = generate_password_reset_email_html(reset_target, full_name)
    plain_text = f"Reset your Lifnex password using this link or code: {reset_target}. Valid for 15 minutes."

    if is_smtp_configured():
        success, msg = send_smtp_email(to_email, subject, html, plain_text)
        if success:
            return True, "DISPATCHED_SMTP"

    # Supabase native password recovery
    try:
        from backend.app.database.supabase_client import get_supabase_anon
        anon = get_supabase_anon()
        if anon:
            anon.auth.reset_password_for_email(to_email)
            return True, "DISPATCHED_SUPABASE"
    except Exception as e:
        logger.warning(f"Supabase password reset dispatch error: {e}")

    if not is_smtp_configured():
        return False, "SMTP_UNCONFIGURED"

    return False, "DELIVERY_FAILED"


def send_blood_alert_email(
    to_email: str,
    blood_group: str,
    units_needed: int,
    hospital_name: str,
    city: str,
    urgency: str = "critical",
    requisition_id: str = ""
) -> Tuple[bool, str]:
    """Dispatches an urgent blood match notification email to a matched donor."""
    subject = f"🚨 URGENT: Blood Request for {blood_group} at {hospital_name}"
    html = generate_blood_request_alert_email_html(
        blood_group=blood_group,
        units_needed=units_needed,
        hospital_name=hospital_name,
        city=city,
        urgency=urgency,
        requisition_id=requisition_id
    )
    plain_text = (
        f"LIFNEX EMERGENCY ALERT: Urgent need for {units_needed} unit(s) of {blood_group} blood "
        f"at {hospital_name}, {city}. Urgency: {urgency.upper()}. "
        f"Log in to your Lifnex dashboard to respond: https://lifnex.space/donor/dashboard"
    )

    if is_smtp_configured():
        return send_smtp_email(to_email, subject, html, plain_text)

    return False, "SMTP_UNCONFIGURED"


def send_hospital_verification_email(
    to_email: str,
    hospital_name: str,
    status: str,
    notes: Optional[str] = None
) -> Tuple[bool, str]:
    """Dispatches a hospital institutional verification status email."""
    subject = f"Lifnex Hospital Verification Update: {status.upper()}"
    html = generate_hospital_verification_email_html(hospital_name, status, notes)
    plain_text = f"Your hospital verification status for {hospital_name} has been updated to: {status}."

    if is_smtp_configured():
        return send_smtp_email(to_email, subject, html, plain_text)

    return False, "SMTP_UNCONFIGURED"
