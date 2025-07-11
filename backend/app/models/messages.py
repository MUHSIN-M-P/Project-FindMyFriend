from .database import db
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey
from datetime import datetime

class Messages(db.Model):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[int] = mapped_column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(), nullable=False)
    message_type: Mapped[str] = mapped_column(Text, default="text", nullable=False)  # 'text', 'image', 'video', 'file', etc.
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # conversation = relationship("Conversations", back_populates="messages")
    # sender = relationship("User", back_populates="sent_messages")
    statuses = relationship("MessageStatus", back_populates="message", cascade="all, delete-orphan")
