from app.core.database import SessionLocal
from app.models.user import User

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            print(f"ID: {user.id}, Email: {user.email}, Hash: {user.password_hash}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
