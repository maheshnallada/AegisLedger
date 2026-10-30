from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.transaction import TransactionCreate, TransactionResponse
from backend.app.services.ledger_service import LedgerService

router = APIRouter(prefix="/accounts/{account_id}/transactions", tags=["Transactions"])

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def add_transaction(account_id: str, tx_in: TransactionCreate, db: Session = Depends(get_db)):
    """
    Add a credit or debit transaction to an account.
    - Credit: increases account balance
    - Debit: decreases account balance (rejected if insufficient funds)
    - reference_id: must be unique per account (returns 409 if duplicate)
    """
    return LedgerService.record_transaction(db, account_id, tx_in)
