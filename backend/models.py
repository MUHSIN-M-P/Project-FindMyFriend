from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from database import db

class Users(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(250), unique=True, nullable=False)
    created_date: Mapped[str] = mapped_column(String(100), nullable=False)
