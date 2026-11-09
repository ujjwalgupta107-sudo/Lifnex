"""
VERCEL SERVERLESS WSGI ENTRYPOINT
Exposes the Flask WSGI callable for Vercel Python Serverless Runtime (@vercel/python).
"""

import sys
import os

# Ensure repository root is on sys.path so 'backend' package imports reliably
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.abspath(os.path.join(ROOT_DIR, ".."))
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from backend.app import create_app

# Instantiate the application
app = create_app()

# Vercel's Python runtime looks for 'app' by default

