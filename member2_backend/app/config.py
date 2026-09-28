from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore'
    )

    PROJECT_NAME: str = 'CrimeNet AI Backend API'
    VERSION: str = '1.0.0'
    DESCRIPTION: str = 'Production-grade backend orchestration API for CrimeNet AI (SIH Problem ID: SIH26189)'
    ENVIRONMENT: str = 'development'
    DEBUG: bool = True
    API_V1_STR: str = '/api/v1'

    BACKEND_HOST: str = '0.0.0.0'
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'http://localhost:8080'
    ]

    # Legacy local-token settings are retained only for backwards-compatible
    # configuration parsing. Authentication is verified against Supabase JWKS.
    # Never ship a usable signing secret in source.
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    REDIS_URL: str = 'redis://localhost:6379/0'
    CELERY_BROKER_URL: str = 'redis://localhost:6379/1'
    CELERY_RESULT_BACKEND: str = 'redis://localhost:6379/2'

    M3_DATA_GRAPH_SERVICE_URL: str = 'http://localhost:8003'
    M3_NEO4J_URI: str = 'bolt://localhost:7687'
    M3_NEO4J_USER: str = 'neo4j'
    M3_NEO4J_PASSWORD: Optional[str] = None
    NEO4J_URI: str = 'bolt://localhost:7687'
    NEO4J_USER: str = 'neo4j'
    NEO4J_PASSWORD: Optional[str] = None

    M4_AI_NLP_SERVICE_URL: str = 'http://localhost:8004'
    M5_GRAPH_ML_SERVICE_URL: str = 'http://localhost:8005'
    M6_SECURITY_SERVICE_URL: str = 'http://localhost:8006'
    DATABASE_URL: str = 'sqlite:///./crimenet.db'
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    DOWNSTREAM_FALLBACK_MODE: bool = False

    # Ingestion & File Storage Configuration
    UPLOAD_DIR: str = './uploads'
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: List[str] = ['.csv', '.pdf', '.png', '.jpg', '.jpeg', '.tiff']
    ALLOWED_MIME_TYPES: List[str] = [
        'text/csv',
        'text/plain',
        'application/vnd.ms-excel',
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/tiff',
        'application/octet-stream'
    ]

settings = Settings()
