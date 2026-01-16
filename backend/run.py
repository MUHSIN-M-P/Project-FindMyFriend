#!/usr/bin/env python3
import os
from app import app


def _is_production() -> bool:
    return (os.getenv("FLASK_ENV") or "").lower() == "production"


if __name__ == "__main__":
    # Disable the Werkzeug reloader because it spawns a second process.
    # That breaks the in-process WebSocket server (port bind conflicts) and makes chat feel non-live.
    port = int(os.getenv("PORT", "5000"))
    app.run(
        debug=not _is_production(),
        use_reloader=False,
        host="0.0.0.0",
        port=port,
    )
