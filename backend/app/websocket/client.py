import asyncio
import websockets
import json
import logging
from typing import Optional, Callable, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class WebSocketClient:
    """WebSocket client for testing and integration"""
    
    def __init__(self, url: str = "ws://localhost:8765", token: str = None):
        self.url = url
        self.token = token
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.message_handlers: Dict[str, Callable] = {}
        self.is_connected = False
        
    async def connect(self) -> bool:
        """Connect to WebSocket server"""
        try:
            self.websocket = await websockets.connect(self.url)
            
            # Send authentication
            auth_message = {
                "type": "authenticate",
                "token": self.token
            }
            await self.websocket.send(json.dumps(auth_message))
            
            # Wait for authentication response
            response = await self.websocket.recv()
            auth_response = json.loads(response)
            
            if auth_response.get("type") == "authenticated":
                self.is_connected = True
                logger.info("WebSocket connected and authenticated")
                return True
            else:
                logger.error(f"Authentication failed: {auth_response}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from WebSocket server"""
        if self.websocket:
            await self.websocket.close()
            self.is_connected = False
            logger.info("WebSocket disconnected")
    
    async def send_message(self, recipient_id: int, content: str, message_type: str = "text"):
        """Send a chat message"""
        if not self.is_connected:
            raise ConnectionError("WebSocket not connected")
        
        message = {
            "type": "send_message",
            "recipient_id": recipient_id,
            "content": content,
            "message_type": message_type
        }
        
        await self.websocket.send(json.dumps(message))
    
    async def mark_delivered(self, message_id: int):
        """Mark message as delivered"""
        if not self.is_connected:
            raise ConnectionError("WebSocket not connected")
        
        message = {
            "type": "mark_delivered",
            "message_id": message_id
        }
        
        await self.websocket.send(json.dumps(message))
    
    async def mark_read(self, message_id: int):
        """Mark message as read"""
        if not self.is_connected:
            raise ConnectionError("WebSocket not connected")
        
        message = {
            "type": "mark_read",
            "message_id": message_id
        }
        
        await self.websocket.send(json.dumps(message))
    
    async def send_typing_indicator(self, recipient_id: int, is_typing: bool):
        """Send typing indicator"""
        if not self.is_connected:
            raise ConnectionError("WebSocket not connected")
        
        message = {
            "type": "typing",
            "recipient_id": recipient_id,
            "is_typing": is_typing
        }
        
        await self.websocket.send(json.dumps(message))
    
    async def ping(self):
        """Send ping message"""
        if not self.is_connected:
            raise ConnectionError("WebSocket not connected")
        
        message = {"type": "ping"}
        await self.websocket.send(json.dumps(message))
    
    def add_message_handler(self, message_type: str, handler: Callable[[Dict[str, Any]], None]):
        """Add handler for specific message type"""
        self.message_handlers[message_type] = handler
    
    async def listen_for_messages(self):
        """Listen for incoming messages"""
        if not self.is_connected:
            raise ConnectionError("WebSocket not connected")
        
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    message_type = data.get("type")
                    
                    if message_type in self.message_handlers:
                        self.message_handlers[message_type](data)
                    else:
                        logger.info(f"Unhandled message: {data}")
                        
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON received: {message}")
                    
        except websockets.exceptions.ConnectionClosed:
            self.is_connected = False
            logger.info("WebSocket connection closed")
        except Exception as e:
            logger.error(f"Error listening for messages: {e}")
            self.is_connected = False

# Example usage
async def example_client_usage():
    """Example of how to use the WebSocket client"""
    client = WebSocketClient("ws://localhost:8765", "your-jwt-token-here")
    
    # Define message handlers
    def on_new_message(data):
        print(f"New message: {data}")
    
    def on_message_status_update(data):
        print(f"Message status update: {data}")
    
    def on_typing_indicator(data):
        print(f"Typing indicator: {data}")
    
    # Add handlers
    client.add_message_handler("new_message", on_new_message)
    client.add_message_handler("message_status_update", on_message_status_update)
    client.add_message_handler("typing_indicator", on_typing_indicator)
    
    # Connect and start listening
    if await client.connect():
        # Start listening in background
        listen_task = asyncio.create_task(client.listen_for_messages())
        
        # Send a message
        await client.send_message(recipient_id=2, content="Hello from WebSocket!")
        
        # Send typing indicator
        await client.send_typing_indicator(recipient_id=2, is_typing=True)
        await asyncio.sleep(2)
        await client.send_typing_indicator(recipient_id=2, is_typing=False)
        
        # Keep connection alive
        try:
            await listen_task
        except KeyboardInterrupt:
            print("Disconnecting...")
        finally:
            await client.disconnect()

if __name__ == "__main__":
    asyncio.run(example_client_usage())
