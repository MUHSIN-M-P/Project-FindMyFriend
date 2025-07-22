from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from flask_login import UserMixin
from .database import db

class User(UserMixin, db.Model):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # Note: conversations_as_sender, conversations_as_receiver, sent_messages, and message_statuses 
    # are defined as backref in other models
    
    def get_id(self):
        return str(self.id)
    
    def get_conversations(self):
        """Get all conversations for this user"""
        return self.conversations_as_sender + self.conversations_as_receiver
        return str(self.id)
