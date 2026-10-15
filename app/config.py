from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./statistik_umat.db"
    SECRET_KEY: str = "st-matius-bintaro-secret-key-change-in-production-2026!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    INITIAL_ADMIN_EMAIL: str = "admin@matius.id"
    INITIAL_ADMIN_PASSWORD: str = "AdminMatius2026!"
    INITIAL_LITBANG_EMAIL: str = "litbang@matius.id"
    INITIAL_LITBANG_PASSWORD: str = "LitbangMatius2026!"
    
    APP_NAME: str = "Statistik Kehadiran Umat - Paroki Bintaro"
    PARISH_NAME: str = "Gereja St. Matius Penginjil Paroki Bintaro"
    CACHE_TTL_SECONDS: int = 3

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
