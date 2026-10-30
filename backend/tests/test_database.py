import pytest
from sqlalchemy import text
from backend.app.database import get_db, engine, Base
from backend.app.exceptions.domain_exceptions import (
    LedgerDomainException,
    AccountNotFoundException,
    InsufficientBalanceException,
    DuplicateTransactionException,
    InvalidTransactionException
)

def test_database_connection(db_session):
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1

def test_sqlite_foreign_keys_pragma(db_session):
    # Verify foreign key enforcement is turned on for SQLite
    if "sqlite" in str(engine.url):
        fk_status = db_session.execute(text("PRAGMA foreign_keys")).scalar()
        assert fk_status == 1

def test_domain_exceptions_structure():
    exc = InsufficientBalanceException(current_balance=100.0, requested_amount=150.0)
    assert exc.code == "INSUFFICIENT_FUNDS"
    assert "100" in exc.message
    assert exc.details["current_balance"] == 100.0

