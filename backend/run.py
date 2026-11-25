import os
import sys
import types

_HERE = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.abspath(os.path.join(_HERE, ".."))
if _PARENT_DIR not in sys.path:
    sys.path.insert(0, _PARENT_DIR)

# When deployed with backend/ as the isolated service root (e.g. Vercel),
# the parent directory does not contain a 'backend/' folder; alias 'backend' -> _HERE.
try:
    import backend.app  # noqa: F401
except ModuleNotFoundError:
    _pkg = types.ModuleType("backend")
    _pkg.__path__ = [_HERE]
    sys.modules["backend"] = _pkg

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
