from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.app.models.account import Account
from backend.app.models.transaction import Transaction
from backend.app.schemas.transaction import TransactionCreate, TransactionType
from backend.app.services.strategies import StrategyFactory
from backend.app.exceptions.domain_exceptions import (
    AccountNotFoundException,
    DuplicateTransactionException,
)

class LedgerService:
    """
    Facade providing atomic, thread-safe financial ledger operations.
    Enforces ACID atomicity, pessimistic locking, and idempotency.
    """

    @staticmethod
    def get_account_for_update(db: Session, account_id: str) -> Account:
        """
        Retrieves account with pessimistic row lock (SELECT ... FOR UPDATE).
        In SQLite, with_for_update() is gracefully handled at transaction level.
        """
        query = db.query(Account).filter(Account.id == account_id)
        # Apply with_for_update if database engine supports row locks (e.g., PostgreSQL)
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
        # Step 1: Lock account row
        account = LedgerService.get_account_for_update(db, account_id)

        # Step 2: Idempotency check for reference_id within this account
        existing_tx = db.query(Transaction).filter(
            Transaction.account_id == account_id,
            Transaction.reference_id == tx_in.reference_id
        ).first()

        if existing_tx:
            raise DuplicateTransactionException(account_id, tx_in.reference_id)

        # Step 3: Compute new balance via Strategy Pattern
        strategy = StrategyFactory.get_strategy(tx_in.type)
        new_balance = strategy.calculate_new_balance(account.balance, tx_in.amount)

        # Step 4: Create immutable Transaction record
        transaction = Transaction(
            account_id=account.id,
            type=tx_in.type.value,
            amount=tx_in.amount,
            description=tx_in.description,
            reference_id=tx_in.reference_id
        )
        db.add(transaction)

        # Step 5: Update account balance
        account.balance = new_balance

        # Step 6: Atomic Commit
        try:
            db.commit()
            db.refresh(transaction)
            return transaction
        except IntegrityError as e:
            db.rollback()
            # Double protection if race condition slipped past application check
            if "uq_account_reference" in str(e).lower() or "unique" in str(e).lower():
                raise DuplicateTransactionException(account_id, tx_in.reference_id)
            raise
