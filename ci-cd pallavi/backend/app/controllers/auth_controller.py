from flask import request, jsonify
import bcrypt
import jwt
import datetime
import os
from app.config.db import query_db

def generate_token(user_id):
    payload = {
        'id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, os.getenv('JWT_SECRET', 'default_secret'), algorithm='HS256')

def register_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"success": False, "message": "Please provide all fields"}), 400

    # Check if user exists
    existing_user = query_db("SELECT id FROM users WHERE email = %s", (email,), one=True)
    if existing_user:
        return jsonify({"success": False, "message": "User already exists"}), 400

    # Hash password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Insert user
    try:
        new_user = query_db(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id, username, email",
            (username, email, hashed_password)
        )
        
        if not new_user:
            return jsonify({"success": False, "message": "Failed to create user"}), 500

        user_id, uname, uemail = new_user
        
        return jsonify({
            "success": True,
            "data": {
                "id": user_id,
                "username": uname,
                "email": uemail,
                "token": generate_token(user_id)
            }
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Please provide email and password"}), 400

    # Find user
    user = query_db("SELECT id, username, email, password FROM users WHERE email = %s", (email,), one=True)
    
    if not user:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    user_id, uname, uemail, upass = user

    # Check password
    if not bcrypt.checkpw(password.encode('utf-8'), upass.encode('utf-8')):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    return jsonify({
        "success": True,
        "data": {
            "id": user_id,
            "username": uname,
            "email": uemail,
            "token": generate_token(user_id)
        }
    }), 200
