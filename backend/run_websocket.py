#!/usr/bin/env python3
"""
Standalone WebSocket server runner for production deployment.
This can be run separately from the Flask application.
"""

import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('websocket_server.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main entry point for WebSocket server"""
    try:
        from app.websocket.server import start_websocket_server
        
        host = os.getenv("WEBSOCKET_HOST", "0.0.0.0")
        port = int(os.getenv("WEBSOCKET_PORT", "8765"))
        
        logger.info(f"Starting WebSocket server on {host}:{port}")
        logger.info("Press Ctrl+C to stop the server")
        
        # Run the WebSocket server
        asyncio.run(start_websocket_server(host, port))
        
    except KeyboardInterrupt:
        logger.info("WebSocket server stopped by user")
    except Exception as e:
        logger.error(f"WebSocket server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
