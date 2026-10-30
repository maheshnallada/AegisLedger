# AegisLedger (Transaction Ledger API) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, ACID-compliant Transaction Ledger backend in Python/FastAPI with pessimistic concurrency locking, idempotency guarantees, paginated history, and atomic cross-account transfers.

**Architecture:** Clean Layered Architecture with Domain Services, Repositories, Strategy Pattern for balance mutation, and Deterministic Lock Ordering for deadlock-free multi-account transfers. A materialized balance on the Account entity is paired with an append-only Transaction log and an on-demand reconciliation audit.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite (WAL mode) / PostgreSQL, Pytest, HTTPX.

**Spec:** `docs/superpowers/specs/2026-10-30-transaction-ledger-design.md`

## Global Constraints
- All monetary fields (`balance`, `amount`) MUST use `Decimal` with fixed precision (no IEEE 754 floating point).
- Initial account balance MUST always be 0; client cannot set initial balance on creation.
- `reference_id` MUST be unique per account; duplicate submissions must return HTTP 409 and leave balance unchanged.
- Debit transactions MUST be rejected if account balance is insufficient; balance must not change.
- Transactions are strictly immutable: no update or delete routes exist.
- Transfers between accounts MUST execute atomically with deadlock-free lock ordering ($\min(\text{id}_A, \text{id}_B) \to \max(\text{id}_A, \text{id}_B)$).

## Review Focus
- **Concurrent Overdraft:** Multiple simultaneous debit requests that individually pass balance checks but together exceed the balance. Must be prevented via pessimistic locking.
- **Transfer Deadlock:** Two simultaneous transfers in opposite directions ($A \to B$ and $B \to A$). Must be prevented via deterministic lock ordering.
- **Duplicate Reference ID Replay:** Concurrent requests submitting identical `reference_id` for the same account. Database unique constraint + service handling must prevent duplicate rows.
- **Zero Balance Tampering on Account Creation:** Injected payload containing `balance: 5000` must be rejected or stripped, resulting in exactly `balance: 0`.
- **Reconciliation Audit Drift:** Any divergence between `account.balance` and $\sum(\text{credits}) - \sum(\text{debits})$ must be flagged immediately by the audit endpoint.

---

### Task 1: Environment, Database Engine & Exception Foundation

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/exceptions/domain_exceptions.py`
- Create: `backend/tests/conftest.py`
- Test: `backend/tests/test_database.py`

**Interfaces:**
- Produces: `get_db()` FastAPI dependency yielding `Session`, `Settings` singleton, custom exception classes (`AccountNotFoundException`, `InsufficientBalanceException`, `DuplicateReferenceException`, `SelfTransferException`).

- [ ] **Step 1: Write the failing test for database session lifecycle and SQLite foreign key support**
```python
def test_database_connection(db_session):
    from sqlalchemy import text
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pytest backend/tests/test_database.py`  
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement dependencies, config, database engine with foreign key pragmas, and custom exceptions**

- [ ] **Step 4: Run test to verify it passes**
Run: `pytest backend/tests/test_database.py -v`  
Expected: PASS

- [ ] **Step 5: Commit configuration and database foundation**

---

### Task 2: Account Domain, Repository & Creation API

**Files:**
- Create: `backend/app/models/account.py`
- Create: `backend/app/schemas/account.py`
- Create: `backend/app/services/account_service.py`
- Create: `backend/app/api/accounts.py`
- Create: `backend/app/main.py`
- Test: `backend/tests/test_accounts.py`

**Interfaces:**
- Consumes: `get_db()`, `Base` model from Task 1.
- Produces: `AccountCreate` DTO (only `name`), `AccountResponse` DTO (`id`, `name`, `balance`, `created_at`), `POST /api/v1/accounts`, `GET /api/v1/accounts/{id}`, `GET /api/v1/accounts/{id}/balance`.

- [ ] **Step 1: Write the failing tests for account creation and initial zero balance enforcement**
```python
def test_create_account_initial_balance_zero(client):
    response = client.post("/api/v1/accounts", json={"name": "Alice Smith"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice Smith"
    assert Decimal(str(data["balance"])) == Decimal("0.00")
    assert "id" in data
    assert "created_at" in data

def test_client_cannot_set_initial_balance(client):
    response = client.post("/api/v1/accounts", json={"name": "Bob", "balance": 1000})
    assert response.status_code == 201
    data = response.json()
    assert Decimal(str(data["balance"])) == Decimal("0.00")
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `pytest backend/tests/test_accounts.py`  
Expected: FAIL

- [ ] **Step 3: Implement Account model, Pydantic DTOs, service layer, and router**

- [ ] **Step 4: Run tests to verify they pass**
Run: `pytest backend/tests/test_accounts.py -v`  
Expected: PASS

- [ ] **Step 5: Commit Account endpoints and models**

---

### Task 3: Transaction Domain, Strategy Pattern & Concurrency Control

**Files:**
- Create: `backend/app/models/transaction.py`
- Create: `backend/app/schemas/transaction.py`
- Create: `backend/app/services/strategies.py`
- Create: `backend/app/services/ledger_service.py`
- Create: `backend/app/api/transactions.py`
- Test: `backend/tests/test_transactions.py`

**Interfaces:**
- Consumes: `Account` model, `AccountRepository`.
- Produces: `TransactionCreate` DTO (`type`, `amount`, `description`, `reference_id`), `TransactionResponse` DTO, `POST /api/v1/accounts/{account_id}/transactions`.

- [ ] **Step 1: Write failing tests for credit, debit, insufficient funds, and duplicate reference_id**
```python
def test_credit_increases_balance(client, created_account_id):
    res = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit", "amount": 100.50, "description": "Salary", "reference_id": "REF-001"
    })
    assert res.status_code == 201
    bal = client.get(f"/api/v1/accounts/{created_account_id}/balance").json()
    assert Decimal(str(bal["balance"])) == Decimal("100.50")

def test_debit_insufficient_funds_rejected(client, created_account_id):
    res = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "debit", "amount": 200.00, "description": "Overdraft", "reference_id": "REF-002"
    })
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "INSUFFICIENT_FUNDS"

def test_duplicate_reference_id_rejected(client, created_account_id):
    client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit", "amount": 50, "description": "First", "reference_id": "REF-DUP"
    })
    dup_res = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit", "amount": 50, "description": "Second", "reference_id": "REF-DUP"
    })
    assert dup_res.status_code == 409
    assert dup_res.json()["error"]["code"] == "DUPLICATE_TRANSACTION"
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `pytest backend/tests/test_transactions.py`  
Expected: FAIL

- [ ] **Step 3: Implement Transaction model with composite unique constraint `(account_id, reference_id)`, Strategy pattern (`CreditStrategy`, `DebitStrategy`), and pessimistic locking in `LedgerService`**

- [ ] **Step 4: Run tests to verify they pass**
Run: `pytest backend/tests/test_transactions.py -v`  
Expected: PASS

- [ ] **Step 5: Commit transaction processing & strategy engine**

---

### Task 4: Transaction History with Filtering, Pagination & Sorting

**Files:**
- Create: `backend/app/schemas/common.py` (PaginatedResponse DTO)
- Modify: `backend/app/services/ledger_service.py`
- Modify: `backend/app/api/transactions.py`
- Test: `backend/tests/test_transaction_history.py`

**Interfaces:**
- Produces: `GET /api/v1/accounts/{account_id}/transactions?type=credit|debit&page=1&limit=10` returning `items`, `current_page`, `page_size`, `total_records`, `total_pages`.

- [ ] **Step 1: Write failing tests for pagination, type filtering, and latest-first sorting**
```python
def test_transaction_history_pagination_and_sorting(client, account_with_5_transactions):
    res = client.get(f"/api/v1/accounts/{account_with_5_transactions}/transactions?page=1&limit=2")
    assert res.status_code == 200
    data = res.json()
    assert data["current_page"] == 1
    assert data["page_size"] == 2
    assert data["total_records"] == 5
    assert data["total_pages"] == 3
    assert len(data["items"]) == 2
    # Ensure latest-first ordering
    assert data["items"][0]["created_at"] >= data["items"][1]["created_at"]
```

- [ ] **Step 2: Run tests to verify failure**
Run: `pytest backend/tests/test_transaction_history.py`  
Expected: FAIL

- [ ] **Step 3: Implement query pagination builder with `ORDER BY created_at DESC, id DESC` and filter application**

- [ ] **Step 4: Run tests to verify they pass**
Run: `pytest backend/tests/test_transaction_history.py -v`  
Expected: PASS

- [ ] **Step 5: Commit pagination and history endpoints**

---

### Task 5: Money Transfer Feature (Bonus) with Deadlock Elimination

**Files:**
- Create: `backend/app/models/transfer.py`
- Create: `backend/app/schemas/transfer.py`
- Modify: `backend/app/services/ledger_service.py`
- Create: `backend/app/api/transfers.py`
- Test: `backend/tests/test_transfers.py`

**Interfaces:**
- Produces: `POST /api/v1/transfers` with `source_account_id`, `destination_account_id`, `amount`, `reference_id`, `description`.

- [ ] **Step 1: Write failing tests for atomic money transfer and failure rollback**
```python
def test_money_transfer_success(client, funded_acc_a, acc_b):
    res = client.post("/api/v1/transfers", json={
        "source_account_id": funded_acc_a,
        "destination_account_id": acc_b,
        "amount": 40.00,
        "reference_id": "XFER-001",
        "description": "Payment for lunch"
    })
    assert res.status_code == 201
    bal_a = client.get(f"/api/v1/accounts/{funded_acc_a}/balance").json()["balance"]
    bal_b = client.get(f"/api/v1/accounts/{acc_b}/balance").json()["balance"]
    assert Decimal(str(bal_a)) == Decimal("60.00")
    assert Decimal(str(bal_b)) == Decimal("40.00")

def test_transfer_insufficient_balance_rollback(client, funded_acc_a, acc_b):
    res = client.post("/api/v1/transfers", json={
        "source_account_id": funded_acc_a,
        "destination_account_id": acc_b,
        "amount": 999.00,
        "reference_id": "XFER-OVERFLOW",
        "description": "Overdraft transfer"
    })
    assert res.status_code == 400
    assert Decimal(str(client.get(f"/api/v1/accounts/{funded_acc_a}/balance").json()["balance"])) == Decimal("100.00")
    assert Decimal(str(client.get(f"/api/v1/accounts/{acc_b}/balance").json()["balance"])) == Decimal("0.00")
```

- [ ] **Step 2: Run tests to verify failure**
Run: `pytest backend/tests/test_transfers.py`  
Expected: FAIL

- [ ] **Step 3: Implement deterministic lock ordering (`min(id_A, id_B)` then `max(id_A, id_B)`), atomic debit/credit pair, and transfer entity**

- [ ] **Step 4: Run tests to verify they pass**
Run: `pytest backend/tests/test_transfers.py -v`  
Expected: PASS

- [ ] **Step 5: Commit money transfer feature**

---

### Task 6: Audit Reconciliation Engine & Unified Error Contract

**Files:**
- Modify: `backend/app/services/ledger_service.py`
- Modify: `backend/app/api/accounts.py`
- Modify: `backend/app/main.py` (Custom Exception Handlers)
- Test: `backend/tests/test_audit.py`

**Interfaces:**
- Produces: `GET /api/v1/accounts/{id}/audit` returning `cached_balance`, `computed_balance`, `drift`, `is_reconciled: bool`, RFC 7807 compliant error format for all exceptions.

- [ ] **Step 1: Write failing tests for balance reconciliation and RFC 7807 error format**
```python
def test_reconciliation_audit_matches(client, account_with_transactions):
    res = client.get(f"/api/v1/accounts/{account_with_transactions}/audit")
    assert res.status_code == 200
    data = res.json()
    assert data["is_reconciled"] is True
    assert data["drift"] == "0.0000"
    assert data["cached_balance"] == data["computed_balance"]
```

- [ ] **Step 2: Run test to verify failure**
Run: `pytest backend/tests/test_audit.py`  
Expected: FAIL

- [ ] **Step 3: Implement reconciliation query and global exception handler mapping domain exceptions to uniform RFC 7807 JSON responses**

- [ ] **Step 4: Run test to verify it passes**
Run: `pytest backend/tests/test_audit.py -v`  
Expected: PASS

- [ ] **Step 5: Commit reconciliation engine & unified error handlers**

---

### Task 7: Concurrency Stress Test & Double-Spending Verification

**Files:**
- Create: `backend/tests/test_concurrency.py`

**Interfaces:**
- Exercises: 20 simultaneous debit requests on a single account with funds for only 2 debits.

- [ ] **Step 1: Write the concurrency stress test**
```python
import concurrent.futures

def test_concurrent_debits_prevent_double_spending(client, funded_account_100):
    # Account has 100. 10 threads attempt to debit 60 each simultaneously.
    # Exactly 1 debit must succeed; 9 must be rejected. Final balance must be 40.
    def do_debit(i):
        return client.post(f"/api/v1/accounts/{funded_account_100}/transactions", json={
            "type": "debit", "amount": 60.00, "description": f"Thread {i}", "reference_id": f"THREAD-REF-{i}"
        })

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        responses = list(executor.map(do_debit, range(10)))

    successes = [r for r in responses if r.status_code == 201]
    rejections = [r for r in responses if r.status_code == 400]
    assert len(successes) == 1
    assert len(rejections) == 9
    bal = client.get(f"/api/v1/accounts/{funded_account_100}/balance").json()["balance"]
    assert Decimal(str(bal)) == Decimal("40.00")
```

- [ ] **Step 2: Run concurrency test and verify thread safety**
Run: `pytest backend/tests/test_concurrency.py -v`  
Expected: PASS

- [ ] **Step 3: Commit concurrency verification test**

