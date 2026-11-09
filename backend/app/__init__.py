"""
LIFNEX FLASK APPLICATION FACTORY
Initializes Blueprints, CORS, Error Handlers, and static file routers
"""

from flask import Flask, jsonify
from flask_cors import CORS
from backend.app.config import Config
from backend.app.routes.health import health_bp
from backend.app.routes.hospitals import hospitals_bp
from backend.app.routes.blood_requests import blood_requests_bp
from backend.app.routes.auth import auth_bp
from backend.app.api.v1.donors import donors_bp
from backend.app.api.v1.matching import matching_bp

def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
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
