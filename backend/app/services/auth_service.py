from app.models import db, User
from sqlalchemy import select
from datetime import datetime

class AuthService:
    # static methods are functions generally used to organisation purpose and just a function that happens to live in a class's namespace - no self , there for Can't access or modify class state
    @staticmethod
    def create_user(username, email=None, profile_pic=None):
        try:
            new_user = User(
                username=username,
                email=email,
                profile_pic=profile_pic
            )
            db.session.add(new_user)
            db.session.commit()
            return {"success": True, "user": new_user, "message": "User created successfully"}
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}
    
    @staticmethod
    def get_user_by_email(email):
        return db.session.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()
    
    @staticmethod
    def get_user_by_username(username):
        return db.session.execute(
            select(User).where(User.username == username)
        ).scalar_one_or_none()
    
    @staticmethod
    def create_or_get_oauth_user(email, username, profile_pic=None):
        user = AuthService.get_user_by_email(email)
        
        if not user:
            result = AuthService.create_user(
                username=username,
                email=email,
                profile_pic=profile_pic
            )
            if result["success"]:
                return result["user"]
            else:
                raise Exception(f"Failed to create user: {result['message']}")
        
        return user
    
    @staticmethod
    def update_last_seen(user_id):
        try:
            user = db.session.get(User, user_id)
            if user:
                user.last_seen = datetime.utcnow()
                db.session.commit()
                return True
            return False
        except Exception as e:
            db.session.rollback()
            return False
