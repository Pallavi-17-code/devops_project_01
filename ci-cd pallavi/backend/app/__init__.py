from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'default_secret')

    # Register Blueprints (Routes)
    from .routes.auth_routes import auth_bp
    from .routes.health_routes import health_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(health_bp, url_prefix='/api/health')

    # Root route
    @app.route('/')
    def index():
        return jsonify({
            "success": True,
            "message": "Welcome to the CI/CD Dashboard Flask API",
            "endpoints": {
                "health": "/api/health",
                "auth": "/api/auth"
            }
        })

    # Global Error Handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Pass through HTTP errors
        if hasattr(e, 'code'):
            return jsonify({"success": False, "message": str(e)}), e.code
        
        # Generic server error
        return jsonify({
            "success": False, 
            "message": "Internal Server Error",
            "error": str(e)
        }), 500

    return app
