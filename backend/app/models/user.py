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
    
    created_conversations = relationship("Conversations", back_populates="creator")
    # sent_messages = relationship("Messages", back_populates="sender")
    # message_statuses = relationship("MessageStatus", back_populates="user")
    
    def get_id(self):
        return str(self.id)
