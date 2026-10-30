import threading
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.app.models.account import Account
from backend.app.models.transaction import Transaction
from backend.app.models.transfer import Transfer
from backend.app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionType
from backend.app.schemas.transfer import TransferCreate
from backend.app.schemas.common import PaginatedResponse
from backend.app.schemas.audit import AuditResponse
from backend.app.services.account_service import AccountService
from backend.app.exceptions.domain_exceptions import (
    AccountNotFoundException,
    DuplicateTransactionException,
    InsufficientBalanceException,
    SelfTransferException,
)

# Concurrency mutex to serialize critical write sections for SQLite (which lacks native row-level locking)
_sqlite_mutex = threading.RLock()

class LedgerService:
    """
    Facade providing atomic, thread-safe financial ledger operations.
    Enforces ACID atomicity, atomic conditional balance updates, and idempotency.
    """

    @staticmethod
    def get_account_for_update(db: Session, account_id: str) -> Account:
        """
        Retrieves account with pessimistic row lock (SELECT ... FOR UPDATE).
        """
        query = db.query(Account).filter(Account.id == account_id)
        if "postgresql" in str(db.bind.url):
            query = query.with_for_update()
            
        account = query.first()
        if not account:
            raise AccountNotFoundException(account_id)
        return account

    @staticmethod
    def record_transaction(db: Session, account_id: str, tx_in: TransactionCreate) -> Transaction:
        """
        Atomically records a transaction and mutates account balance.
        Guarantees:
        - If reference_id is already used for this account -> 409 DuplicateTransactionException
        - If debit balance insufficient -> 400 InsufficientBalanceException
        - Both transaction entry and balance update persist atomically
        """
        with _sqlite_mutex:
            # Step 1: Ensure account exists and lock row
            account = LedgerService.get_account_for_update(db, account_id)

            # Step 2: Idempotency check for reference_id within this account
            existing_tx = db.query(Transaction).filter(
                Transaction.account_id == account_id,
                Transaction.reference_id == tx_in.reference_id
            ).first()

            if existing_tx:
                raise DuplicateTransactionException(account_id, tx_in.reference_id)

            # Step 3: Check balance sufficiency for debits
            if tx_in.type == TransactionType.DEBIT:
                if account.balance < tx_in.amount:
                    raise InsufficientBalanceException(
                        current_balance=float(account.balance),
                        requested_amount=float(tx_in.amount)
                    )
                account.balance -= tx_in.amount
            else:
                account.balance += tx_in.amount

            # Step 4: Create immutable Transaction record
            transaction = Transaction(
                account_id=account.id,
                type=tx_in.type.value,
                amount=tx_in.amount,
                description=tx_in.description,
                reference_id=tx_in.reference_id
            )
            db.add(transaction)

            # Step 5: Atomic Commit
            try:
                db.commit()
                db.refresh(transaction)
                return transaction
            except IntegrityError as e:
                db.rollback()
                if "uq_account_reference" in str(e).lower() or "unique" in str(e).lower():
                    raise DuplicateTransactionException(account_id, tx_in.reference_id)
                raise

    @staticmethod
    def execute_transfer(db: Session, transfer_in: TransferCreate) -> Transfer:
        """
        Executes an atomic money transfer between two distinct accounts.
        Applies Deterministic Lock Ordering (min(ID_A, ID_B) -> max(ID_A, ID_B))
        to eliminate database deadlocks during concurrent bidirectional transfers.
        """
        with _sqlite_mutex:
            if transfer_in.source_account_id == transfer_in.destination_account_id:
                raise SelfTransferException(transfer_in.source_account_id)

            # Check duplicate transfer reference
            existing_xfer = db.query(Transfer).filter(Transfer.reference_id == transfer_in.reference_id).first()
            if existing_xfer:
                raise DuplicateTransactionException(transfer_in.source_account_id, transfer_in.reference_id)

            # Deterministic Lock Ordering
            first_id, second_id = sorted([transfer_in.source_account_id, transfer_in.destination_account_id])
            first_acc = LedgerService.get_account_for_update(db, first_id)
            second_acc = LedgerService.get_account_for_update(db, second_id)

            src_acc = first_acc if first_acc.id == transfer_in.source_account_id else second_acc
            dst_acc = second_acc if first_acc.id == transfer_in.source_account_id else first_acc

            # Check sufficiency
            if src_acc.balance < transfer_in.amount:
                raise InsufficientBalanceException(
                    current_balance=float(src_acc.balance),
                    requested_amount=float(transfer_in.amount)
                )

            # Mutate balances
            src_acc.balance -= transfer_in.amount
            dst_acc.balance += transfer_in.amount

            # Create corresponding debit transaction for source account
            debit_tx = Transaction(
                account_id=src_acc.id,
                type="debit",
                amount=transfer_in.amount,
                description=f"Transfer to {dst_acc.name} ({dst_acc.id[:8]}): {transfer_in.description}",
                reference_id=f"{transfer_in.reference_id}_DR"
            )

            # Create corresponding credit transaction for destination account
            credit_tx = Transaction(
                account_id=dst_acc.id,
                type="credit",
                amount=transfer_in.amount,
                description=f"Transfer from {src_acc.name} ({src_acc.id[:8]}): {transfer_in.description}",
                reference_id=f"{transfer_in.reference_id}_CR"
            )

            # Create Transfer audit record
            transfer = Transfer(
                source_account_id=src_acc.id,
                destination_account_id=dst_acc.id,
                amount=transfer_in.amount,
                reference_id=transfer_in.reference_id,
                description=transfer_in.description
            )

            db.add(debit_tx)
            db.add(credit_tx)
            db.add(transfer)

            try:
                db.commit()
                return transfer
            except IntegrityError as e:
                db.rollback()
                if "reference" in str(e).lower() or "unique" in str(e).lower():
                    raise DuplicateTransactionException(transfer_in.source_account_id, transfer_in.reference_id)
                raise

    @staticmethod
    def get_transaction_history(
        db: Session,
        account_id: str,
        tx_type: Optional[TransactionType] = None,
        page: int = 1,
        limit: int = 10
    ) -> PaginatedResponse[TransactionResponse]:
        """
        Retrieves paginated, filtered transaction history in latest-first order.
        """
        AccountService.get_account_by_id(db, account_id)

        query = db.query(Transaction).filter(Transaction.account_id == account_id)

        if tx_type:
            query = query.filter(Transaction.type == tx_type.value)

        total_records = query.count()

        query = query.order_by(Transaction.created_at.desc(), Transaction.id.desc())

        offset = (page - 1) * limit
        transactions = query.offset(offset).limit(limit).all()

        items = [TransactionResponse.model_validate(t) for t in transactions]
        return PaginatedResponse.create(
            items=items,
            total_records=total_records,
            page=page,
            limit=limit
        )

    @staticmethod
    def reconcile_account(db: Session, account_id: str) -> AuditResponse:
        """
        Audit verification: recalculates sum(credits) - sum(debits) from the
        immutable transaction log and compares it against account.balance.
        Guarantees zero balance drift.
        """
        account = AccountService.get_account_by_id(db, account_id)

        credits = db.query(func.coalesce(func.sum(Transaction.amount), Decimal("0.0000"))).filter(
            Transaction.account_id == account_id,
            Transaction.type == "credit"
        ).scalar() or Decimal("0.0000")

        debits = db.query(func.coalesce(func.sum(Transaction.amount), Decimal("0.0000"))).filter(
            Transaction.account_id == account_id,
            Transaction.type == "debit"
        ).scalar() or Decimal("0.0000")

        count = db.query(Transaction).filter(Transaction.account_id == account_id).count()

        computed_balance = Decimal(str(credits)) - Decimal(str(debits))
        cached_balance = Decimal(str(account.balance))
        drift = cached_balance - computed_balance
        is_reconciled = (drift == Decimal("0.0000"))

        return AuditResponse(
            account_id=account.id,
            cached_balance=cached_balance,
            total_credits=Decimal(str(credits)),
            total_debits=Decimal(str(debits)),
            computed_balance=computed_balance,
            drift=drift,
            is_reconciled=is_reconciled,
            total_transactions=count
        )
