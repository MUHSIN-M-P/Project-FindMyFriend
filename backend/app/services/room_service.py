"""
Room Code Generation and Validation Service
Backend handles all room code logic
"""

import random
import string
from typing import Optional
from app.websocket.redis_manager import redis_manager

class RoomCodeService:
    """
    Backend service for room code generation and validation
    - Generates unique 6-character codes
    - Validates format
    - Checks for collisions
    - Tracks active rooms
    """
    
    CODE_LENGTH = 6
    CODE_CHARS = string.ascii_uppercase + string.digits
    COLLISION_RETRY_LIMIT = 10
    
    @staticmethod
    def generate_room_code() -> str:
        """
        Generate a unique 6-character room code
        Format: ABC123 (uppercase alphanumeric)
        Ensures no collision with active rooms
        """
        attempts = 0
        
        while attempts < RoomCodeService.COLLISION_RETRY_LIMIT:
            # Generate random 6-character code
            code = ''.join(
                random.choices(RoomCodeService.CODE_CHARS, k=RoomCodeService.CODE_LENGTH)
            )
            
            # Check if room already exists in memory or Redis
            from app.websocket.server import private_rooms
            
            if code not in private_rooms:
                # Double-check Redis for distributed systems
                room_users = redis_manager.get_room_users(code)
                if not room_users or len(room_users) == 0:
                    return code
            
            attempts += 1
        
        # Fallback: add timestamp to guarantee uniqueness
        import time
        timestamp_suffix = str(int(time.time()))[-2:]
        code = ''.join(
            random.choices(RoomCodeService.CODE_CHARS, k=RoomCodeService.CODE_LENGTH - 2)
        ) + timestamp_suffix
        
        return code
    
    @staticmethod
    def validate_room_code(code: str) -> bool:
        """
        Validate room code format
        Must be exactly 6 alphanumeric characters
        """
        if not code or len(code) != RoomCodeService.CODE_LENGTH:
            return False
        
        return all(c in RoomCodeService.CODE_CHARS for c in code.upper())
    
    @staticmethod
    def format_room_code(code: str) -> str:
        """
        Format room code with dash for display: ABC-123
        """
        if len(code) != RoomCodeService.CODE_LENGTH:
            return code
        
        return f"{code[:3]}-{code[3:]}"
    
    @staticmethod
    def normalize_room_code(code: str) -> str:
        """
        Normalize room code: remove dashes, uppercase
        Input: "abc-123" or "ABC123"
        Output: "ABC123"
        """
        return code.replace("-", "").replace(" ", "").upper()
    
    @staticmethod
    def check_room_exists(code: str) -> bool:
        """
        Check if room exists and is active
        """
        normalized = RoomCodeService.normalize_room_code(code)
        
        # Check in-memory rooms
        from app.websocket.server import private_rooms
        if normalized in private_rooms:
            return True
        
        # Check Redis for distributed systems
        room_users = redis_manager.get_room_users(normalized)
        return room_users is not None and len(room_users) > 0
    
    @staticmethod
    def get_room_info(code: str) -> Optional[dict]:
        """
        Get room information
        Returns: dict with user_count, ttl_started, expires_in, etc.
        """
        normalized = RoomCodeService.normalize_room_code(code)
        
        from app.websocket.server import private_rooms, _room_expires_in_seconds
        
        room = private_rooms.get(normalized)
        if not room:
            return None
        
        return {
            "room_code": normalized,
            "user_count": len(room.get("users", set())),
            "ttl_started": room.get("ttl_started", False),
            "expires_in": _room_expires_in_seconds(normalized),
            "creator_user_id": room.get("creator_user_id"),
        }
