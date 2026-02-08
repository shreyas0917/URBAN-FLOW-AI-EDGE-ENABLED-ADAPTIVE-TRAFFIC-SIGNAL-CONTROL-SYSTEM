from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database - Default to SQLite for easy setup
    DATABASE_URL: str = "sqlite:///./urbanflow.db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Mapbox
    MAPBOX_TOKEN: str = ""
    
    # MQTT
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env

settings = Settings()

