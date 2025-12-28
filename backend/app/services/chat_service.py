from sqlalchemy import select, and_, or_, desc, func
from app.models import db, User, Conversations, Messages, MessageStatus
from app.websocket.redis_manager import redis_manager
from app.services.auth_service import AuthService
from typing import List, Optional, Dict, Any

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
        return (
            db.session.execute(
                select(Messages)
                .where(Messages.conversation_id == conversation_id)
                .order_by(Messages.created_at.asc())
            )
            .scalars()
            .all()
        )
    
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

    @staticmethod
    def get_user_contacts_with_details(user_id: int) -> List[Dict[str, Any]]:
        """Get user's chat contacts with latest messages and metadata"""
        conversations = ChatService.get_user_conversations(user_id)
        
        contacts = []
        for conv in conversations:
            # Get the other user in conversation
            other_user = conv.receiver if conv.sender_id == user_id else conv.sender
            
            # Get latest message
            latest_message = db.session.execute(
                select(Messages)
                .where(Messages.conversation_id == conv.id)
                .order_by(desc(Messages.created_at))
                .limit(1)
            ).scalar_one_or_none()
            
            # Count unread messages
            unread_count = db.session.execute(
                select(func.count(MessageStatus.id))
                .select_from(Messages)
                .join(MessageStatus, Messages.id == MessageStatus.message_id)
                .where(
                    and_(
                        Messages.conversation_id == conv.id,
                        Messages.sender_id != user_id,  # Messages from other user
                        MessageStatus.recipient_id == user_id,
                        MessageStatus.status.in_(['delivered', 'sent'])  # Not read yet
                    )
                )
            ).scalar() or 0
            
            # Check if user is online
            is_online = redis_manager.is_user_online(other_user.id)
            
            contact_data = {
                "id": str(other_user.id),
                "conversation_id": conv.id,
                "name": other_user.username,
                "pfp_path": other_user.profile_pic or "/avatars/male_avatar.png",
                "latest_msg": latest_message.content if latest_message else "No messages yet",
                "latest_msg_time": latest_message.created_at.isoformat() if latest_message else None,
                "unread_count": unread_count,
                "is_online": is_online,
                "last_online": AuthService.get_last_online_message(other_user)
            }
            
            contacts.append(contact_data)
        
        # Sort by latest message time
        contacts.sort(key=lambda x: x['latest_msg_time'] or '', reverse=True)
        return contacts
    
    @staticmethod
    def get_conversation_messages_formatted(current_user_id: int, other_user_id: int, page: int = 1, per_page: int = 50) -> List[Dict[str, Any]]:
        """Get formatted conversation messages for API response"""
        conversation = ChatService.get_or_create_conversation(current_user_id, other_user_id)
        
        # Get messages with pagination
        messages_query = (
            select(Messages)
            .where(Messages.conversation_id == conversation.id)
            .order_by(desc(Messages.created_at))
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        
        messages = db.session.execute(messages_query).scalars().all()
        
        # Convert to JSON format expected by frontend
        message_list = []
        for msg in reversed(messages):  # Reverse to get chronological order
            message_data = {
                "id": str(msg.id),
                "type": "sent" if msg.sender_id == current_user_id else "received",
                "msg": msg.content,
                "timestamp": msg.created_at.isoformat(),
                "message_type": msg.message_type
            }
            
            # Add profile picture for received messages
            if msg.sender_id != current_user_id:
                sender = msg.sender
                message_data["pfp"] = sender.profile_pic or "/avatars/male_avatar.png"
                
            message_list.append(message_data)
        
        # Mark messages as read
        ChatService.mark_conversation_messages_as_read(conversation.id, current_user_id)
        
        return message_list
    
    @staticmethod
    def mark_conversation_messages_as_read(conversation_id: int, user_id: int):
        """Mark all unread messages in a conversation as read for a user"""
        from datetime import datetime
        
        unread_statuses = db.session.execute(
            select(MessageStatus)
            .join(Messages, MessageStatus.message_id == Messages.id)
            .where(
                and_(
                    Messages.conversation_id == conversation_id,
                    MessageStatus.recipient_id == user_id,
                    MessageStatus.status.in_(['delivered', 'sent'])
                )
            )
        ).scalars().all()
        
        for status in unread_statuses:
            status.status = 'read'
            status.read_at = datetime.utcnow()
        
        db.session.commit()
    
    @staticmethod
    def search_users(query: str, current_user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for users to start conversations"""
        users = db.session.execute(
            select(User)
            .where(
                and_(
                    or_(
                        User.username.ilike(f'%{query}%'),
                        User.email.ilike(f'%{query}%')
                    ),
                    User.id != current_user_id
                )
            )
            .limit(limit)
        ).scalars().all()
        
        results = []
        for user in users:
            results.append({
                "id": user.id,
                "name": user.username,
                "email": user.email,
                "pfp_path": user.profile_pic or "/avatars/male_avatar.png",
                "is_online": redis_manager.is_user_online(user.id),
                "age": user.age,
                "sex": user.sex,
                "hobbies": user.hobbies.split(",") if user.hobbies else [],
                "bio": user.bio
            })
            
        return results

    @staticmethod
    def suggest_users(current_user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Suggested users list (used for Find tab and when search is empty)."""
        users = db.session.execute(
            select(User)
            .where(User.id != current_user_id)
            .order_by(desc(User.last_seen), desc(User.created_at))
            .limit(limit)
        ).scalars().all()

        results = []
        for user in users:
            results.append({
                "id": user.id,
                "name": user.username,
                "email": user.email,
                "pfp_path": user.profile_pic or "/avatars/male_avatar.png",
                "is_online": redis_manager.is_user_online(user.id),
                "age": user.age,
                "sex": user.sex,
                "hobbies": user.hobbies.split(",") if user.hobbies else [],
                "bio": user.bio
            })

        return results
    
    @staticmethod
    def get_online_contacts(user_id: int) -> List[Dict[str, Any]]:
        """Get list of online users from user's contacts"""
        user_conversations = ChatService.get_user_conversations(user_id)
        
        online_users = []
        for conv in user_conversations:
            other_user = conv.receiver if conv.sender_id == user_id else conv.sender
            if redis_manager.is_user_online(other_user.id):
                online_users.append({
                    "id": other_user.id,
                    "name": other_user.username,
                    "pfp_path": other_user.profile_pic  or "/avatars/male_avatar.png"
                })
                
        return online_users


