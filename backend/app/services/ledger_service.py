from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.app.models.account import Account
from backend.app.models.transaction import Transaction
from backend.app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionType
from backend.app.schemas.common import PaginatedResponse
from backend.app.services.strategies import StrategyFactory
from backend.app.services.account_service import AccountService
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
        """
        account = LedgerService.get_account_for_update(db, account_id)

        # Idempotency check for reference_id within this account
        existing_tx = db.query(Transaction).filter(
            Transaction.account_id == account_id,
            Transaction.reference_id == tx_in.reference_id
        ).first()

        if existing_tx:
            raise DuplicateTransactionException(account_id, tx_in.reference_id)

        # Compute new balance via Strategy Pattern
        strategy = StrategyFactory.get_strategy(tx_in.type)
        new_balance = strategy.calculate_new_balance(account.balance, tx_in.amount)

        # Create immutable Transaction record
        transaction = Transaction(
            account_id=account.id,
            type=tx_in.type.value,
            amount=tx_in.amount,
            description=tx_in.description,
            reference_id=tx_in.reference_id
        )
        db.add(transaction)

        # Update account balance
        account.balance = new_balance

        # Atomic Commit
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
        # Ensure account exists first; raises 404 if not found
        AccountService.get_account_by_id(db, account_id)

        query = db.query(Transaction).filter(Transaction.account_id == account_id)

        if tx_type:
            query = query.filter(Transaction.type == tx_type.value)

        total_records = query.count()

        # Strict latest-first order: created_at DESC with tiebreaker id DESC
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
