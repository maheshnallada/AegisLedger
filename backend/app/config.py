from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "AegisLedger"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Defaults to local SQLite in development; set to Supabase PostgreSQL in production:
    # Example: postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
    DATABASE_URL: str = "sqlite:///./aegis_ledger.db"
    
    # Database connection pool configuration
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 300  # Recycle connections every 5 mins to handle Supabase idle timeouts
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def format_database_url(cls, v: str) -> str:
        if not v:
            return "sqlite:///./aegis_ledger.db"
        # Supabase and Heroku often provide 'postgres://', which SQLAlchemy 2.0 deprecates in favor of 'postgresql://' or 'postgresql+psycopg2://'
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg2://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    """Singleton pattern for application configuration."""
    return Settings()
