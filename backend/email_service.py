"""
Email sending via Resend API.
Uses plain httpx (no extra SDK needed).
"""
import os
import html
import httpx
from config import RESEND_API_KEY, FROM_EMAIL, FRONTEND_URL, APP_NAME
import logging

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html: str) -> bool:
    """Send an email via Resend API. Returns True on success."""
    if not RESEND_API_KEY:
        logger.warning("⚠️  RESEND_API_KEY not set — skipping email send")
        return False
    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        if resp.status_code >= 400:
            logger.error(f"❌ Resend API Error ({resp.status_code}): {resp.text}")
            return False
        
        logger.info(f"✅ Email sent to {to} | Response: {resp.text}")
        return True
    except Exception as e:
        logger.error(f"❌ Email exception: {e}")
        return False


def send_verification_email(to: str, token: str) -> bool:
    """Send the email verification code."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 background: #09090b; color: #e4e4e7; margin: 0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #18181b;
                  border: 1px solid #27272a; border-radius: 12px; padding: 40px;">

        <!-- Logo -->
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
          <div style="width: 32px; height: 32px; background: #10b981;
                      border-radius: 8px; display: flex; align-items: center;
                      justify-content: center; font-weight: bold; color: black;">B</div>
          <span style="font-size: 18px; font-weight: 700; color: #fff;">Backport</span>
        </div>

        <h1 style="font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 8px;">
          Verify your email address
        </h1>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
          Thanks for signing up! Click the button below to verify your email and
          activate your Backport account. This link expires in <strong style="color:#e4e4e7">24 hours</strong>.
        </p>

        <!-- Code Block -->
        <div style="background: #0f172a; padding: 20px; border-radius: 8px; border: 1px dashed #10b981; text-align: center; margin-bottom: 28px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;">{token}</span>
        </div>

        <p style="color: #71717a; font-size: 13px; margin: 0 0 8px;">
          Return to the application and enter this code to verify your email.
        </p>

        <hr style="border: none; border-top: 1px solid #27272a; margin: 0 0 20px;">
        <p style="color: #52525b; font-size: 12px; margin: 0;">
          If you didn't create a Backport account, you can safely ignore this email.<br>
          © 2026 Backport • MIT Licensed • Made with ❤️ in India
        </p>
      </div>
    </body>
    </html>
    """
    return send_email(to, f"Verify your {APP_NAME} email address", html)


def send_password_reset_email(to: str, token: str) -> bool:
    """Send a password reset code."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 background: #09090b; color: #e4e4e7; margin: 0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #18181b;
                  border: 1px solid #27272a; border-radius: 12px; padding: 40px;">

        <!-- Logo -->
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
          <div style="width: 32px; height: 32px; background: #10b981;
                      border-radius: 8px; display: flex; align-items: center;
                      justify-content: center; font-weight: bold; color: black;">B</div>
          <span style="font-size: 18px; font-weight: 700; color: #fff;">Backport</span>
        </div>

        <h1 style="font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 8px;">
          Reset your Backport password
        </h1>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
          We received a request to reset the password for your Backport account.
          Click the button below to choose a new password. This link expires in <strong style="color:#e4e4e7">1 hour</strong>.
        </p>

        <!-- Code Block -->
        <div style="background: #0f172a; padding: 20px; border-radius: 8px; border: 1px dashed #10b981; text-align: center; margin-bottom: 28px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;">{token}</span>
        </div>

        <p style="color: #71717a; font-size: 13px; margin: 0 0 8px;">
          Return to the application and enter this code to securely update your password.
        </p>

        <hr style="border: none; border-top: 1px solid #27272a; margin: 0 0 20px;">
        <p style="color: #52525b; font-size: 12px; margin: 0;">
          If you didn't request a password reset, you can safely ignore this email.<br>
          © 2026 Backport • MIT Licensed • Made with ❤️ in India
        </p>
      </div>
    </body>
    </html>
    """
    return send_email(to, f"Reset your {APP_NAME} password", html)


def send_welcome_email(to: str, name: str = "") -> bool:
    """Send a welcome email after verification."""
    dashboard_url = f"{FRONTEND_URL}/dashboard"
    safe_name = html.escape(name or to.split("@")[0])
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 background: #09090b; color: #e4e4e7; margin: 0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #18181b;
                  border: 1px solid #27272a; border-radius: 12px; padding: 40px;">

        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
          <div style="width: 32px; height: 32px; background: #10b981;
                      border-radius: 8px; font-weight: bold; color: black;
                      display: flex; align-items: center; justify-content: center;">B</div>
          <span style="font-size: 18px; font-weight: 700; color: #fff;">Backport</span>
        </div>

        <h1 style="font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 8px;">
          Welcome to Backport, {safe_name}! 🎉
        </h1>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
          Your email is verified and your account is active. You can now shield any
          API backend with rate limiting, WAF, caching, and idempotency — in seconds.
        </p>

        <a href="{dashboard_url}"
           style="display: inline-block; background: #10b981; color: #000;
                  font-weight: 700; font-size: 15px; text-decoration: none;
                  padding: 12px 28px; border-radius: 8px; margin-bottom: 28px;">
          Go to Dashboard →
        </a>

        <hr style="border: none; border-top: 1px solid #27272a; margin: 0 0 20px;">
        <p style="color: #52525b; font-size: 12px; margin: 0;">
          Need help? Reply to this email or visit our docs.<br>
          © 2026 Backport • MIT Licensed
        </p>
      </div>
    </body>
    </html>
    """
    return send_email(to, f"Welcome to {APP_NAME} — you're all set! 🚀", html)


def send_feedback_notification(feedback_type: str, message: str, user_email: str, user_name: str = "") -> bool:
    """Send a notification email to the admin when a user submits feedback or bug report."""
    admin_to = os.getenv("ADMIN_EMAIL", "admin@backport.in")
    if not admin_to:
        logger.warning("ADMIN_EMAIL not properly configured — skipping feedback notification")
        return False

    type_labels = {
        "bug": "Bug Report",
        "feature": "Feature Request",
        "improvement": "Improvement",
        "general": "General Feedback",
    }
    type_label = html.escape(type_labels.get(feedback_type, feedback_type))
    safe_name = html.escape(user_name or user_email.split("@")[0])
    safe_email = html.escape(user_email)
    safe_message = html.escape(message)
    # Color code by type
    type_colors = {"bug": "#ef4444", "feature": "#6366f1", "improvement": "#f59e0b", "general": "#10b981"}
    color = type_colors.get(feedback_type, "#10b981")

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 background: #09090b; color: #e4e4e7; margin: 0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #18181b;
                  border: 1px solid #27272a; border-radius: 12px; padding: 40px;">

        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
          <div style="width: 32px; height: 32px; background: #10b981;
                      border-radius: 8px; display: flex; align-items: center;
                      justify-content: center; font-weight: bold; color: black;">B</div>
          <span style="font-size: 18px; font-weight: 700; color: #fff;">Backport</span>
        </div>

        <h1 style="font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 8px;">
          New {type_label}
        </h1>
        <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 24px;">
          A user just submitted a {type_label.lower()} on Backport.
        </p>

        <!-- Type Badge -->
        <div style="display: inline-block; background: {color}20; color: {color};
                    padding: 4px 12px; border-radius: 20px; font-size: 12px;
                    font-weight: 700; text-transform: uppercase; margin-bottom: 20px;">
          {type_label}
        </div>

        <!-- Message -->
        <div style="background: #0f172a; padding: 16px; border-radius: 8px;
                    border: 1px solid #1e293b; margin-bottom: 20px;">
          <p style="color: #e4e4e7; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">
{safe_message}
          </p>
        </div>

        <!-- User Info -->
        <div style="border-top: 1px solid #27272a; padding-top: 16px;">
          <p style="color: #71717a; font-size: 12px; margin: 0 0 4px;">
            <strong style="color: #a1a1aa;">From:</strong> {safe_name}
          </p>
          <p style="color: #71717a; font-size: 12px; margin: 0;">
            <strong style="color: #a1a1aa;">Email:</strong> {safe_email}
          </p>
        </div>

      </div>
    </body>
    </html>
    """
    return send_email(admin_to, f"[Backport] New {type_label}: {safe_message[:60]}{'...' if len(safe_message) > 60 else ''}", html)


def send_contact_sales_email(name: str, email: str, company: str, message: str) -> bool:
    """Send an email to the admin when someone fills the Contact Sales form."""
    admin_to = os.getenv("ADMIN_EMAIL", "admin@backport.in")
    if not admin_to:
        logger.warning("ADMIN_EMAIL not properly configured — skipping contact sales email")
        return False

    safe_name = html.escape(name)
    safe_email = html.escape(email)
    safe_company = html.escape(company) if company else 'Not specified'
    safe_message = html.escape(message)

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 background: #09090b; color: #e4e4e7; margin: 0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #18181b;
                  border: 1px solid #27272a; border-radius: 12px; padding: 40px;">

        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
          <div style="width: 32px; height: 32px; background: #f97316;
                      border-radius: 8px; display: flex; align-items: center;
                      justify-content: center; font-weight: bold; color: black;">$</div>
          <span style="font-size: 18px; font-weight: 700; color: #fff;">Enterprise Inquiry</span>
        </div>

        <h1 style="font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 8px;">
          New Enterprise Sales Inquiry
        </h1>
        <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 24px;">
          Someone is interested in the Enterprise plan and wants to talk to you.
        </p>

        <!-- Info Fields -->
        <div style="background: #0f172a; padding: 20px; border-radius: 8px;
                    border: 1px solid #1e293b; margin-bottom: 20px;">
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px;">
            <strong style="color: #fff;">Name:</strong> {safe_name}
          </p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px;">
            <strong style="color: #fff;">Email:</strong> <a href="mailto:{safe_email}" style="color: #f97316;">{safe_email}</a>
          </p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px;">
            <strong style="color: #fff;">Company:</strong> {safe_company}
          </p>
          <hr style="border: none; border-top: 1px solid #27272a; margin: 0 0 12px;">
          <p style="color: #e4e4e7; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">
{safe_message}
          </p>
        </div>

        <a href="mailto:{safe_email}?subject=Re:%20Backport%20Enterprise%20Plan"
           style="display: inline-block; background: #f97316; color: #000;
                  font-weight: 700; font-size: 14px; text-decoration: none;
                  padding: 10px 24px; border-radius: 8px;">
          Reply to {safe_email} →
        </a>

      </div>
    </body>
    </html>
    """
    return send_email(admin_to, f"[Backport] Enterprise Inquiry from {safe_name} ({safe_company})", html)
