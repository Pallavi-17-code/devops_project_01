from functools import wraps
from flask import request, jsonify
import jwt
import os

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': 'Token is missing!', 'success': False}), 401

        try:
            # Decode token
            data = jwt.decode(token, os.getenv('JWT_SECRET', 'default_secret'), algorithms=["HS256"])
            # In a real app, you might fetch the user from DB here
            # current_user = query_db("SELECT * FROM users WHERE id = %s", (data['id'],), one=True)
            request.user = data
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'success': False}), 401

        return f(*args, **kwargs)

    return decorated
