import asyncio
import threading
from typing import Optional
from app.websocket.server import start_websocket_server
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
            except:
                pass
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
    host = os.getenv("WEBSOCKET_HOST", "0.0.0.0")
    port = int(os.getenv("WEBSOCKET_PORT", "8765"))
    
    websocket_service.start_server_in_thread(host, port)
    
    if app:
        app.websocket_service = websocket_service
    
    return websocket_service
    
    return websocket_service
