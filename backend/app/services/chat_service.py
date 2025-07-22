from sqlalchemy import select, and_, or_
from app.models import db, User, Conversations, Messages, MessageStatus
from typing import List, Optional

class ChatService:
    
    @staticmethod
    def get_user_conversations(user_id: int) -> List[Conversations]:
        conversations = db.session.execute(
            select(Conversations).where(
                or_(
                    Conversations.sender_id == user_id,
                    Conversations.receiver_id == user_id
                )
            )
        ).scalars().all()
        
        return conversations
    
    @staticmethod
    def get_or_create_conversation(sender_id: int, receiver_id: int) -> Conversations:
        conversation = db.session.execute(
            select(Conversations).where(
                or_(
                    and_(
                        Conversations.sender_id == sender_id,
                        Conversations.receiver_id == receiver_id
                    ),
                    and_(
                        Conversations.sender_id == receiver_id,
                        Conversations.receiver_id == sender_id
                    )
                )
            )
        ).scalar_one_or_none()
        
        if not conversation:
            conversation = Conversations(
                sender_id=sender_id,
                receiver_id=receiver_id
            )
            db.session.add(conversation)
            db.session.commit()
        
        return conversation
    
    @staticmethod
    def get_conversation_messages(conversation_id: int) -> List[Messages]:
        conversation = db.session.get(Conversations, conversation_id)
        if conversation:
            return conversation.messages  # Uses relationship
        return []
    
    @staticmethod
    def send_message(sender_id: int, recipient_id: int, content: str, message_type: str = "text") -> Messages:
        conversation = ChatService.get_or_create_conversation(sender_id, recipient_id)
        
        message = Messages(
            conversation_id=conversation.id,
            sender_id=sender_id,
            content=content,
            message_type=message_type
        )
        db.session.add(message)
        db.session.flush()  # Get message ID
        
        status = MessageStatus(
            message_id=message.id,
            recipient_id=recipient_id,
            status="sent"
        )
        db.session.add(status)
        db.session.commit()
        
        return message
    
    @staticmethod
    def mark_message_as_delivered(message_id: int):
        """Mark a message as delivered"""
        from datetime import datetime
        
        status = db.session.execute(
            select(MessageStatus).where(MessageStatus.message_id == message_id)
        ).scalar_one_or_none()
        
        if status and status.status == "sent":
            status.status = "delivered"
            status.delivered_at = datetime.utcnow()
            db.session.commit()
    
    @staticmethod
    def mark_message_as_read(message_id: int):
        """Mark a message as read"""
        from datetime import datetime
        
        status = db.session.execute(
            select(MessageStatus).where(MessageStatus.message_id == message_id)
        ).scalar_one_or_none()
        
        if status:
            status.status = "read"
            status.read_at = datetime.utcnow()
            if not status.delivered_at:
                status.delivered_at = datetime.utcnow()
            db.session.commit()
    
    @staticmethod
    def get_conversation_between_users(sender_id: int, receiver_id: int) -> Optional[Conversations]:
        """Get conversation between two specific users"""
        return db.session.execute(
            select(Conversations).where(
                or_(
                    and_(
                        Conversations.sender_id == sender_id,
                        Conversations.receiver_id == receiver_id
                    ),
                    and_(
                        Conversations.sender_id == receiver_id,
                        Conversations.receiver_id == sender_id
                    )
                )
            )
        ).scalar_one_or_none()


