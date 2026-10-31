# AegisLedger 🛡️

**A High-Integrity, Double-Entry Inspired Transaction Ledger Engine**  
*Built with Python 3.12, FastAPI, SQLAlchemy 2.0, and Pydantic v2*

---

## 1. Executive Summary & Design Overview

**AegisLedger** is an enterprise-grade financial transaction ledger built to enforce mathematical consistency, absolute data immutability, zero double-spending, and deadlock-free atomic transfers.

### System Design Principles Applied
1. **Zero Floating-Point Tolerance:** All balance mutations and amounts are handled using arbitrary-precision `Decimal` / `NUMERIC(18, 4)`.
2. **Pessimistic Concurrency & Mutual Exclusion:** Row-level locks (`SELECT ... FOR UPDATE` on PostgreSQL) and a thread-safe mutex on SQLite prevent race conditions and overdrafts.
3. **Deadlock Elimination via Deterministic Ordering:** Multi-account money transfers sort account identifiers ($\min(\text{ID}_A, \text{ID}_B) \to \max(\text{ID}_A, \text{ID}_B)$) to guarantee Coffman's circular wait condition can never occur.
4. **Append-Only Ledger & Self-Reconciliation:** The `transactions` table is an immutable log. An on-demand audit endpoint (`GET /accounts/{id}/audit`) recalculates $\sum(\text{credits}) - \sum(\text{debits})$ and verifies zero balance drift.
5. **Idempotency & Deduplication:** Composite uniqueness constraint `UNIQUE (account_id, reference_id)` combined with graceful application handling guarantees repeated submissions return `409 Conflict` without changing account state.

---

## 2. Gang of Four (GoF) Design Patterns Implemented

| Pattern | Category | Concrete Component | Purpose |
| :--- | :--- | :--- | :--- |
| **Strategy Pattern** | Behavioral | `TransactionPostingStrategy`, `CreditStrategy`, `DebitStrategy` | Open/Closed balance computation for credit/debit/future types |
| **Facade Pattern** | Structural | `LedgerService` | Unified, thread-safe entry point coordinating locking, validation, and atomicity |
| **Factory Pattern** | Creational | `StrategyFactory` | Resolves the exact posting strategy given a transaction type |
| **Builder Pattern** | Creational | `PaginatedResponse.create()` | Standardized envelope for pagination metadata |
| **Singleton Pattern** | Creational | `get_settings()` via `@lru_cache` | Single global configuration and connection pool instance |
| **Adapter Pattern** | Structural | `_sqlite_mutex` / DB Event Pragmas | Transparently bridges SQLite dialect differences with PostgreSQL |

---

## 3. API Documentation

Interactive Swagger documentation is available at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

### Core Endpoints

#### 1. Create Account
- **Route:** `POST /api/v1/accounts`
- **Request Body:**
  ```json
  {
    "name": "Alice Smith"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "id": "1bd6efc7-dc33-42e8-842a-1eccf214c497",
    "name": "Alice Smith",
    "balance": "0.0000",
    "created_at": "2026-10-30T16:00:00Z"
  }
  ```
  *Note: Client is strictly prevented from providing an initial balance.*

#### 2. Get Account Balance
- **Route:** `GET /api/v1/accounts/{account_id}/balance`
- **Response (`200 OK`):**
  ```json
  {
    "account_id": "1bd6efc7-dc33-42e8-842a-1eccf214c497",
    "balance": "150.0000",
    "account_name": "Alice Smith",
    "created_at": "2026-10-30T16:00:00Z"
  }
  ```

#### 3. Add Transaction (Credit / Debit)
- **Route:** `POST /api/v1/accounts/{account_id}/transactions`
- **Request Body (Credit):**
  ```json
  {
    "type": "credit",
    "amount": "100.50",
    "description": "Salary deposit",
    "reference_id": "SALARY-2026-10"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "account_id": "1bd6efc7-dc33-42e8-842a-1eccf214c497",
    "type": "credit",
    "amount": "100.5000",
    "description": "Salary deposit",
    "reference_id": "SALARY-2026-10",
    "created_at": "2026-10-30T16:01:00Z"
  }
  ```
- **Error Codes:**
  - `400 Bad Request` (`INSUFFICIENT_FUNDS`): Debit exceeds current balance.
  - `409 Conflict` (`DUPLICATE_TRANSACTION`): Reference ID already exists for this account.
  - `404 Not Found` (`ACCOUNT_NOT_FOUND`): Invalid account ID.
  - `422 Unprocessable` (`VALIDATION_ERROR`): Negative or zero amount, blank description/ref.

#### 4. Get Transaction History
- **Route:** `GET /api/v1/accounts/{account_id}/transactions?type=credit&page=1&limit=10`
- **Query Parameters:**
  - `type`: `credit`, `debit`, or omitted (returns both)
  - `page`: integer $\ge 1$ (default: 1)
  - `limit`: integer between 1 and 100 (default: 10)
- **Response (`200 OK`):**
  ```json
  {
    "current_page": 1,
    "page_size": 10,
    "total_records": 42,
    "total_pages": 5,
    "items": [
      {
        "id": "...",
        "account_id": "...",
        "type": "credit",
        "amount": "50.0000",
        "description": "Payment",
        "reference_id": "REF-001",
        "created_at": "2026-10-30T16:05:00Z"
      }
    ]
  }
  ```

#### 5. Money Transfer (Bonus Feature)
- **Route:** `POST /api/v1/transfers`
- **Request Body:**
  ```json
  {
    "source_account_id": "1bd6efc7-dc33-42e8-842a-1eccf214c497",
    "destination_account_id": "2fe7fa12-45e1-4bb3-9876-0123456789ab",
    "amount": "30.00",
    "reference_id": "XFER-1001",
    "description": "Lunch split"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "id": "...",
    "source_account_id": "1bd6efc7-dc33-42e8-842a-1eccf214c497",
    "destination_account_id": "2fe7fa12-45e1-4bb3-9876-0123456789ab",
    "amount": "30.0000",
    "reference_id": "XFER-1001",
    "description": "Lunch split",
    "created_at": "2026-10-30T16:10:00Z"
  }
  ```

#### 6. Mathematical Reconciliation & Audit
- **Route:** `GET /api/v1/accounts/{account_id}/audit`
- **Response (`200 OK`):**
  ```json
  {
    "account_id": "1bd6efc7-dc33-42e8-842a-1eccf214c497",
    "cached_balance": "100.0000",
    "total_credits": "150.0000",
    "total_debits": "50.0000",
    "computed_balance": "100.0000",
    "drift": "0.0000",
    "is_reconciled": true,
    "total_transactions": 4
  }
  ```

---

## 4. Unified Error Handling (RFC 7807 Format)
Every error returns a consistent envelope:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Insufficient balance. Current balance is 100.0, but requested debit is 150.0.",
    "details": {
      "current_balance": 100.0,
      "requested_amount": 150.0
    },
    "timestamp": "2026-10-30T16:12:00Z"
  }
}
```

---

## 5. Local Setup & Testing

### Option A: Local Python Environment
1. **Activate virtual environment:**
   ```bash
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   # Linux/macOS
   source .venv/bin/activate
   ```
2. **Install dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```
3. **Run all 36 automated tests (including Concurrency Stress Tests):**
   ```bash
   pytest -v
   ```
4. **Start the FastAPI server:**
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```

### Option B: Docker & Docker Compose
1. **Build and launch container:**
   ```bash
   docker-compose up --build -d
   ```
2. **Check health and logs:**
   ```bash
   docker-compose logs -f backend
   curl http://localhost:8000/health
   ```
3. **Stop container:**
   ```bash
   docker-compose down
   ```

---

## 6. Assumptions & Engineering Invariants
1. **Unified Currency:** All transactions operate on a consistent monetary base.
2. **Zero Initial Balance:** Every account begins with a strictly zero balance; client input cannot override this.
3. **Immutability:** Transactions cannot be updated or deleted via any API endpoint.
4. **Atomic Transfers:** Money transfers debit source and credit destination as a single ACID transaction; any partial failure initiates a full rollback.
5. **No Self-Transfers:** An account cannot transfer money to itself.

---

## 7. Production Database (Supabase) & Cloud Deployment (AWS)

AegisLedger is engineered for production deployment using **Supabase (Managed PostgreSQL)** and **AWS** (App Runner, ECS, or EC2 with Docker).

### Quick Supabase Setup
1. Create a free project at [supabase.com](https://supabase.com).
2. Set `DATABASE_URL` in your `.env` or cloud container environment variables:
   ```bash
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```
3. Initialize the database schema:
   - **CLI Auto-Sync:** `python backend/init_db.py`
   - **Supabase SQL Editor:** Paste and run [`supabase_schema.sql`](./supabase_schema.sql).

### AWS Deployment Guide
For complete step-by-step instructions on deploying the backend on **AWS App Runner** or **AWS EC2**, and hosting the frontend on **AWS Amplify** or **S3 + CloudFront**, see:
👉 [**AWS & Supabase Deployment Guide (`AWS_DEPLOYMENT_GUIDE.md`)**](./AWS_DEPLOYMENT_GUIDE.md)

---

## 8. Continuous Integration & Continuous Deployment (GitHub Actions)

AegisLedger includes a production-grade CI/CD pipeline built on **GitHub Actions**:
- **CI Pipeline (`.github/workflows/ci.yml`)**: Automatically triggers on PRs and pushes to validate Python 3.12 dependencies, run 36 unit and concurrency tests, build the Vite production bundle, and smoke-test Docker builds.
- **CD Pipeline (`.github/workflows/deploy-aws.yml`)**: On merge to `main`, automatically migrates the Supabase database schema, builds and tags multi-stage Docker images to Amazon ECR, rolls out zero-downtime updates on AWS App Runner, and syncs the static frontend to S3 and CloudFront CDN.

Detailed setup instructions, required GitHub Secrets, and least-privilege IAM policies are available at:
👉 [**GitHub Actions CI/CD Guide (`CI_CD_GITHUB_ACTIONS.md`)**](./CI_CD_GITHUB_ACTIONS.md)



