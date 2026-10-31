-- ==============================================================================
-- AegisLedger - Supabase PostgreSQL Production DDL Migration
-- High-Integrity, ACID-Compliant Transaction & Account Ledger
-- ==============================================================================

-- 1. Enable UUID Extension (standard in Supabase / PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ACCOUNTS TABLE
-- Tracks ledger accounts with strictly non-negative balances.
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    balance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_account_balance_positive CHECK (balance >= 0)
);

-- Index for searching accounts by creation order
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts (created_at DESC);

-- 3. TRANSACTIONS TABLE
-- Append-only ledger journal recording credits and debits.
-- Composite UNIQUE(account_id, reference_id) provides idempotency protection.
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL,
    type VARCHAR(10) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) 
        REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT chk_transaction_positive_amount CHECK (amount > 0),
    CONSTRAINT chk_transaction_type CHECK (type IN ('credit', 'debit')),
    CONSTRAINT uq_account_reference_id UNIQUE (account_id, reference_id)
);

-- Performance Indexes for Paginated Transaction Lookups & Audits
CREATE INDEX IF NOT EXISTS idx_tx_account_created 
    ON transactions (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_account_type 
    ON transactions (account_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_reference 
    ON transactions (reference_id);

-- 4. TRANSFERS TABLE
-- Tracks atomic cross-account fund transfers with reference deduplication.
CREATE TABLE IF NOT EXISTS transfers (
    id VARCHAR(36) PRIMARY KEY,
    source_account_id VARCHAR(36) NOT NULL,
    destination_account_id VARCHAR(36) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL,
    reference_id VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transfers_source FOREIGN KEY (source_account_id) 
        REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_destination FOREIGN KEY (destination_account_id) 
        REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT chk_transfer_positive_amount CHECK (amount > 0),
    CONSTRAINT chk_transfer_distinct_accounts CHECK (source_account_id <> destination_account_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_source 
    ON transfers (source_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transfers_destination 
    ON transfers (destination_account_id, created_at DESC);

-- ==============================================================================
-- Verification Query
-- ==============================================================================
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('accounts', 'transactions', 'transfers');
