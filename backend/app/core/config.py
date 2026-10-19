import os
from typing import List
from pathlib import Path
from dotenv import load_dotenv

_base_dir = Path(__file__).resolve().parents[2]
load_dotenv(_base_dir / ".env")
load_dotenv(_base_dir.parent / ".env")
load_dotenv()

class Settings:
    PROJECT_NAME: str = "SportSense AI Engine"
    API_V1_PREFIX: str = "/api"
    VERSION: str = "1.0.0"
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://byceifewwxvjicrrbdps.supabase.co")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    
    # Server Host & Port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS
    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "")
        if raw.strip():
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://localhost:8080",
            "*"
        ]
    
    # Media & Storage
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    ALLOWED_VIDEO_EXTENSIONS: List[str] = ["webm", "mp4", "mov", "avi"]
    
    # AI/ML Engine
    GRAVITY: float = float(os.getenv("GRAVITY", "9.80665"))
    
    # 24/7 Groq Cloud LLM Configuration (Coach Qwen)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

settings = Settings()
