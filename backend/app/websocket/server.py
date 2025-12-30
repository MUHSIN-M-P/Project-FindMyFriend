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
    
ROOM_TIME_SECONDS = 300

# =======================
# Private Rooms (In-Memory)
# TTL starts when 2nd socket joins
# =======================
private_rooms: Dict[str, dict] = {}


def create_private_room(room_id: str, creator_user_id: Optional[int] = None):
    if room_id in private_rooms:
        return

    private_rooms[room_id] = {
        "users": set(),
        "expires_at": None,
        "task": None,
        "ttl_started": False,
        "creator_user_id": creator_user_id,
    }
    print(f"Room {room_id} created (TTL not started)")


# Backwards-compat alias (if any older code calls it)
def create_room(room_id: str):
    create_private_room(room_id)


async def destroy_private_rooms(roomid: str):
    await asyncio.sleep(ROOM_TIME_SECONDS)

    room = private_rooms.get(roomid)
    if not room :
        return
    for ws in list(room["users"]):
        try: 
            await ws.send(json.dumps({
                "type":"room_expired",
                "room_id" : roomid
            }))
            await ws.close()
        except Exception as e:
             print(f"Error in handling destroying romm : {roomid} - {e}")
    
    private_rooms.pop(roomid, None)
    print(f"Room {roomid} destroyed after TTL")

def start_room_ttl(room_id: str):
    room = private_rooms.get(room_id)
    if not room or room.get("ttl_started"):
        return
    loop = asyncio.get_running_loop()
    task = loop.create_task(destroy_private_rooms(room_id))

    room["task"]=task
    room["expires_at"]=loop.time() + ROOM_TIME_SECONDS
    room["ttl_started"]=True
    print(f"TTL started for room {room_id}")

def _room_expires_in_seconds(room_id: str) -> Optional[int]:
    room = private_rooms.get(room_id)
    if not room or not room.get("ttl_started") or room.get("expires_at") is None:
        return None
    loop = asyncio.get_running_loop()
    return max(0, int(room["expires_at"] - loop.time()))


async def end_private_room(room_id: str):
    """Manually ending a room"""
    room = private_rooms.get(room_id)
    if not room:
        return
    if room.get("task"):
        room["task"].cancel()

    for ws in list(room["users"]):
        try:
            await ws.send(json.dumps({
                "type": "room_ended",
                "room_id": room_id
            }))
            await ws.close()
        except Exception as e:
            print(f"Error notifying user in room {room_id}: {e}")
    
    # Remove room
    private_rooms.pop(room_id, None)
    print(f"Room {room_id} manually ended")
    

async def send_to_user(user_id: int, message: dict):
    """ if they're online locally"""
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

async def handle_create_private_room(websocket, room_id: str):
    if not room_id:
        await websocket.send(json.dumps({
            "type": "error",
            "message": "room_id required"
        }))
        return

    create_private_room(room_id)
    await websocket.send(json.dumps({
        "type": "room_created",
        "room_id": room_id,
    }))

    await handle_join_private_room(websocket, room_id)


async def handle_create_private_room_for_user(websocket, sender_id: int, room_id: str):
    if not room_id:
        await websocket.send(json.dumps({
            "type": "error",
            "message": "room_id required"
        }))
        return

    room = private_rooms.get(room_id)
    if room is None:
        create_private_room(room_id, creator_user_id=sender_id)
    else:
        # If it was created without a creator (older state), claim it.
        if room.get("creator_user_id") is None:
            room["creator_user_id"] = sender_id

    await websocket.send(json.dumps({
        "type": "room_created",
        "room_id": room_id,
    }))

    await handle_join_private_room_for_user(websocket, sender_id, room_id)


async def handle_join_private_room(websocket, room_id: str):
    """Handle joining a private room"""
    if not room_id:
        await websocket.send(json.dumps({
            "type": "error",
            "message": "room_id required"
        }))
        return

    # IMPORTANT: joining should NOT create rooms.
    # This prevents users from joining random codes that don't exist.
    room = private_rooms.get(room_id)

    if not room:
        await websocket.send(json.dumps({
            "type": "room_not_found",
            "room_id": room_id,
            "message": "Room not found"
        }))
        return

    # Add user to room
    room["users"].add(websocket)
    user_count = len(room["users"])

    # Start TTL when 2nd socket joins
    if user_count == 2 and not room["ttl_started"]:
        start_room_ttl(room_id)

    expires_in = _room_expires_in_seconds(room_id)

    await websocket.send(json.dumps({
        "type": "joined_room",
        "room_id": room_id,
        "user_count": user_count,
        "ttl_started": room["ttl_started"],
        "expires_in": expires_in,
        "is_creator": False,
    }))
    
    # Notify other users in room
    for ws in list(room["users"]):
        if ws != websocket:
            try:
                    await ws.send(json.dumps({
                        "type": "user_joined_room",
                        "room_id": room_id,
                        "user_count": user_count,
                        "ttl_started": room["ttl_started"],
                        "expires_in": expires_in,
                    }))
            except Exception:
                room["users"].discard(ws)


async def handle_join_private_room_for_user(websocket, sender_id: int, room_id: str):
    """Join handler that can also provide is_creator flag."""
    if not room_id:
        await websocket.send(json.dumps({
            "type": "error",
            "message": "room_id required"
        }))
        return

    room = private_rooms.get(room_id)
    if not room:
        await websocket.send(json.dumps({
            "type": "room_not_found",
            "room_id": room_id,
            "message": "Room not found"
        }))
        return

    room["users"].add(websocket)
    user_count = len(room["users"])

    if user_count == 2 and not room["ttl_started"]:
        start_room_ttl(room_id)

    expires_in = _room_expires_in_seconds(room_id)
    is_creator = bool(sender_id) and room.get("creator_user_id") == sender_id

    await websocket.send(json.dumps({
        "type": "joined_room",
        "room_id": room_id,
        "user_count": user_count,
        "ttl_started": room["ttl_started"],
        "expires_in": expires_in,
        "is_creator": is_creator,
    }))

    for ws in list(room["users"]):
        if ws != websocket:
            try:
                await ws.send(json.dumps({
                    "type": "user_joined_room",
                    "room_id": room_id,
                    "user_count": user_count,
                    "ttl_started": room["ttl_started"],
                    "expires_in": expires_in,
                }))
            except Exception:
                room["users"].discard(ws)


async def handle_leave_private_room(websocket, room_id: str):
    if not room_id:
        return

    room = private_rooms.get(room_id)
    if not room:
        # idempotent
        await websocket.send(json.dumps({
            "type": "left_room",
            "room_id": room_id,
        }))
        return

    if websocket in room.get("users", set()):
        room["users"].discard(websocket)

    remaining = len(room["users"])
    expires_in = None
    try:
        expires_in = _room_expires_in_seconds(room_id)
    except Exception:
        expires_in = None

    # Ack to leaver
    try:
        await websocket.send(json.dumps({
            "type": "left_room",
            "room_id": room_id,
        }))
    except Exception:
        pass

    # Notify remaining sockets
    for ws in list(room["users"]):
        try:
            await ws.send(json.dumps({
                "type": "user_left_room",
                "room_id": room_id,
                "user_count": remaining,
                "ttl_started": room.get("ttl_started", False),
                "expires_in": expires_in,
            }))
        except Exception:
            room["users"].discard(ws)

    # If empty, delete
    if remaining == 0:
        if room.get("task"):
            try:
                room["task"].cancel()
            except Exception:
                pass
        private_rooms.pop(room_id, None)


async def handle_room_message(websocket, sender_id: int, room_id: str, payload: dict):
    """Handle message broadcast in a private room"""
    if not room_id or not payload:
        return

    room = private_rooms.get(room_id)
    if not room:
        await websocket.send(json.dumps({
            "type": "room_expired",
            "room_id": room_id
        }))
        return
    
    # Broadcast to all other users in room
    for ws in list(room["users"]):
        if ws != websocket:
            try:
                await ws.send(json.dumps({
                    "type": "room_message",
                    "room_id": room_id,
                    "payload": payload,
                    "sender_id": sender_id,
                    "timestamp": datetime.utcnow().isoformat(),
                }))
            except Exception:
                room["users"].discard(ws)


async def handle_end_room(websocket, sender_id: int, room_id: str):
    """Handle manual room termination"""
    if not room_id:
        return

    room = private_rooms.get(room_id)
    if not room:
        return

    creator_user_id = room.get("creator_user_id")
    if creator_user_id is not None and creator_user_id != sender_id:
        await websocket.send(json.dumps({
            "type": "error",
            "message": "Only the creator can end the room"
        }))
        return

    await end_private_room(room_id)


async def handle_message(websocket, sender_id: int, message_data: dict):
    """Handle incoming messages - router function"""
    message_type = message_data.get("type")

    # Private room handlers
    if message_type == "create_private_room":
        room_id = message_data.get("room_id")
        await handle_create_private_room_for_user(websocket, sender_id, room_id)
        return

    if message_type == "join_private_room":
        room_id = message_data.get("room_id")
        await handle_join_private_room_for_user(websocket, sender_id, room_id)
        return

    if message_type == "leave_private_room":
        room_id = message_data.get("room_id")
        await handle_leave_private_room(websocket, room_id)
        return

    if message_type == "end_room":
        room_id = message_data.get("room_id")
        await handle_end_room(websocket, sender_id, room_id)
        return

    if message_type == "room_message":
        room_id = message_data.get("room_id")
        payload = message_data.get("payload")
        await handle_room_message(websocket, sender_id, room_id, payload)
        return
    
    # 1-to-1 chat handler
    if message_type == "send_message":
        recipient_id = message_data.get("recipient_id")
        content = message_data.get("content")
        msg_type = message_data.get("message_type", "text")
        
        if not recipient_id or not content:
            return
        
        from app.services.chat_service import ChatService
        from app.models import User

        message_payload = None
        try:
            if flask_app is not None:
                with flask_app.app_context():
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

            # Remove websocket from all private rooms + cleanup empty rooms
            for room_id, room in list(private_rooms.items()):
                if websocket in room.get("users", set()):
                    room["users"].discard(websocket)
                    try:
                        await websocket.close()
                    except Exception:
                        pass

                    # Notify remaining users
                    remaining = len(room["users"])
                    expires_in = None
                    try:
                        expires_in = _room_expires_in_seconds(room_id)
                    except Exception:
                        expires_in = None

                    for ws in list(room["users"]):
                        try:
                            await ws.send(json.dumps({
                                "type": "user_left_room",
                                "room_id": room_id,
                                "user_count": remaining,
                                "ttl_started": room.get("ttl_started", False),
                                "expires_in": expires_in,
                            }))
                        except Exception:
                            room["users"].discard(ws)

                    # If room is empty, destroy it
                    if remaining == 0:
                        if room.get("task"):
                            try:
                                room["task"].cancel()
                            except Exception:
                                pass
                        private_rooms.pop(room_id, None)
            print(f"User {user_id} disconnected")

async def start_websocket_server(host: str = "0.0.0.0", port: int = 8765):
    """Start WebSocket server"""
    global ws_event_loop
    ws_event_loop = asyncio.get_running_loop()
    print(f"WebSocket server running on ws://{host}:{port}")
    async with websockets.serve(websocket_handler, host, port):
        await asyncio.Future()  # run forever
