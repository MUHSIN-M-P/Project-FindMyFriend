import asyncio
import websockets
import json
import jwt
import os
from datetime import datetime
from typing import Dict, Optional
from app.websocket.redis_manager import redis_manager

# Store local connections (still needed for sending messages)
local_connections: Dict[int, websockets.WebSocketServerProtocol] = {}

def authenticate_token(token: str) -> Optional[int]:
    try:
        secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload.get("user_id")
    except:
        return None

async def send_to_user(user_id: int, message: dict):
    """Send message to user if they're online locally"""
    if user_id in local_connections:
        try:
            await local_connections[user_id].send(json.dumps(message))
            redis_manager.update_user_activity(user_id)
        except:
            # Remove disconnected user locally and from Redis
            local_connections.pop(user_id, None)
            redis_manager.set_user_offline(user_id)

async def handle_message(websocket, sender_id: int, message_data: dict):
    """Handle incoming messages"""
    message_type = message_data.get("type")
    
    if message_type == "send_message":
        recipient_id = message_data.get("recipient_id")
        content = message_data.get("content")
        
        if not recipient_id or not content:
            return
        
        from app.services.chat_service import ChatService
        message = ChatService.send_message(sender_id, recipient_id, content)
        
        # Send to recipient if online
        await send_to_user(recipient_id, {
            "type": "new_message",
            "data": {
                "id": message.id,
                "sender_id": sender_id,
                "content": content,
                "created_at": message.created_at.isoformat()
            }
        })

async def websocket_handler(websocket, path):
    user_id = None
    
    try:
        # Wait for authentication
        auth_message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
        auth_data = json.loads(auth_message)
        
        if auth_data.get("type") != "authenticate":
            return
        
        user_id = authenticate_token(auth_data.get("token"))
        if not user_id:
            return
        
        # Store connection locally and mark online in Redis
        local_connections[user_id] = websocket
        redis_manager.set_user_online(user_id, {
            "server_id": "main",
            "connected_at": datetime.utcnow().isoformat()
        })
        
        # Send authentication success
        await websocket.send(json.dumps({
            "type": "authenticated",
            "user_id": user_id
        }))
        
        # Listen for messages
        async for message in websocket:
            try:
                data = json.loads(message)
                await handle_message(websocket, user_id, data)
            except json.JSONDecodeError:
                pass
                
    except:
        pass
    finally:
        # Clean up connection
        if user_id:
            local_connections.pop(user_id, None)
            redis_manager.set_user_offline(user_id)

async def start_websocket_server(host: str = "0.0.0.0", port: int = 8765):
    """Start WebSocket server"""
    print(f"WebSocket server running on ws://{host}:{port}")
    async with websockets.serve(websocket_handler, host, port):
        await asyncio.Future()  # run forever
