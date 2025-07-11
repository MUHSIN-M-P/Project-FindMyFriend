from sqlalchemy import select, and_, or_
from app.models import db, User, Conversations, Messages, MessageStatus
from typing import List, Optional

class ChatService:
    """Service class for common chat operations using relationships"""
    
    @staticmethod
    def get_user_conversations(user_id: int) -> List[Conversations]:
        """Get all conversations for a user (created by them or has messages in them)"""
        # Get conversations created by user
        created_conversations = db.session.execute(
            select(Conversations).where(Conversations.created_by == user_id)
        ).scalars().all()
        
        # Get conversations where user has sent messages
        participated_conversations = db.session.execute(
            select(Conversations)
            .join(Messages)
            .where(Messages.sender_id == user_id)
            .distinct()
        ).scalars().all()
        
        # Combine and remove duplicates
        all_conversations = list(set(created_conversations + participated_conversations))
        return all_conversations
    
    @staticmethod
    def get_conversation_messages(conversation_id: int) -> List[Messages]:
        """Get all messages in a conversation with sender info"""
        conversation = db.session.get(Conversations, conversation_id)
        if conversation:
            return conversation.messages  # Uses relationship
        return []
    
    @staticmethod
    def get_message_statuses(message_id: int) -> List[MessageStatus]:
        """Get all statuses for a message"""
        message = db.session.get(Messages, message_id)
        if message:
            return message.statuses  # Uses relationship
        return []
    
    @staticmethod
    def get_user_message_status(message_id: int, user_id: int) -> Optional[MessageStatus]:
        """Get specific user's status for a message"""
        return db.session.execute(
            select(MessageStatus).where(
                and_(
                    MessageStatus.message_id == message_id,
                    MessageStatus.user_id == user_id
                )
            )
        ).scalar_one_or_none()
    
    @staticmethod
    def create_conversation(creator_id: int, name: Optional[str] = None, is_group: bool = False) -> Conversations:
        """Create a new conversation"""
        conversation = Conversations(
            created_by=creator_id,
            name=name,
            is_group=is_group
        )
        db.session.add(conversation)
        db.session.commit()
        return conversation
    
    @staticmethod
    def send_message(conversation_id: int, sender_id: int, content: str, message_type: str = "text") -> Messages:
        """Send a message to a conversation"""
        message = Messages(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            message_type=message_type
        )
        db.session.add(message)
        db.session.commit()
        return message
    
    @staticmethod
    def mark_message_as_read(message_id: int, user_id: int):
        """Mark a message as read by a user"""
        from datetime import datetime
        
        # Check if status already exists
        status = ChatService.get_user_message_status(message_id, user_id)
        
        if status:
            status.status = "read"
            status.seen_at = datetime.utcnow()
        else:
            status = MessageStatus(
                message_id=message_id,
                user_id=user_id,
                status="read",
                seen_at=datetime.utcnow()
            )
            db.session.add(status)
        
        db.session.commit()

# Example usage:
"""
# Get user's conversations
user_conversations = ChatService.get_user_conversations(user_id=1)

# Get messages in a conversation
messages = ChatService.get_conversation_messages(conversation_id=1)

# Access related data using relationships
for conversation in user_conversations:
    print(f"Conversation: {conversation.name}")
    print(f"Created by: {conversation.creator.username}")
    
    for message in conversation.messages:
        print(f"  - {message.sender.username}: {message.content}")
        
        for status in message.statuses:
            print(f"    Status for {status.user.username}: {status.status}")
"""
