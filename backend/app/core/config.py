from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings
import os
from pathlib import Path

class Settings(BaseSettings):
    """
    Application settings and configuration.
    
    This class handles all configuration variables with validation.
    Settings can be loaded from environment variables or .env file.
    """
    
    # Application Configuration
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://localhost/uniresource"

    
    # Security Configuration
    SECRET_KEY: str = "default-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = []
    
    # File Upload Configuration
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: List[str] = [
        "pdf", "doc", "docx", "ppt", "pptx", 
        "jpg", "jpeg", "png", "gif", "txt", "md"
    ]
    
    # Cloud Storage Configuration
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: Optional[str] = None
    
    # Email Configuration
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v if isinstance(v, list) else [v]
        raise ValueError(v)
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL format."""
        if v and not (v.startswith("postgresql://") or v.startswith("postgres://")):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string")
        return v
    
    model_config = {
        "env_file": os.path.join(Path(__file__).parent.parent.parent, ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": True
    }

# Create settings instance
settings = Settings()

# DATABASE_URL will be automatically set by Render PostgreSQL
# Convert postgresql:// to postgresql+psycopg:// for psycopg3
if settings.DATABASE_URL.startswith("postgresql://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
