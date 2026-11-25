"""
PACKAGE POINTER TO ALLOW 'import backend.app' WHEN DEPLOYED WITH ROOT 'backend'
"""
import os
import sys

_PARENT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _PARENT not in sys.path:
    sys.path.insert(0, _PARENT)

__path__ = [_PARENT]
