"""
LIFNEX CORE CONFIGURATION REDIRECT
Authoritative source is backend.app.config
This module re-exports Config to guarantee single-source-of-truth configuration.
"""

from backend.app.config import Config

__all__ = ["Config"]
