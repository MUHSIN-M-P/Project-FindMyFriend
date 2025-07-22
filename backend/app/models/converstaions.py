from .database import db
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey
from datetime import datetime
from typing import Optional


class Conversations(db.Model):
    __tablename__ = "conversations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    sender = relationship("User", foreign_keys=[sender_id], backref="conversations_as_sender")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="conversations_as_receiver")
    messages = relationship("Messages", back_populates="conversation", cascade="all, delete-orphan")
    
    # Add unique constraint to prevent duplicate conversations
    __table_args__ = (
        db.UniqueConstraint('sender_id', 'receiver_id', name='unique_conversation'),
    )


