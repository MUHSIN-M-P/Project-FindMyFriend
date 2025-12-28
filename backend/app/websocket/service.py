import asyncio
import threading
from typing import Optional
from app.websocket.server import start_websocket_server
from app.websocket import server as websocket_server
from app.websocket.redis_manager import redis_manager
import os

class WebSocketService:    
    def __init__(self):
        self.server_thread: Optional[threading.Thread] = None
        self.is_running = False
        
    def start_server_in_thread(self, host: str = "0.0.0.0", port: int = 8765):
        """Start WebSocket server in a separate thread"""
        if self.is_running:
            #  to avoid duplicate servers.
            return
        
        def run_server():
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(start_websocket_server(host, port))
                # Creates a new event loop (asyncio.new_event_loop()) for the thread since asyncio loops are thread-local.
            except Exception as e:
                print(f"WebSocket server thread failed: {e}")
            finally:
                self.is_running = False
        
        self.server_thread = threading.Thread(target=run_server, daemon=True)
        # daemon=True => it will exit automatically when the main program exits (avoiding zombie threads).
        self.server_thread.start()
        self.is_running = True
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if user is online using Redis"""
        return redis_manager.is_user_online(user_id)
    
    def get_online_users(self) -> list:
        """Get list of all online users"""
        return redis_manager.get_online_users()

# Global service instance
websocket_service = WebSocketService()

def init_websocket_service(app=None):
    """Initialize WebSocket service - starts automatically with Flask"""
    # Werkzeug debug reloader runs your app twice (parent + child).
    # Starting the WS server in both causes port bind conflicts and no realtime updates.
    if os.getenv("FLASK_ENV") != "production":
        run_main = os.environ.get("WERKZEUG_RUN_MAIN")
        if run_main is not None and run_main != "true":
            return websocket_service

    host = os.getenv("WEBSOCKET_HOST", "0.0.0.0")
    port = int(os.getenv("WEBSOCKET_PORT", "8765"))

    if app is not None:
        websocket_server.set_flask_app(app)
    
    websocket_service.start_server_in_thread(host, port)
    
    if app:
        app.websocket_service = websocket_service
    
    return websocket_service
