from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionType
from backend.app.schemas.common import PaginatedResponse
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

@router.get("", response_model=PaginatedResponse[TransactionResponse])
def get_transaction_history(
    account_id: str,
    type: Optional[TransactionType] = Query(None, description="Filter by type: credit or debit. Omit for all."),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=100, description="Page limit / page size"),
    db: Session = Depends(get_db)
):
    """
    Fetch all transactions for an account with filtering, pagination, and latest-first sorting.
    """
    return LedgerService.get_transaction_history(
        db=db,
        account_id=account_id,
        tx_type=type,
        page=page,
        limit=limit
    )
