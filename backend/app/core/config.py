import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

# Resolve .env from project root (3 levels up from backend/app/core/ → project root)
_BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # → project root
_ENV_FILE = _BASE_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "TalentFit AI - Job Application Optimizer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # MongoDB Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "cvcover_db"

    # JWT
    SECRET_KEY: str = "super_secret_jwt_key_talentfit_ai_2026_change_in_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # AI Providers
    DEFAULT_AI_PROVIDER: str = "openai"  # 'openai', 'gemini', 'mock'
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # CORS — plain string in .env (comma-separated), use allowed_origins_list property
    ALLOWED_ORIGINS: str = "*"

    # Storage
    UPLOAD_DIR: str = "uploads"
    EXPORT_DIR: str = "exports"

    # Backend server
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),        # absolute path → always finds root .env
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated ALLOWED_ORIGINS string into a Python list."""
        origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        if "*" in origins or not origins:
            return ["*"]
        return origins


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.EXPORT_DIR, exist_ok=True)
