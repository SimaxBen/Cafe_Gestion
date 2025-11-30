from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Project Info
    PROJECT_NAME: str = "Cafe Management API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database (Supabase or PostgreSQL)
    DATABASE_URL: str = "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
    
    # Optional: Supabase direct client (for storage, realtime, etc.)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
