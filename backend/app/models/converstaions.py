from .database import db
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Integer, String, Text, Boolean, DateTime
from datetime import datetime
from typing import Optional


class Conversations(db.Model):
    __tablename__ = "conversations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # For group chats
    is_group: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_by: Mapped[int] = mapped_column(Integer, db.ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    creator = relationship("User", back_populates="created_conversations")
    messages = relationship("Messages", back_populates="conversation", cascade="all, delete-orphan")


