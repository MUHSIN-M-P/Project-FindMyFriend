from flask import jsonify, redirect, request, abort, url_for, make_response
from app import app  
from app.models import db, User
from app.services.auth_service import AuthService
from app.utils.decorators import jwt_required
from flask_login import login_required, logout_user, login_user, current_user, LoginManager
from authlib.integrations.flask_client import OAuth
from http import HTTPStatus
import jwt
import os
from datetime import datetime, timedelta

login_manager = LoginManager()
oauth = OAuth()

login_manager.init_app(app)
login_manager.login_view = 'login'

oauth.init_app(app)

google = oauth.register(
    name="google",
    client_id=app.config.get("GOOGLE_CLIENT_ID"),
    client_secret=app.config.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url=app.config.get(
        "GOOGLE_DISCOVERY_URL",
        "https://accounts.google.com/.well-known/openid-configuration",
    ),
        api_base_url="https://www.googleapis.com/oauth2/v1/",
    client_kwargs={"scope": "openid email profile"},
)

@login_manager.user_loader
def load_user(user_id):
    return db.get_or_404(User, user_id)

@login_manager.unauthorized_handler
def unauthorized():
    if request.endpoint and request.endpoint.startswith('api'):
        abort(HTTPStatus.UNAUTHORIZED)
    return redirect(url_for('login'))

@app.route('/login')
def login():
    if current_user.is_authenticated:
        # Already logged in, redirect to frontend
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return redirect(frontend_url)

    if request.args.get('code'):
        try:
            token = google.authorize_access_token()
            user_info = google.get('userinfo').json()

            # Email validation (uncomment for production)
            # email = user_info['email']
            # hosted_domain = user_info.get("hd")
            # if hosted_domain != "nitc.ac.in":
            #     return jsonify({
            #         "success": False,
            #         "message": "Access restricted to NIT Calicut students only."
            #     }), 403

            user = AuthService.create_or_get_oauth_user(
                email=user_info['email'],
                username=user_info.get('name'),
                profile_pic=user_info.get('picture'),
                hosted_domain=user_info.get("hd")
            )

            AuthService.update_last_seen(user.id)
            login_user(user)

            # Generate JWT token
            secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
            expiration = datetime.utcnow() + timedelta(hours=24)
            
            jwt_payload = {
                "user_id": user.id,
                "exp": expiration,
                "type": "api"
            }
            
            api_token = jwt.encode(jwt_payload, secret_key, algorithm="HS256")

            # Create response with HttpOnly cookie
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            response = make_response(redirect(frontend_url))
            
            # Set HttpOnly, Secure cookie
            response.set_cookie(
                'auth_token',
                api_token,
                httponly=True,  # Prevents JavaScript access
                secure=os.getenv('FLASK_ENV') == 'production',  # HTTPS only in production
                samesite='Lax',  # CSRF protection
                max_age=60*60*24,  # 24 hours
                path='/'
            )
            
            return response

        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Authentication failed: {str(e)}"
            }), 401
    else:
        redirect_uri = url_for('login', _external=True)
        return google.authorize_redirect(redirect_uri)

@app.route("/api/auth/me", methods=['GET'])
def get_current_user():
    """Get current user info from cookie"""
    auth_cookie = request.cookies.get('auth_token')
    
    if not auth_cookie:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
        payload = jwt.decode(auth_cookie, secret_key, algorithms=["HS256"])
        user_id = payload.get("user_id")
        
        user = db.get_or_404(User, user_id)
        
        return jsonify({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.username,
            "profile_pic": user.profile_pic,
            "age": user.age,
            "sex": user.sex,
            "hobbies": user.hobbies.split(",") if user.hobbies else [],
            "bio": user.bio
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": "Authentication failed"}), 401

@app.route("/logout")
def logout():
    logout_user()
    response = make_response(jsonify({"message": "Logged out successfully"}))
    response.set_cookie('auth_token', '', expires=0)  # Clear cookie
    return response

@app.route("/api/auth/delete", methods=["DELETE"])
@jwt_required
def delete_account():
    try:
        user = request.jwt_user
        result = AuthService.delete_account(user.id)

        if not result.get("success"):
            return jsonify({"error": result.get("message", "Delete failed")}), 400

        logout_user()
        response = make_response(jsonify({"message": "Account deleted"}), 200)
        response.set_cookie("auth_token", "", expires=0, path="/")
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/auth/profile", methods=["PUT"])
@jwt_required
def update_profile():
    user = request.jwt_user
    data = request.get_json(silent=True) or {}  #Safely parses JSON body (returns None if invalid JSON)

    if "age" in data:
        user.age = int(data["age"]) if str(data["age"]).strip() != "" else None

    if "sex" in data:
        user.sex = (data["sex"] or "").strip() or None

    if "bio" in data:
        user.bio = (data["bio"] or "").strip() or None

    if "hobbies" in data:
        hobbies = data["hobbies"]
        if isinstance(hobbies, list):
            cleaned = [str(h).strip() for h in hobbies if str(h).strip()]
            user.hobbies = ",".join(cleaned)
        else:
            user.hobbies = str(hobbies).strip()

    db.session.commit()
    return jsonify(user.to_dict(include_private=True)), 200