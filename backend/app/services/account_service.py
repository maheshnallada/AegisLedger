from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.account import Account
from backend.app.schemas.account import AccountCreate, AccountBalanceResponse
from backend.app.exceptions.domain_exceptions import AccountNotFoundException

class AccountService:
    @staticmethod
    def create_account(db: Session, account_data: AccountCreate) -> Account:
        """
        Creates an account adhering to strict invariants:
        - System-generated UUID
        - System-generated UTC timestamp
        - Initial balance ALWAYS 0.0000 (cannot be client set)
        """
        account = Account(
            name=account_data.name,
            balance=Decimal("0.0000")
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return account

    @staticmethod
    def get_account_by_id(db: Session, account_id: str) -> Account:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise AccountNotFoundException(account_id)
        return account

    @staticmethod
    def get_account_balance(db: Session, account_id: str) -> AccountBalanceResponse:
        account = AccountService.get_account_by_id(db, account_id)
        return AccountBalanceResponse(
            account_id=account.id,
            balance=account.balance,
            account_name=account.name,
            created_at=account.created_at
        )

    @staticmethod
    def list_accounts(db: Session, skip: int = 0, limit: int = 100) -> List[Account]:
        return db.query(Account).order_by(Account.created_at.desc()).offset(skip).limit(limit).all()

