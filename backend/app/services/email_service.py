"""
EMAIL DISPATCH SERVICE FOR LIFNEX
Handles secure email OTP delivery for account verification and security alerts.
Supports direct SMTP delivery (Gmail, Resend, Sendgrid, custom relays) and Supabase Auth.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple, Optional
from backend.app.config import Config

logger = logging.getLogger(__name__)

def is_smtp_configured() -> bool:
    """Returns True if local SMTP environment variables are configured."""
    return bool(Config.SMTP_HOST and Config.SMTP_USER and Config.SMTP_PASSWORD)

def generate_otp_email_html(otp_code: str, full_name: Optional[str] = None) -> str:
    """Generates a responsive, cyber-medical Lifnex branded HTML email template."""
    display_name = full_name or "Lifnex User"
    
    # Format OTP digits with visual spacing
    digit_boxes = "".join(
        f'<span style="display:inline-block; width:38px; height:46px; line-height:46px; margin:0 4px; background:#0B1120; border:1px solid #FF2E54; border-radius:8px; color:#FFFFFF; font-size:24px; font-weight:800; font-family:monospace; text-align:center;">{d}</span>'
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
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:500px; background:#0B1120; border:1px solid rgba(255, 255, 255, 0.12); border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,46,84,0.15); overflow:hidden;">
          
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
              <h1 style="margin:0; font-size:22px; font-weight:900; color:#FFFFFF; letter-spacing:-0.02em;">LIFNEX</h1>
              <p style="margin:4px 0 0 0; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#94A3B8; font-weight:700;">Emergency Neural Blood Grid</p>
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
                <div>{digit_boxes}</div>
                <div style="margin-top:10px; font-size:11px; color:#F43F5E; font-weight:600;">Valid for 10 minutes • Single use only</div>
              </div>

              <!-- Security Notice -->
              <div style="background:rgba(2, 6, 23, 0.6); border:1px solid rgba(255, 255, 255, 0.05); border-radius:10px; padding:12px; font-size:11px; line-height:1.5; color:#94A3B8; text-align:left;">
                <strong style="color:#E2E8F0;">Security Advisory:</strong> Lifnex staff will never request this verification code. If you did not initiate this registration, please disregard this email.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; background:rgba(2, 6, 23, 0.8); border-top:1px solid rgba(255, 255, 255, 0.06); text-align:center;">
              <p style="margin:0; font-size:11px; color:#64748B;">
                © 2026 Lifnex Healthcare Network. Real-Time Autonomous Emergency Mesh.
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

def send_smtp_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> Tuple[bool, str]:
    """
    Sends an email using configured SMTP credentials.
    Returns (success: bool, message: str)
    """
    if not is_smtp_configured():
        return False, "SMTP_NOT_CONFIGURED"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Lifnex Emergency Network <{Config.SMTP_FROM}>"
        msg["To"] = to_email

        # Fallback plain text
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        else:
            msg.attach(MIMEText("Please view this email in an HTML-capable email client.", "plain"))

        # HTML content
        msg.attach(MIMEText(html_content, "html"))

        if Config.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
                server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
                server.sendmail(Config.SMTP_FROM, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
                if Config.SMTP_USE_TLS:
                    server.starttls()
                server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
                server.sendmail(Config.SMTP_FROM, [to_email], msg.as_string())

        logger.info(f"Successfully dispatched email to {to_email} via SMTP relay ({Config.SMTP_HOST})")
        return True, "DELIVERED_VIA_SMTP"

    except Exception as e:
        logger.error(f"SMTP delivery failed to {to_email}: {e}")
        return False, str(e)

def send_otp_email(to_email: str, otp_code: str, full_name: Optional[str] = None) -> Tuple[bool, str]:
    """
    Dispatches a real 6-digit OTP verification email to the user.
    Uses SMTP relay if configured, or reports Supabase Auth provider delivery status.
    """
    subject = f"Verify Your Lifnex Account — Code: {otp_code}"
    html = generate_otp_email_html(otp_code, full_name)
    plain_text = f"Your Lifnex verification code is: {otp_code}. Valid for 10 minutes. Do not share this code."

    # 1. If custom SMTP is configured, send directly via SMTP relay
    if is_smtp_configured():
        success, msg = send_smtp_email(to_email, subject, html, plain_text)
        if success:
            return True, "DISPATCHED_SMTP"
        logger.warning(f"SMTP relay failed ({msg}); evaluating secondary delivery routes.")

    # 2. Check if Supabase native email can be used
    from backend.app.database.supabase_client import get_supabase_anon
    anon = get_supabase_anon()
    if anon:
        try:
            # Trigger Supabase Auth resend to dispatch confirmation email
            anon.auth.resend({"type": "signup", "email": to_email})
            logger.info(f"Supabase Auth confirmation dispatched to {to_email}")
            return True, "DISPATCHED_SUPABASE"
        except Exception as e:
            err_str = str(e).lower()
            if "rate limit" in err_str or "over_email" in err_str:
                logger.warning(f"Supabase default email rate limit reached: {e}")
                return False, "SUPABASE_EMAIL_RATE_LIMITED"
            logger.warning(f"Supabase resend attempt note: {e}")

    # If neither local SMTP is configured nor Supabase sent it
    if not is_smtp_configured():
        return False, "SMTP_UNCONFIGURED_RATE_LIMITED"

    return False, "DELIVERY_FAILED"
