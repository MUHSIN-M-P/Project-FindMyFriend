import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime as dt
from database import db
from models import Users

load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
db.init_app(app)

CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"]
    }
})

@app.route("/")
def hello():
    return jsonify({"message": "Hello from Flask!"})

@app.route("/signup", methods=["GET", "POST"])
def createAccount():
    if request.method == "POST":
        data = request.form
        date = dt.now().date()
        new_user = Users(username=data["username"], created_date=str(date))
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User created!"})

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=5000)