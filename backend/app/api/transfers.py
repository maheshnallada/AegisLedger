from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.transfer import TransferCreate, TransferResponse
from backend.app.services.ledger_service import LedgerService

router = APIRouter(prefix="/transfers", tags=["Transfers"])

@router.post("", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
def transfer_money(transfer_in: TransferCreate, db: Session = Depends(get_db)):
    """
    Transfer money atomically between two distinct accounts.
    - Debits source account and credits destination account atomically.
    - Prevents deadlocks via deterministic lock ordering.
    - If either part fails, entire operation rolls back.
    """
    return LedgerService.execute_transfer(db, transfer_in)

