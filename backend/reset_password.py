from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import sys

def reset_password(email, new_password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} not found!")
            return
        
        print(f"Found user: {user.email}")
        user.password_hash = get_password_hash(new_password)
        db.commit()
        print(f"Password for {email} has been reset to: {new_password}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password("abdo@gmail.com", "123456")
