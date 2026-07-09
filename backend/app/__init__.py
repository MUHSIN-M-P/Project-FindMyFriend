import os
import socket
import sys
from urllib.parse import urlparse
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from app.models.database import db

load_dotenv()


def _is_alembic_context() -> bool:
    # Alembic imports the "app" package when migrations reference "app.models...".
    # In that context we must not start WebSockets or connect to external services.
    if os.getenv("ALEMBIC_RUNNING") == "1":
        return True
    argv0 = (sys.argv[0] if sys.argv else "").lower()
    return "alembic" in argv0

app = Flask(__name__)


def _normalize_db_url(url: str) -> str:
    # Heroku-style URLs sometimes use postgres:// which SQLAlchemy doesn't accept.
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


def _db_host_resolves(url: str) -> bool:
    try:
        parsed = urlparse(url)
        host = parsed.hostname
        if not host:
            return True
        socket.getaddrinfo(host, parsed.port or 5432)
        return True
    except Exception:
        return False


def _select_database_uri() -> str:
    env_url = os.getenv("DATABASE_URL")
    fallback = os.getenv("SQLITE_FALLBACK_URL", "sqlite:///app.db")
    if not env_url:
        return fallback

    env_url = _normalize_db_url(env_url)

    # If the configured host can't be resolved (common on offline / restricted networks),
    # fall back to local SQLite so the server can still boot for UI work.
    if env_url.startswith("postgres") and not _db_host_resolves(env_url):
        print(
            "[WARN] DATABASE_URL host not resolvable; falling back to SQLite. "
            "Set a working DATABASE_URL to use Postgres."
        )
        return fallback

    return env_url


database_url = _select_database_uri()
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["GOOGLE_CLIENT_ID"] = os.getenv("GOOGLE_CLIENT_ID")
app.config["GOOGLE_CLIENT_SECRET"] = os.getenv("GOOGLE_CLIENT_SECRET")
app.config["GOOGLE_DISCOVERY_URL"] = os.getenv("GOOGLE_DISCOVERY_URL", "https://accounts.google.com/.well-known/openid-configuration")

db.init_app(app)

# Get allowed frontend origins from environment (comma-separated for multiple domains)
allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
for env_var in ["FRONTEND_URL", "CORS_ORIGINS"]:
    val = os.getenv(env_var, "")
    if val:
        allowed_origins.extend([o.strip() for o in val.split(",") if o.strip()])

CORS(app, resources={
    r"/*": {
        "origins": allowed_origins,
        "supports_credentials": True,  # Enable cookies
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
})

# Import routes AFTER app is created.
# Skip during Alembic runs to avoid DB/Redis/WebSocket side effects.
if not _is_alembic_context():
    from app.routes import auth, api
    from app.websocket.routes import websocket_bp

    # Register blueprints
    app.register_blueprint(websocket_bp)

    # Initialize WebSocket service
    from app.websocket.service import init_websocket_service
    init_websocket_service(app)

    # Create tables automatically for production/Render if needed
    if database_url and not database_url.startswith("sqlite"):
        with app.app_context():
            try:
                db.create_all()
            except Exception as e:
                print(f"[WARN] Could not create tables on startup: {e}")

# NOTE: Avoid connecting to the DB at import/startup time in migrations.
# Use Alembic migrations (`alembic upgrade head`) to create/update schema.
