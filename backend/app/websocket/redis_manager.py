import redis
import json
import os
from typing import Optional, Dict, Any
import asyncio
from datetime import datetime

class RedisConnectionManager:
    """Manages WebSocket connections using Redis"""
    
    def __init__(self):
        self.redis_client = None
        self.connect()
    
    def connect(self):
        try:
            redis_url = os.getenv("REDIS_URL")
            if redis_url:
                self.redis_client = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                self.redis_client.ping()
                print(" Connected to Redis")
            else:
                print(" REDIS_URL not found, using memory storage")
                self.redis_client = None
        except Exception as e:
            print(f" Redis connection failed: {e}")
            self.redis_client = None
    
    def set_user_online(self, user_id: int, connection_info: Dict[str, Any]):
        """Mark user as online with connection info"""
        if not self.redis_client:
            return False
        
        try:
            # Store user connection with TTL of 1 hour
            key = f"ws:user:{user_id}"
            data = {
                "connected_at": datetime.utcnow().isoformat(),
                "last_seen": datetime.utcnow().isoformat(),
                **connection_info
            }
            
            self.redis_client.setex(
                key, 
                3600,  # 1 hour TTL
                json.dumps(data)
            )
            
            # Add to online users set
            self.redis_client.sadd("ws:online_users", user_id)
            return True
            
        except Exception as e:
            print(f"Error setting user online: {e}")
            return False
    
    def set_user_offline(self, user_id: int):
        if not self.redis_client:
            return False
        
        try:
            # Remove from online users
            self.redis_client.srem("ws:online_users", user_id)
            
            # Remove connection info
            key = f"ws:user:{user_id}"
            self.redis_client.delete(key)
            return True
            
        except Exception as e:
            print(f"Error setting user offline: {e}")
            return False
    
    def is_user_online(self, user_id: int) -> bool:
        if not self.redis_client:
            return False
        
        try:
            return self.redis_client.sismember("ws:online_users", user_id)
        except Exception as e:
            print(f"Error checking user online status: {e}")
            return False
    
    def get_online_users(self) -> list:
        """Get list of all online users"""
        if not self.redis_client:
            return []
        
        try:
            return [int(user_id) for user_id in self.redis_client.smembers("ws:online_users")]
        except Exception as e:
            print(f"Error getting online users: {e}")
            return []
    
    def update_user_activity(self, user_id: int):
        """Update user's last seen timestamp"""
        if not self.redis_client:
            return False
        
        try:
            key = f"ws:user:{user_id}"
            if self.redis_client.exists(key):
                # Get existing data
                data = json.loads(self.redis_client.get(key) or "{}")
                data["last_seen"] = datetime.utcnow().isoformat()
                
                # Update with new TTL
                self.redis_client.setex(key, 3600, json.dumps(data))
                return True
            return False
            
        except Exception as e:
            print(f"Error updating user activity: {e}")
            return False

redis_manager = RedisConnectionManager()
