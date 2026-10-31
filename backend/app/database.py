from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.config import get_settings

settings = get_settings()

engine_kwargs = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG
}

if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / Supabase pool configuration
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    engine_kwargs["pool_recycle"] = settings.DB_POOL_RECYCLE

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enforce foreign key integrity on SQLite connections."""
    try:
        # Only execute PRAGMA on sqlite connections
        if hasattr(dbapi_connection, "cursor") and "sqlite" in str(type(dbapi_connection)).lower():
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    except Exception:
        pass

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency providing transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
