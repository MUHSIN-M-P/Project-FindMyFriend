from flask import jsonify, redirect, request, abort, url_for
from app import app  
from app.models import db, User
from app.services.auth_service import AuthService
from flask_login import login_required, logout_user, login_user, current_user, LoginManager
from authlib.integrations.flask_client import OAuth
from http import HTTPStatus

login_manager = LoginManager()
oauth = OAuth()

login_manager.init_app(app)
login_manager.login_view = 'login'

oauth.init_app(app)

google = oauth.register(
    name='google',
    client_id=app.config.get('GOOGLE_CLIENT_ID'),
    client_secret=app.config.get('GOOGLE_CLIENT_SECRET'),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile'},
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
        return jsonify({"message": "Already logged in"}), 200

    if request.args.get('code'):
        try:
            token = google.authorize_access_token()
            user_info = google.get('userinfo').json()

            user = AuthService.create_or_get_oauth_user(
                email=user_info['email'],
                username=user_info.get('name'),
                profile_pic=user_info.get('picture'),
                hosted_domain= user_info.get("hd")
            )

            AuthService.update_last_seen(user.id)
            login_user(user)

            return jsonify({
                "success": True,
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username
                }
            }), 200

        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Authentication failed: {str(e)}"
            }), 401
    else:
        redirect_uri = url_for('login', _external=True)
        return google.authorize_redirect(redirect_uri)

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200
