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

try:
    from backend.app import create_app
    app = create_app()
except Exception as _startup_err:
    from flask import Flask, jsonify
    app = Flask(__name__)
    _err_type = type(_startup_err).__name__
    _err_msg = str(_startup_err)

    @app.route("/api/<path:_sub>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    @app.route("/", defaults={"_sub": ""}, methods=["GET", "POST"])
    def _startup_error(_sub=""):
        return jsonify({
            "success": False,
            "error": {
                "code": "BACKEND_STARTUP_ERROR",
                "type": _err_type,
                "message": _err_msg,
            },
        }), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
