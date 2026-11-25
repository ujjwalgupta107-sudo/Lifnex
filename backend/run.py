import os
import sys
import json
import traceback

_HERE = os.path.dirname(os.path.abspath(__file__))
_PARENT = os.path.abspath(os.path.join(_HERE, ".."))

# Auto-discover site-packages installed by uv, pip, or virtualenv
_potential_site_packages = []
for base in [_HERE, _PARENT, "/var/task", "/var"]:
    if not os.path.isdir(base):
        continue
    # Check .venv
    for root, dirs, _ in os.walk(base):
        # Don't recurse excessively deep
        depth = root[len(base):].count(os.sep)
        if depth > 4:
            continue
        for d in dirs:
            if d in ("site-packages", "dist-packages"):
                full_sp = os.path.join(root, d)
                if full_sp not in sys.path and full_sp not in _potential_site_packages:
                    _potential_site_packages.append(full_sp)

for sp in _potential_site_packages:
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
    _init_error = {
        "error_type": type(e).__name__,
        "error_message": str(e),
        "traceback": traceback.format_exc(),
        "sys_path": sys.path,
        "discovered_site_packages": _potential_site_packages,
        "cwd": os.getcwd(),
        "dir_contents": os.listdir(_HERE) if os.path.isdir(_HERE) else [],
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
