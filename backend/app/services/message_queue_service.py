"""
Message Queue Service for Reliable Message Delivery
Handles encryption, queuing, retry logic on backend
"""

import json
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet
import os

class MessageQueueService:
    """
    Backend message queue handling:
    - Message encryption at rest
    - Queuing for offline users
    - Retry logic with exponential backoff
    - Delivery confirmation
    """
    
    def __init__(self, redis_client):
        self.redis = redis_client
        env_key = os.getenv('MESSAGE_ENCRYPTION_KEY')
        encryption_key = env_key.encode() if isinstance(env_key, str) and env_key else Fernet.generate_key()
        self.cipher = Fernet(encryption_key)
        
        # Queue keys
        self.PENDING_QUEUE = "message_queue:pending"
        self.RETRY_QUEUE = "message_queue:retry"
        self.FAILED_QUEUE = "message_queue:failed"
        
        # Retry configuration
        self.MAX_RETRIES = 5
        self.RETRY_DELAYS = [1, 2, 5, 10, 30]  # seconds

    def _reconnect_redis(self) -> None:
        """Best-effort reconnect for transient Redis failures."""
        try:
            from app.websocket.redis_manager import redis_manager

            redis_manager.connect()
            if redis_manager.redis is not None:
                self.redis = redis_manager.redis
        except Exception as e:
            print(f"Redis reconnect failed: {e}")

    @staticmethod
    def _to_str(value):
        return value.decode() if isinstance(value, (bytes, bytearray)) else value

    @staticmethod
    def _decode_dict(data: Dict[Any, Any]) -> Dict[str, Any]:
        return {
            (k.decode() if isinstance(k, (bytes, bytearray)) else k):
            (v.decode() if isinstance(v, (bytes, bytearray)) else v)
            for k, v in data.items()
        }
    
    def encrypt_message(self, content: str) -> str:
        """Encrypt message content for storage"""
        return self.cipher.encrypt(content.encode()).decode()
    
    def decrypt_message(self, encrypted_content: str) -> str:
        """Decrypt message content"""
        return self.cipher.decrypt(encrypted_content.encode()).decode()
    
    def queue_message(self, 
                     sender_id: int,
                     recipient_id: int,
                     content: str,
                     conversation_id: int,
                     message_type: str = "text",
                     is_room: bool = False,
                     room_code: Optional[str] = None,
                     client_id: Optional[str] = None) -> str:
        """
        Queue a message for delivery
        Returns: message_queue_id
        """
        # Encrypt message content
        encrypted_content = self.encrypt_message(content)
        
        # Create queue entry
        message_data = {
            'sender_id': sender_id,
            'recipient_id': recipient_id if not is_room else None,
            'content': encrypted_content,
            'original_content': content,  # For immediate WebSocket delivery
            'conversation_id': conversation_id,
            'message_type': message_type,
            'is_room': is_room,
            'room_code': room_code,
            'client_id': client_id,
            'queued_at': datetime.utcnow().isoformat(),
            'retry_count': 0,
            'status': 'pending'
        }
        
        # Generate unique message ID
        message_queue_id = f"msg_{int(time.time() * 1000)}_{sender_id}"
        
        # Add to pending queue
        self.redis.hset(
            f"message:{message_queue_id}",
            mapping=message_data
        )
        
        # Add to pending queue list
        self.redis.lpush(self.PENDING_QUEUE, message_queue_id)
        
        # Set TTL for queue entry (7 days)
        self.redis.expire(f"message:{message_queue_id}", 604800)
        
        return message_queue_id
    
    def process_pending_messages(self):
        """
        Background worker: Process pending messages
        Called by scheduler or worker process
        """
        from app.services.chat_service import ChatService
        from app.websocket.redis_manager import redis_manager
        
        while True:
            if not self.redis:
                time.sleep(1)
                self._reconnect_redis()
                continue

            try:
                # Get next pending message (blocking with timeout)
                result = self.redis.brpop(self.PENDING_QUEUE, timeout=1)
            except Exception as e:
                # Redis can transiently timeout or disconnect; keep worker alive.
                print(f"Redis error in pending processor: {e}")
                self._reconnect_redis()
                time.sleep(1)
                continue
            
            if not result:
                continue
                
            _, message_queue_id = result
            message_queue_id = self._to_str(message_queue_id)
            
            # Get message data
            try:
                message_data = self.redis.hgetall(f"message:{message_queue_id}")
            except Exception as e:
                print(f"Redis error loading message {message_queue_id}: {e}")
                self._reconnect_redis()
                time.sleep(1)
                continue
            if not message_data:
                continue
            
            # Decode data
            message_data = self._decode_dict(message_data)
            
            try:
                # Attempt delivery
                success = self._attempt_delivery(message_data)
                
                if success:
                    # Mark as delivered
                    try:
                        self.redis.delete(f"message:{message_queue_id}")
                    except Exception as e:
                        print(f"Redis error deleting message {message_queue_id}: {e}")
                        self._reconnect_redis()
                else:
                    # Schedule retry
                    self._schedule_retry(message_queue_id, message_data)
                    
            except Exception as e:
                print(f"Error processing message {message_queue_id}: {e}")
                self._schedule_retry(message_queue_id, message_data)
    
    def _attempt_delivery(self, message_data: Dict) -> bool:
        """
        Attempt to deliver message
        Returns: True if successful, False if should retry
        """
        from app.services.chat_service import ChatService
        from app.websocket.redis_manager import redis_manager
        
        sender_id = int(message_data['sender_id'])
        is_room = message_data.get('is_room', 'False') == 'True'
        
        if is_room:
            # Room message - check if room is active
            room_code = message_data.get('room_code')
            active_users = redis_manager.get_room_users(room_code)
            
            if not active_users or len(active_users) == 0:
                return False  # Room not active, retry later
            
            # Decrypt and send via WebSocket
            content = message_data['original_content']
            redis_manager.broadcast_to_room(room_code, {
                'type': 'room_message',
                'room_code': room_code,
                'sender_id': sender_id,
                'content': content,
                'timestamp': datetime.utcnow().isoformat()
            })
            
            return True
        else:
            # Direct message
            recipient_id = int(message_data['recipient_id'])
            
            # Check if recipient is online
            is_online = redis_manager.is_user_online(recipient_id)
            
            if not is_online:
                return False  # User offline, retry later
            
            # Save to database
            content = self.decrypt_message(message_data['content'])
            message = ChatService.send_message(
                sender_id=sender_id,
                recipient_id=recipient_id,
                content=content,
                message_type=message_data.get('message_type', 'text')
            )
            
            # Send via WebSocket
            redis_manager.send_to_user(recipient_id, {
                'type': 'new_message',
                'message_id': message.id,
                'sender_id': sender_id,
                'content': content,
                'timestamp': message.created_at.isoformat()
            })
            
            return True
    
    def _schedule_retry(self, message_queue_id: str, message_data: Dict):
        """Schedule message for retry with exponential backoff"""
        if not self.redis:
            self._reconnect_redis()
            return

        retry_count = int(message_data.get('retry_count', 0))
        
        if retry_count >= self.MAX_RETRIES:
            # Move to failed queue
            try:
                self.redis.lpush(self.FAILED_QUEUE, message_queue_id)
            except Exception as e:
                print(f"Redis error moving to failed queue {message_queue_id}: {e}")
                self._reconnect_redis()
                return
            message_data['status'] = 'failed'
            message_data['failed_at'] = datetime.utcnow().isoformat()
            try:
                self.redis.hset(f"message:{message_queue_id}", mapping=message_data)
            except Exception as e:
                print(f"Redis error updating failed message {message_queue_id}: {e}")
                self._reconnect_redis()
            return
        
        # Increment retry count
        retry_count += 1
        message_data['retry_count'] = retry_count
        message_data['next_retry'] = (
            datetime.utcnow() + timedelta(seconds=self.RETRY_DELAYS[min(retry_count - 1, len(self.RETRY_DELAYS) - 1)])
        ).isoformat()
        
        # Update message data
        try:
            self.redis.hset(f"message:{message_queue_id}", mapping=message_data)
        except Exception as e:
            print(f"Redis error updating retry metadata {message_queue_id}: {e}")
            self._reconnect_redis()
            return
        
        # Add to retry queue with score (timestamp for next retry)
        retry_time = time.time() + self.RETRY_DELAYS[min(retry_count - 1, len(self.RETRY_DELAYS) - 1)]
        try:
            self.redis.zadd(self.RETRY_QUEUE, {message_queue_id: retry_time})
        except Exception as e:
            print(f"Redis error adding to retry queue {message_queue_id}: {e}")
            self._reconnect_redis()
    
    def process_retry_queue(self):
        """
        Background worker: Process retry queue
        Moves messages back to pending when retry time arrives
        """
        while True:
            if not self.redis:
                time.sleep(1)
                self._reconnect_redis()
                continue

            try:
                # Get messages ready for retry
                current_time = time.time()
                ready_messages = self.redis.zrangebyscore(
                    self.RETRY_QUEUE,
                    0,
                    current_time
                )
            except Exception as e:
                print(f"Redis error in retry processor: {e}")
                self._reconnect_redis()
                time.sleep(1)
                continue
            
            for message_queue_id in ready_messages:
                message_queue_id = self._to_str(message_queue_id)
                
                # Move back to pending queue
                try:
                    self.redis.lpush(self.PENDING_QUEUE, message_queue_id)
                except Exception as e:
                    print(f"Redis error re-queueing {message_queue_id}: {e}")
                    self._reconnect_redis()
                    continue
                
                # Remove from retry queue
                try:
                    self.redis.zrem(self.RETRY_QUEUE, message_queue_id)
                except Exception as e:
                    print(f"Redis error removing retry entry {message_queue_id}: {e}")
                    self._reconnect_redis()
            
            # Sleep for 1 second before next check
            time.sleep(1)
    
    def get_pending_count(self, user_id: int) -> int:
        """Get count of pending messages for a user"""
        # This would require indexing - simplified version
        return self.redis.llen(self.PENDING_QUEUE)
    
    def get_failed_messages(self, user_id: int) -> list:
        """Get failed messages for a user"""
        failed_ids = self.redis.lrange(self.FAILED_QUEUE, 0, -1)
        messages = []
        
        for msg_id in failed_ids:
            msg_id = self._to_str(msg_id)
            msg_data = self.redis.hgetall(f"message:{msg_id}")
            
            if msg_data:
                msg_data = self._decode_dict(msg_data)
                
                if int(msg_data.get('sender_id', 0)) == user_id:
                    messages.append({
                        'id': msg_id,
                        'recipient_id': msg_data.get('recipient_id'),
                        'content': self.decrypt_message(msg_data['content']),
                        'failed_at': msg_data.get('failed_at'),
                        'retry_count': msg_data.get('retry_count')
                    })
        
        return messages


# Global instance
_message_queue_service = None

def get_message_queue_service():
    """Get or create message queue service instance"""
    global _message_queue_service
    
    if _message_queue_service is None:
        from app.websocket.redis_manager import redis_manager
        _message_queue_service = MessageQueueService(redis_manager.redis)
    
    return _message_queue_service
