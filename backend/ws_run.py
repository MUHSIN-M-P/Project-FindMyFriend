#!/usr/bin/env python3
"""Standalone WebSocket entrypoint for production deployment.

Render exposes one public port per service (the PORT env var). This file
runs ONLY the WebSocket server on that port.

Expected env vars:
- PORT (provided by Render)
- DATABASE_URL, REDIS_URL, SECRET_KEY (same as API service)
- WEBSOCKET_AUTOSTART=false (recommended so importing the Flask app doesn't
  spawn a second WS server thread)
"""

import asyncio
import os

from app import app  # creates Flask app + DB config
from app.websocket.server import set_flask_app, start_websocket_server


def main() -> None:
    host = os.getenv("WEBSOCKET_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("WEBSOCKET_PORT", "8765")))
    set_flask_app(app)
    asyncio.run(start_websocket_server(host=host, port=port))


if __name__ == "__main__":
    main()