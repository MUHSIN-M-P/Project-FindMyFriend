from sqlalchemy import String, Text, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from flask_login import UserMixin
from .database import db

class User(UserMixin, db.Model):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=True)
    profile_pic: Mapped[str] = mapped_column(Text, nullable=True)  # OAuth profile picture
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=True)
    sex: Mapped[str] = mapped_column(Text, nullable=True)
    pfp_url: Mapped[str] = mapped_column(Text, nullable=True, default="/avatars/male_avatar.png")
    hobbies: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of hobbies
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    
    def get_id(self):
        return str(self.id)
    
    def to_dict(self, include_private=False):
        """Convert user to dictionary for API responses"""
        user_data = {
            "id": self.id,
            "username": self.username,
            "age": self.age,
            "sex": self.sex,
            "pfp_url": self.pfp_url or self.profile_pic or "/avatars/male_avatar.png",
            "bio": self.bio,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "hobbies": self.hobbies.split(",") if self.hobbies else []
        }
        
        if include_private:
            user_data["email"] = self.email
            user_data["last_seen"] = self.last_seen.isoformat() if self.last_seen else None
            
        return user_data
