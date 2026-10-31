#!/usr/bin/env python3
"""
AegisLedger Database Initialization & Connectivity Verification Tool
Supports both SQLite (local development) and Supabase PostgreSQL (production).
"""

import sys
import os
import argparse
import re

# Ensure repository root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text, inspect
from backend.app.config import get_settings
from backend.app.database import engine, Base
# Import models to ensure they register on Base.metadata
from backend.app.models.account import Account
from backend.app.models.transaction import Transaction
from backend.app.models.transfer import Transfer

def mask_connection_string(url: str) -> str:
    """Mask credentials in database URL for safe terminal logging."""
    return re.sub(r':([^@]+)@', r':****@', url)

def verify_connection():
    """Verify raw database ping connectivity."""
    settings = get_settings()
    masked_url = mask_connection_string(settings.DATABASE_URL)
    print(f"[*] Probing database target: {masked_url}")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            if result == 1:
                print("[+] SUCCESS: Database connection established and verified.")
                return True
    except Exception as e:
        print(f"[-] ERROR: Failed to connect to database:\n    {str(e)}", file=sys.stderr)
        return False
    return False

def init_tables():
    """Create all schema tables and constraints in target database."""
    print("[*] Synchronizing SQLAlchemy schema metadata...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[+] SUCCESS: All database tables synchronized successfully.")
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"[+] Detected tables in database: {tables}")
        for t in ['accounts', 'transactions', 'transfers']:
            if t in tables:
                col_names = [col['name'] for col in inspector.get_columns(t)]
                print(f"    - Table '{t}' (Columns: {', '.join(col_names)})")
            else:
                print(f"    ! Warning: Table '{t}' not found in inspection.")
        return True
    except Exception as e:
        print(f"[-] ERROR: Schema table creation failed:\n    {str(e)}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description="AegisLedger Database Manager")
    parser.add_argument("--check-only", action="store_true", help="Only verify database connectivity without migrating")
    args = parser.parse_args()

    print("=" * 60)
    print(" AegisLedger Database Initialization Tool")
    print("=" * 60)

    if not verify_connection():
        sys.exit(1)

    if args.check_only:
        print("[*] Check completed. Exiting without table changes.")
        sys.exit(0)

    if not init_tables():
        sys.exit(1)

    print("=" * 60)
    print("[+] Database is fully prepared and ready for API traffic.")
    print("=" * 60)

if __name__ == "__main__":
    main()
