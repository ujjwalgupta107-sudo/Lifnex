"""
LIFNEX CORE CONFIGURATION
Handles environment variables, Supabase connection endpoints, and security flags
Enforces strict staging project identity and blocks prohibited production endpoints.
"""

import os
import re
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Single authoritative source: project root .env
_root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
AUTHORITATIVE_ENV_PATH = os.path.join(_root_dir, ".env")

if os.path.exists(AUTHORITATIVE_ENV_PATH):
    load_dotenv(AUTHORITATIVE_ENV_PATH, override=True)
else:
    load_dotenv()

# Security Allowlist & Blocklist
APPROVED_STAGING_PROJECT_REFS = {"jejnuespiisksqfgqwsg", "jejnuespiiksqfgqwsg", "adrtuldhyrlhuelpeews"}
PRIMARY_STAGING_PROJECT_REF = "jejnuespiisksqfgqwsg"
PROHIBITED_PROJECT_REFS = {"ygbprigcrooveopipkcl", "krvxybseqaxeculpgveg"}

def extract_project_ref(url: str) -> str:
    """Extracts project reference from a Supabase URL"""
    if not url:
        return ""
    match = re.search(r"https?://([a-zA-Z0-9_-]+)\.supabase\.co", url)
    return match.group(1) if match else ""

class Config:
    # Flask Settings
    SECRET_KEY = os.getenv("SECRET_KEY", "lifnex-dev-secret-key-2026")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"
    IS_DEV = os.getenv("FLASK_ENV", "development") == "development" or os.getenv("FLASK_DEBUG", "1") == "1"

    # Supabase Configuration (Defaults to new primary staging project: jejnuespiiksqfgqwsg)
    SUPABASE_URL = os.getenv("SUPABASE_URL", f"https://{PRIMARY_STAGING_PROJECT_REF}.supabase.co")
    SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
    SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", f"https://{PRIMARY_STAGING_PROJECT_REF}.supabase.co/auth/v1/.well-known/jwks.json")

    # Authoritative path info
    AUTHORITATIVE_ENV_PATH = AUTHORITATIVE_ENV_PATH
    APPROVED_STAGING_PROJECT_REF = PRIMARY_STAGING_PROJECT_REF

    # Google Gemini AI Settings
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # SMTP Email Relay Configuration (Supports Resend: smtp.resend.com, Gmail, or Custom SMTP)
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER", "")
    SMTP_USER = SMTP_USERNAME  # Backwards compatibility alias
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "noreply@lifnex.space"))
    SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Lifnex Emergency Network")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "1") == "1"
    SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "0") == "1"

    # CORS & Frontend URL
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "https://lifnex.vercel.app")

    @classmethod
    def get_project_ref(cls) -> str:
        """Returns the project reference of the configured Supabase URL"""
        return extract_project_ref(cls.SUPABASE_URL)

    @classmethod
    def validate_staging_project(cls) -> tuple[bool, str]:
        """
        Validates that the configured project is strictly an approved staging project.
        Rejects prohibited production references or unknown project references.
        """
        ref = cls.get_project_ref()
        if ref in PROHIBITED_PROJECT_REFS:
            err = f"CRITICAL: Connection to prohibited production project '{ref}' is blocked."
            logger.critical(err)
            return False, err
        if ref and ref not in APPROVED_STAGING_PROJECT_REFS:
            err = f"WARNING: Project '{ref}' does not match approved staging references {APPROVED_STAGING_PROJECT_REFS}."
            logger.warning(err)
            return False, err
        return True, "Valid staging project"

    @classmethod
    def is_supabase_configured(cls) -> bool:
        """Returns True if Supabase keys are configured and project reference is valid staging"""
        is_valid_project, _ = cls.validate_staging_project()
        if not is_valid_project:
            return False

        return bool(
            cls.SUPABASE_URL
            and cls.SUPABASE_PUBLISHABLE_KEY
            and cls.SUPABASE_SECRET_KEY
            and cls.SUPABASE_PUBLISHABLE_KEY != "sb_publishable_anon_key_here"
            and cls.SUPABASE_SECRET_KEY != "sb_secret_service_role_key_here"
        )


