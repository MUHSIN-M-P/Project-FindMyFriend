from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)      
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"]
    }
})             

@app.route("/")
def hello():
    return jsonify({"message": "Hello from Flask!"})  

if __name__ == "__main__":
    app.run(debug=True, port=5000)
