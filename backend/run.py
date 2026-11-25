import os
import sys
import json
import traceback

_HERE = os.path.dirname(os.path.abspath(__file__))
_PARENT = os.path.abspath(os.path.join(_HERE, ".."))

# Make sure all vendor and site-packages directories are on sys.path
for base in [_HERE, _PARENT, "/var/task", "/var/lang/lib/python3.12"]:
    if not os.path.isdir(base):
        continue
    for name in ["_vendor", "site-packages", ".venv"]:
        target = os.path.join(base, name)
        if os.path.isdir(target) and target not in sys.path:
            sys.path.insert(0, target)
        # Check subdirectories of .venv
        if name == ".venv" and os.path.isdir(target):
            for r, d, _ in os.walk(target):
                for sd in d:
                    if sd in ("site-packages", "dist-packages"):
                        sp = os.path.join(r, sd)
                        if sp not in sys.path:
                            sys.path.insert(0, sp)

for p in [_HERE, _PARENT]:
    if p not in sys.path:
        sys.path.insert(0, p)

_real_app = None
_init_error = None

try:
    from backend.app import create_app
    _real_app = create_app()
except Exception as e:
    _vendor_dir = os.path.join(_HERE, "_vendor")
    _init_error = {
        "error_type": type(e).__name__,
        "error_message": str(e),
        "traceback": traceback.format_exc(),
        "sys_path": sys.path,
        "vendor_exists": os.path.exists(_vendor_dir),
        "vendor_contents": os.listdir(_vendor_dir)[:30] if os.path.isdir(_vendor_dir) else [],
        "here_contents": os.listdir(_HERE) if os.path.isdir(_HERE) else [],
    }

class WSGIApplication:
    def __call__(self, environ, start_response):
        global _real_app, _init_error
        if _init_error is not None:
            status = "200 OK"
            headers = [("Content-Type", "application/json; charset=utf-8")]
            start_response(status, headers)
            body = json.dumps({
                "success": False,
                "error": {
                    "code": "BACKEND_STARTUP_EXCEPTION",
                    "details": _init_error
                }
            }, indent=2)
            return [body.encode("utf-8")]
        
        try:
            return _real_app(environ, start_response)
        except Exception as runtime_err:
            status = "200 OK"
            headers = [("Content-Type", "application/json; charset=utf-8")]
            start_response(status, headers)
            body = json.dumps({
                "success": False,
                "error": {
                    "code": "BACKEND_RUNTIME_EXCEPTION",
                    "details": {
                        "error_type": type(runtime_err).__name__,
                        "error_message": str(runtime_err),
                        "traceback": traceback.format_exc(),
                    }
                }
            }, indent=2)
            return [body.encode("utf-8")]

# Vercel entrypoint callable
app = WSGIApplication()

if __name__ == "__main__":
    if _real_app:
        _real_app.run(host="0.0.0.0", port=5000, debug=True)
    else:
        print("Initialization error:", _init_error)
