"""
LIFNEX CORE CONFIGURATION
Handles environment variables, Supabase connection endpoints, and security flags
"""

import os
from dotenv import load_dotenv

# Search for .env in current directory, backend directory, and project root
load_dotenv()
_backend_dir_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(_backend_dir_env):
    load_dotenv(_backend_dir_env)
_root_dir_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
if os.path.exists(_root_dir_env):
    load_dotenv(_root_dir_env)

class Config:
    # Flask Settings
    SECRET_KEY = os.getenv("SECRET_KEY", "lifnex-dev-secret-key-2026")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"
    IS_DEV = os.getenv("FLASK_ENV", "development") == "development" or os.getenv("FLASK_DEBUG", "1") == "1"

    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ygbprigcrooveopipkcl.supabase.co")
    SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
    SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", "")

    # Google Gemini AI Settings
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # SMTP Email Relay Configuration
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "noreply@lifnex.org"))
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "1") == "1"
    SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "0") == "1"

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    @classmethod
    def is_supabase_configured(cls) -> bool:
        """Returns True if the Supabase keys are populated with non-empty values"""
        return bool(
            cls.SUPABASE_URL
            and cls.SUPABASE_PUBLISHABLE_KEY
            and cls.SUPABASE_SECRET_KEY
            and cls.SUPABASE_PUBLISHABLE_KEY != "sb_publishable_anon_key_here"
            and cls.SUPABASE_SECRET_KEY != "sb_secret_service_role_key_here"
        )

