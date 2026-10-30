from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "AegisLedger"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database URL defaults to local SQLite file with WAL mode
    # Compatible with PostgreSQL: postgresql+psycopg2://user:password@host:port/dbname
    DATABASE_URL: str = "sqlite:///./aegis_ledger.db"
    
    # Concurrency and transaction timeout settings
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    """Singleton pattern for application configuration."""
    return Settings()

