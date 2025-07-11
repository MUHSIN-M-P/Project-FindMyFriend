from .database import db
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey
from datetime import datetime
from typing import Optional


class MessageStatus(db.Model):
    __tablename__ = "message_status"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[int] = mapped_column(Integer, ForeignKey("messages.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(Text, default="sent", nullable=False)  # 'sent', 'delivered', 'read', 'deleted'
    seen_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # message = relationship("Messages", back_populates="statuses")
    # user = relationship("User", back_populates="message_statuses")

