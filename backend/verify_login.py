from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password
import sys

def check_login(email, password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} not found!")
            return
        
        print(f"Found user: {user.email}")
        print(f"Stored Hash: {user.password_hash}")
        
        is_valid = verify_password(password, user.password_hash)
        print(f"Password '{password}' is valid: {is_valid}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_login("abdo@gmail.com", "123456")
