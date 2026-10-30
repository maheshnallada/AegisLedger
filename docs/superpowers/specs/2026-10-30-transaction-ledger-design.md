# System Design Specification: StateraLedger (Transaction Ledger System)

**Date:** 2026-10-30  
**Status:** DRAFT (Under Review)  
**Author:** Staff Software Engineer  
**Target:** High-Integrity Full-Stack Transaction Ledger  

---

## 1. Intent & Context

The objective is to design and implement a rock-solid, production-ready Transaction Ledger System conforming to the requirements in `Full Stack Developer Assessment - A4.pdf`.

A financial ledger is fundamentally different from typical CRUD systems:
- An account balance is a critical financial state. Inconsistent balances or race-condition double-spending constitute critical failure.
- Transactions must be strictly immutable once written.
- All balance mutations must be atomic with ledger entry creation.
- Operations must be idempotent per account.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Financial Exactness:** Absolute precision using `Decimal` / `NUMERIC(18, 4)`. Zero floating-point drift.
2. **ACID Transaction Atomicity:** Account balance modification and transaction log creation occur within a single database transaction boundary.
3. **Double-Spending Prevention:** Concurrency control preventing race conditions when concurrent debits hit the same account.
4. **Deadlock Elimination (Bonus Transfer):** Deterministic lock ordering on accounts during transfers.
5. **Idempotency:** Re-submission of identical `reference_id` within the same account returns `409 Conflict` (or existing transaction details) without changing balance.
6. **Immutable Ledger Auditability:** No API route for `UPDATE` or `DELETE` on transactions. A reconciliation audit endpoint verifies $\text{balance} == \sum \text{credits} - \sum \text{debits}$.
7. **Clean Layered Architecture:** Strict separation between Presentation (FastAPI), Business Logic (Service Layer), Data Access (Repository Pattern), and Storage.

### Non-Goals
1. Multi-currency automated FX conversion (all accounts operate in a unified currency base).
2. Distributed multi-region two-phase commit (2PC) or Raft consensus (single relational database ACID domain is appropriate for scope).
3. OAuth2 identity provider integration (basic API authentication or open evaluation harness is sufficient for round).

### Anti-Goals (What would make this a failure)
1. **IEEE 754 Floating-Point usage:** Using Python `float` or SQL `FLOAT` for amounts or balances.
2. **In-Memory Volatile-Only Storage:** Losing all ledger state upon server restart.
3. **Silent Double Spending:** Allowing concurrent requests to overdraw an account balance below 0.
4. **Deadlock Vulnerability:** Allowing random locking order in transfers ($A \to B$ vs $B \to A$).
5. **Mutable Transactions:** Allowing `PUT`/`PATCH`/`DELETE` endpoints on transaction entries.

---

## 3. Approaches Considered

### Approach A: Minimal Relational with Implicit Locks
- **Description:** Basic FastAPI + SQLite/Postgres with standard queries. Update balance via `UPDATE accounts SET balance = balance - :amount WHERE id = :id AND balance >= :amount`.
- **Trade-offs:** 
  - *Pros:* Extremely fast to write.
  - *Cons:* Relies on database row update side-effects; harder to enforce rich domain invariants, lack of extensible design patterns, potential race conditions in transfer logic without explicit ordering.

### Approach B: Pure Event-Sourced Ledger
- **Description:** Accounts have no balance column. Every balance query aggregates the full history of transactions (`SELECT SUM(CASE WHEN type='credit' THEN amount ELSE -amount END)`).
- **Trade-offs:**
  - *Pros:* 100% immutable event stream. Zero possibility of balance/history desynchronization.
  - *Cons:* Querying balances on accounts with thousands of transactions becomes $O(N)$ without snapshotting. Requires building a snapshot worker, which is over-engineering for a 3-4 hour assessment.

### Approach C: Hybrid Materialized Ledger with Pessimistic Locking & Self-Reconciliation (Recommended)
- **Description:** 
  - Maintain an append-only `transactions` table and a materialized, cached `balance` column on `accounts`.
  - Atomically update both inside an ACID transaction using **Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`)**.
  - Enforce `CHECK (balance >= 0)` constraint at the database storage engine level as defensive depth.
  - Apply **Deterministic Lock Ordering** for cross-account transfers.
  - Include an on-demand audit reconciliation endpoint (`GET /accounts/{id}/audit`) that verifies exact mathematical equality between the cached balance and the historical transaction sum.
- **Trade-offs:**
  - *Pros:* $O(1)$ read performance, guaranteed zero double-spending, deadlock-free transfers, conforms 100% to assessment requirements, testable and verifiable.
  - *Cons:* Slightly more architectural boilerplate (Repositories, Services, Custom Exceptions), which is mitigated by our clean design patterns.

---

## 4. Technical Architecture & Component Decisions

### 4.1 Backend Stack
- **Runtime:** Python 3.11+
- **Framework:** FastAPI (High-performance async, OpenAPI auto-documentation, native dependency injection)
- **Validation & Serialization:** Pydantic v2 (Strict typing, Decimal parsing, field regex/length validators)
- **ORM / Storage:** SQLAlchemy 2.0 (Modern 2.0-style queries, explicit transactions, dialect agnosticism)
- **Database:** SQLite (WAL mode, foreign keys enabled) for zero-setup local running and unit testing; 100% drop-in compatible with PostgreSQL (Supabase / AWS RDS) via `DATABASE_URL`.
- **Testing:** Pytest, HTTPX (async test client), Concurrency stress tests.

### 4.2 Data Invariants & Schemas
- `accounts`: `id` (UUID), `name` (string), `balance` (numeric, default 0, check >= 0), `created_at` (UTC).
- `transactions`: `id` (UUID), `account_id` (FK), `type` (credit|debit), `amount` (numeric > 0), `description` (text), `reference_id` (unique with account_id), `created_at` (UTC).
- `transfers`: `id` (UUID), `source_account_id` (FK), `destination_account_id` (FK), `amount` (numeric > 0), `reference_id` (unique), `description` (text), `created_at` (UTC).

### 4.3 Concurrency & Deadlock Invariant
- During single-account transactions: Lock account row via `SELECT ... FOR UPDATE`.
- During transfers ($A \to B$):
  - Lock account with $\min(\text{ID}_A, \text{ID}_B)$ first.
  - Lock account with $\max(\text{ID}_A, \text{ID}_B)$ second.
  - Deduct from source; add to destination.
  - Insert debit transaction on $A$; insert credit transaction on $B$.
  - Insert transfer record.
  - Commit transaction.

---

## 5. Review & Verification Matrix
1. **Account Creation:** Verify client cannot inject initial balance; verify default balance = 0.
2. **Credit & Debit:** Verify positive amounts only; verify insufficient funds rejected with 400/422 and balance unchanged.
3. **Idempotency:** Verify submitting duplicate `reference_id` returns 409 Conflict without altering balance.
4. **Pagination & Ordering:** Verify `page`, `limit`, `total_records`, `total_pages` metadata and strict latest-first timestamp ordering.
5. **Bonus Transfer:** Verify atomic transfer; verify rollback if destination invalid or balance insufficient.
6. **Concurrency Stress:** Run 20 parallel threads attempting debits exceeding balance; verify balance never drops below zero and no phantom reads occur.

