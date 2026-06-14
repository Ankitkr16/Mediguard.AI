import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediGuard AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mediguard_super_secret_jwt_key_1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mediguard.db")
    
    # Upload Settings
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    
    # Cloudinary Configs (optional, fallbacks to local storage if not present)
    CLOUDINARY_CLOUD_NAME: Optional[str] = os.getenv("CLOUDINARY_CLOUD_NAME", None)
    CLOUDINARY_API_KEY: Optional[str] = os.getenv("CLOUDINARY_API_KEY", None)
    CLOUDINARY_API_SECRET: Optional[str] = os.getenv("CLOUDINARY_API_SECRET", None)
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
