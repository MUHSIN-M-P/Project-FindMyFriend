from app.models import db, User
from sqlalchemy import select
from datetime import datetime

#  institute's domain 
ALLOWED_DOMAIN = 'nitc.ac.in'

class AuthService:
    # static methods are functions generally used to organisation purpose and just a function that happens to live in a class's namespace - no self , there for Can't access or modify class state
    @staticmethod
    def create_user(username,hosted_domain, email=None, profile_pic=None):
        try:
            if hosted_domain != ALLOWED_DOMAIN:
                return f"Access denied: unauthorized domain, only emails with domain {ALLOWED_DOMAIN} are allowed", 403
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
    def create_or_get_oauth_user(email, username,hosted_domain, profile_pic=None):
        user = AuthService.get_user_by_email(email)
        
        if not user:
            result = AuthService.create_user(
                username=username,
                email=email,
                profile_pic=profile_pic,
                hosted_domain=hosted_domain
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
