import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from app.models.database import db

load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["GOOGLE_CLIENT_ID"] = os.getenv("GOOGLE_CLIENT_ID")
app.config["GOOGLE_CLIENT_SECRET"] = os.getenv("GOOGLE_CLIENT_SECRET")
app.config["GOOGLE_DISCOVERY_URL"] = os.getenv("GOOGLE_DISCOVERY_URL", "https://accounts.google.com/.well-known/openid_configuration")

db.init_app(app)

CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"]
    }
})

# Import routes AFTER app is created
from app.routes import auth, api

with app.app_context():
    db.create_all()
