import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from app.models.database import db

load_dotenv()

app = Flask(__name__)

database_url = os.getenv("DATABASE_URL")
if database_url and database_url.startswith("postgres://"):
    # SQLAlchemy expects "postgresql://".
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["GOOGLE_CLIENT_ID"] = os.getenv("GOOGLE_CLIENT_ID")
app.config["GOOGLE_CLIENT_SECRET"] = os.getenv("GOOGLE_CLIENT_SECRET")
app.config["GOOGLE_DISCOVERY_URL"] = os.getenv("GOOGLE_DISCOVERY_URL", "https://accounts.google.com/.well-known/openid-configuration")

db.init_app(app)

default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
extra_origins_raw = os.getenv("CORS_ORIGINS", "")
extra_origins = [o.strip() for o in extra_origins_raw.split(",") if o.strip()]

CORS(
    app,
    resources={
        r"/*": {
            "origins": default_origins + extra_origins,
            "supports_credentials": True,
        }
    },
)

# Import routes AFTER app is created
from app.routes import auth, api
from app.websocket.routes import websocket_bp

# Register blueprints
app.register_blueprint(websocket_bp)

# Initialize WebSocket service
from app.websocket.service import init_websocket_service
init_websocket_service(app)

# Create tables only if DATABASE_URL is set (avoid crash during import checks)
if database_url:
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Warning: Could not create tables on startup: {e}")
