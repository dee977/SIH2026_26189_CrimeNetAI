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
        'http://localhost:8080'
    ]

    SECRET_KEY: str = 'crimenet-ai-super-secret-jwt-key-sih-2026-replace-in-prod'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    REDIS_URL: str = 'redis://localhost:6379/0'
    CELERY_BROKER_URL: str = 'redis://localhost:6379/1'
    CELERY_RESULT_BACKEND: str = 'redis://localhost:6379/2'

    M3_DATA_GRAPH_SERVICE_URL: str = 'http://localhost:8003'
    M3_NEO4J_URI: str = 'bolt://localhost:7687'
    M3_NEO4J_USER: str = 'neo4j'
    M3_NEO4J_PASSWORD: str = 'password'

    M4_AI_NLP_SERVICE_URL: str = 'http://localhost:8004'
    M5_GRAPH_ML_SERVICE_URL: str = 'http://localhost:8005'
    M6_SECURITY_SERVICE_URL: str = 'http://localhost:8006'
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    DOWNSTREAM_FALLBACK_MODE: bool = True

settings = Settings()
