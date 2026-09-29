import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "SportSense AI Engine"
    API_V1_PREFIX: str = "/api"
    VERSION: str = "1.0.0"
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://tknxidmhnqnvfbbkymup.supabase.co")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "*"
    ]
    
    # Media & Storage
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_VIDEO_EXTENSIONS: List[str] = ["webm", "mp4", "mov", "avi"]
    
    # AI/ML Engine
    GRAVITY: float = 9.80665

settings = Settings()
