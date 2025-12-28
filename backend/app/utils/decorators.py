from functools import wraps
from flask import jsonify, request
from flask_login import current_user
import jwt
import os
from app.models import db, User

def validate_json(f):
    """Decorator to validate JSON requests"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        return f(*args, **kwargs)
    return decorated_function

def validate_form(f):
    """Decorator to validate form requests"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.form:
            return jsonify({"error": "Form data required"}), 400
        return f(*args, **kwargs)
    return decorated_function

def authenticate_user(f):
    """Decorator to authenticate user and validate they can only access their own data"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "Authentication required"}), 401
        
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        
        if 'userId' not in data:
            return jsonify({"error": "userId is required in request body"}), 400
        
        if current_user.id != data['userId']:
            return jsonify({"error": "Access denied: You can only access your own data"}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def jwt_required(f):
    """Decorator to authenticate users with JWT tokens for API access"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
         # First try to get token from cookie (preferred for SPA)
        token = request.cookies.get('auth_token')
        
        # Fallback to Authorization header for API calls
        if not token:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({"error": "Missing authentication token"}), 401
        secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
        
        try:
            payload = jwt.decode(token, secret_key, algorithms=["HS256"])
            user_id = payload.get("user_id")
            
            if not user_id:
                return jsonify({"error": "Invalid token payload"}), 401
                
            user = db.get_or_404(User, user_id)
            request.jwt_user = user
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"error": "Authentication failed"}), 401
    
    return decorated_function
