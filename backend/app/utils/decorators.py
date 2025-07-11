from functools import wraps
from flask import jsonify, request

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
