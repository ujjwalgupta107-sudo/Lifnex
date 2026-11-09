"""
LIFNEX CORE CONFIGURATION
Handles environment variables, Supabase connection endpoints, and security flags
"""

import os
from dotenv import load_dotenv

# Search for .env in current directory and backend directory
load_dotenv()
backend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
if os.path.exists(backend_env_path):
    load_dotenv(backend_env_path)

class Config:
    # Flask Settings
    SECRET_KEY = os.getenv("SECRET_KEY", "lifnex-dev-secret-key-2026")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://paxkftydmvibrjtroinn.supabase.co")
    SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
    SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", "")

    # Google Gemini AI Settings
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

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

