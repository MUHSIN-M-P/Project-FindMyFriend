from functools import wraps
from flask import jsonify, request
from flask_login import current_user

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
