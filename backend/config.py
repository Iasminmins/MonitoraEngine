import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Caminho para o .env na raiz do projeto
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:3000"
    backend_port: int = 8000
    batch_size: int = 100
    batch_timeout: float = 2.0
    
    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = False
        extra = "ignore"

settings = Settings()
