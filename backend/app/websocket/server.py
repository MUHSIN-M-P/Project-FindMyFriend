import asyncio
import websockets
import json
import jwt
import os
from datetime import datetime
from typing import Dict, Optional, Set
from app.websocket.redis_manager import redis_manager
from app.models.database import db
from dotenv import load_dotenv

load_dotenv()

# Flask app reference is injected from app initialization to avoid circular imports.
flask_app = None


def set_flask_app(app):
    global flask_app
    flask_app = app

# Store local connections. A single user may have multiple sockets open
# (e.g., Next.js dev StrictMode, multiple tabs).
local_connections: Dict[int, Set[websockets.WebSocketServerProtocol]] = {}

# Captured event loop for cross-thread scheduling (Flask thread -> WS thread)
ws_event_loop: Optional[asyncio.AbstractEventLoop] = None

def authenticate_token(token: str) -> Optional[int]:
    try:
        secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload.get("user_id")
    except Exception:
        return None

async def send_to_user(user_id: int, message: dict):
    """Send message to user if they're online locally"""
    sockets = local_connections.get(user_id)
    if not sockets:
        return

    dead: Set[websockets.WebSocketServerProtocol] = set()
    for ws in list(sockets):
        try:
            await ws.send(json.dumps(message))
        except Exception as e:
            print(f"Failed to send WS message to user {user_id}: {e}")
            dead.add(ws)

    if dead:
        sockets.difference_update(dead)

    if sockets:
        redis_manager.update_user_activity(user_id)
        local_connections[user_id] = sockets
    else:
        local_connections.pop(user_id, None)
        redis_manager.set_user_offline(user_id)


def schedule_send_to_user(user_id: int, message: dict) -> bool:
    """Schedule a message to be sent to a user from a non-async / different thread.

    Returns True if scheduled, False if the WS loop isn't ready.
    """
    global ws_event_loop
    loop = ws_event_loop
    if loop is None or not loop.is_running():
        return False

    try:
        asyncio.run_coroutine_threadsafe(send_to_user(user_id, message), loop)
        return True
    except Exception as e:
        print(f"Failed to schedule WS send to user {user_id}: {e}")
        return False

async def handle_message(websocket, sender_id: int, message_data: dict):
    """Handle incoming messages"""
    message_type = message_data.get("type")
    
    if message_type == "send_message":
        recipient_id = message_data.get("recipient_id")
        content = message_data.get("content")
        msg_type = message_data.get("message_type", "text")
        
        if not recipient_id or not content:
            return
        
        from app.services.chat_service import ChatService
        from app.models import User

        # WebSocket server runs in its own thread; ensure DB operations have app context.
        message_payload = None
        try:
            if flask_app is not None:
                with flask_app.app_context():
                    message = ChatService.send_message(sender_id, recipient_id, content, msg_type)
                    # Get sender's profile picture
                    sender = db.session.get(User, sender_id)
                    sender_pfp = sender.profile_pic if sender and sender.profile_pic else "/avatars/male_avatar.png"
                    
                    # Extract data while session is active to avoid DetachedInstanceError
                    message_payload = {
                        "id": message.id,
                        "sender_id": sender_id,
                        "recipient_id": recipient_id,
                        "conversation_id": message.conversation_id,
                        "content": content,
                        "created_at": message.created_at.isoformat(),
                        "message_type": msg_type,
                        "pfp": sender_pfp,
                    }
            else:
                message = ChatService.send_message(sender_id, recipient_id, content, msg_type)
                sender = db.session.get(User, sender_id)
                sender_pfp = sender.profile_pic if sender and sender.profile_pic else "/avatars/male_avatar.png"
                
                message_payload = {
                    "id": message.id,
                    "sender_id": sender_id,
                    "recipient_id": recipient_id,
                    "conversation_id": message.conversation_id,
                    "content": content,
                    "created_at": message.created_at.isoformat(),
                    "message_type": msg_type,
                    "pfp": sender_pfp,
                }
        except Exception as e:
            print(f"Error persisting WS message {sender_id}->{recipient_id}: {e}")
            await websocket.send(json.dumps({"type": "error", "message": "Failed to persist message"}))
            return
        
        if message_payload:
            # Send to recipient if online
            await send_to_user(recipient_id, {
                "type": "new_message",
                "data": message_payload
            })

async def websocket_handler(websocket, path):
    user_id = None
    
    try:
        # Wait for authentication
        auth_message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
        auth_data = json.loads(auth_message)
        
        if auth_data.get("type") != "authenticate":
            await websocket.send(json.dumps({"type": "error", "message": "Authentication required"}))
            return
        
        user_id = authenticate_token(auth_data.get("token"))
        if not user_id:
            await websocket.send(json.dumps({"type": "error", "message": "Invalid token"}))
            return
        
        # Store connection locally and mark online in Redis
        local_connections.setdefault(user_id, set()).add(websocket)
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
                redis_manager.update_user_activity(user_id)
            except json.JSONDecodeError as e:
                print(f"Invalid JSON from user {user_id}: {e}")
            except Exception as e:
                print(f"Error handling message from user {user_id}: {e}")
                
    except asyncio.TimeoutError:
        print("Authentication timeout")
    except websockets.exceptions.ConnectionClosed:
        print(f"Connection closed for user {user_id}")
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
    finally:
        # Clean up connection
        if user_id:
            sockets = local_connections.get(user_id)
            if sockets and websocket in sockets:
                sockets.discard(websocket)

            if sockets:
                local_connections[user_id] = sockets
            else:
                local_connections.pop(user_id, None)
                redis_manager.set_user_offline(user_id)
            print(f"User {user_id} disconnected")

async def start_websocket_server(host: str = "0.0.0.0", port: int = 8765):
    """Start WebSocket server"""
    global ws_event_loop
    ws_event_loop = asyncio.get_running_loop()
    print(f"WebSocket server running on ws://{host}:{port}")
    async with websockets.serve(websocket_handler, host, port):
        await asyncio.Future()  # run forever
