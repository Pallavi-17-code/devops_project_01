from flask import Blueprint, jsonify
from app.config.db import query_db
import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/', methods=['GET'])
def health_check():
    status = {
        "status": "UP",
        "timestamp": datetime.datetime.now().isoformat(),
        "services": {
            "api": "OK",
            "database": "UNKNOWN"
        }
    }
    
    # Check DB
    db_test = query_db("SELECT 1", one=True)
    if db_test:
        status["services"]["database"] = "OK"
    else:
        status["status"] = "DEGRADED"
        status["services"]["database"] = "DOWN"
        
    return jsonify(status), 200 if status["status"] == "UP" else 503

@health_bp.route('/test', methods=['GET'])
def test_api():
    return jsonify({"message": "Flask API is working correctly"}), 200
