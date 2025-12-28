from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.utils.decorators import jwt_required
import jwt
import os
from datetime import datetime, timedelta
from app.websocket.service import websocket_service
from app.websocket.redis_manager import redis_manager

websocket_bp = Blueprint('websocket', __name__, url_prefix='/api/websocket')

@websocket_bp.route('/token', methods=['POST'])
@jwt_required
def generate_websocket_token():
    secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
    expiration = datetime.utcnow() + timedelta(hours=24)
    
    payload = {
        "user_id": request.jwt_user.id,
        "exp": expiration,
        "type": "websocket"
    }
    
    token = jwt.encode(payload, secret_key, algorithm="HS256")

    # Prefer an explicit public URL when deployed behind proxies / different hosts.
    explicit_ws_url = (
        os.getenv("WEBSOCKET_PUBLIC_URL")
        or os.getenv("WEBSOCKET_URL")
        or os.getenv("NEXT_PUBLIC_WEBSOCKET_URL")
    )

    if explicit_ws_url:
        websocket_url = explicit_ws_url
    else:
        # Build URL from the current request host.
        # Use X-Forwarded-Proto when behind a reverse proxy.
        forwarded_proto = (request.headers.get("X-Forwarded-Proto") or "").lower()
        is_secure = request.is_secure or forwarded_proto == "https"
        scheme = "wss" if is_secure else "ws"

        host_header = request.headers.get("X-Forwarded-Host") or request.host
        hostname = (host_header or "localhost").split(":")[0]
        ws_port = os.getenv("WEBSOCKET_PORT", "8765")
        websocket_url = f"{scheme}://{hostname}:{ws_port}"

    return jsonify({
        "token": token,
        "websocket_url": websocket_url,
    })

@websocket_bp.route('/status', methods=['GET'])
def websocket_status():
    return jsonify({
        "status": "running" if websocket_service.is_running else "stopped",
        "redis_connected": redis_manager.redis_client is not None,
        "online_users_count": len(redis_manager.get_online_users())
    })

@websocket_bp.route('/users/<int:user_id>/online', methods=['GET'])
@jwt_required
def check_user_online_status(user_id):
    is_online = websocket_service.is_user_online(user_id)
    return jsonify({
        "user_id": user_id,
        "is_online": is_online
    })

@websocket_bp.route('/users/online', methods=['GET'])
@jwt_required
def get_online_users():
    """Get list of all online users from Redis"""
    online_users = websocket_service.get_online_users()
    return jsonify({
        "online_users": online_users,
        "count": len(online_users)
    })
