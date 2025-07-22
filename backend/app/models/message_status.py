from .database import db
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey
from datetime import datetime
from typing import Optional


class MessageStatus(db.Model):
    __tablename__ = "message_status"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[int] = mapped_column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), unique=True)
    recipient_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(Text, default="sent", nullable=False)  # 'sent', 'delivered', 'read'
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    message = relationship("Messages", back_populates="status")
    recipient = relationship("User", backref="message_statuses")

