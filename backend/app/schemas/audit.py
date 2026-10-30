from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class AuditResponse(BaseModel):
    account_id: str
    cached_balance: Decimal
    total_credits: Decimal
    total_debits: Decimal
    computed_balance: Decimal
    drift: Decimal
    is_reconciled: bool
    total_transactions: int

    model_config = ConfigDict(from_attributes=True)
