"""
LIFNEX FLASK APPLICATION FACTORY
Initializes Blueprints, CORS, Error Handlers, and static file routers
"""

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from backend.app.config import Config
from backend.app.routes.health import health_bp
from backend.app.routes.hospitals import hospitals_bp
from backend.app.routes.blood_requests import blood_requests_bp
from backend.app.routes.auth import auth_bp
from backend.app.routes.donors import donors_bp
from backend.app.routes.ai import ai_bp
from backend.app.routes.notifications import notifications_bp
from backend.app.api.v1.matching import matching_bp

def create_app(config_class=Config) -> Flask:
    # Resolve frontend paths
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    frontend_dir = os.path.join(base_dir, "frontend")
    dist_dir = os.path.join(frontend_dir, "dist")
    static_dir = os.path.join(frontend_dir, "static")

    app = Flask(
        __name__,
        static_folder=static_dir,
        static_url_path="/static"
    )
    app.config.from_object(config_class)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": config_class.CORS_ORIGINS}})

    # Register API Blueprints
    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(hospitals_bp, url_prefix="/api/v1/hospitals")
    app.register_blueprint(blood_requests_bp, url_prefix="/api/v1/blood-requests")
    app.register_blueprint(blood_requests_bp, url_prefix="/api/v1/requests", name="blood_requests_alias")
    app.register_blueprint(donors_bp, url_prefix="/api/v1/donors")
    app.register_blueprint(matching_bp, url_prefix="/api/v1/matching")
    app.register_blueprint(ai_bp, url_prefix="/api/v1/ai")
    app.register_blueprint(notifications_bp, url_prefix="/api/v1/notifications")

    # Security Headers Hook
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
        return response

    # Frontend Static, Built Assets & HTML Routes
    @app.route("/", defaults={"filename": "index.html"})
    @app.route("/<path:filename>")
    def serve_frontend(filename):
        # Allow API routes to be handled by blueprints
        if filename.startswith("api/"):
            return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "API endpoint not found."}}), 404

        # Serve static assets from frontend/static
        if filename.startswith("static/"):
            subpath = filename[len("static/"):]
            return send_from_directory(static_dir, subpath)

        # Serve compiled Vite assets if requesting /assets/
        if filename.startswith("assets/"):
            subpath = filename[len("assets/"):]
            if os.path.exists(os.path.join(dist_dir, "assets", subpath)):
                return send_from_directory(os.path.join(dist_dir, "assets"), subpath)
            if os.path.exists(os.path.join(frontend_dir, "src", "assets", subpath)):
                return send_from_directory(os.path.join(frontend_dir, "src", "assets"), subpath)
            if os.path.exists(os.path.join(static_dir, "assets", subpath)):
                return send_from_directory(os.path.join(static_dir, "assets"), subpath)

        # Priority 1: Serve built production files from dist if present
        if os.path.exists(dist_dir):
            dist_file = os.path.join(dist_dir, filename)
            if os.path.exists(dist_file) and os.path.isfile(dist_file):
                return send_from_directory(dist_dir, filename)
            if os.path.exists(dist_file + ".html") and os.path.isfile(dist_file + ".html"):
                return send_from_directory(dist_dir, filename + ".html")

        # Priority 2: Serve source HTML files from frontend
        file_path = os.path.join(frontend_dir, filename)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(frontend_dir, filename)
        if os.path.exists(file_path + ".html") and os.path.isfile(file_path + ".html"):
            return send_from_directory(frontend_dir, filename + ".html")

        # Default fallback for SPA navigations
        if os.path.exists(os.path.join(dist_dir, "index.html")):
            return send_from_directory(dist_dir, "index.html")
        return send_from_directory(frontend_dir, "index.html")

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found_handler(e):
        return jsonify({
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": "The requested API resource does not exist on Lifnex platform."
            }
        }), 404

    @app.errorhandler(500)
    def internal_error_handler(e):
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred."
            }
        }), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
