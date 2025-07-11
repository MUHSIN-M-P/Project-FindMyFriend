from flask import jsonify
from app import app

@app.route("/")
def hello():
    return jsonify({"message": "Hello from Flask!"})


