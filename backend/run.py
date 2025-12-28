#!/usr/bin/env python3
from app import app

if __name__ == "__main__":
    # Disable the Werkzeug reloader because it spawns a second process.
    # That breaks the in-process WebSocket server (port bind conflicts) and makes chat feel non-live.
    app.run(debug=True, use_reloader=False, host="0.0.0.0", port=5000)
