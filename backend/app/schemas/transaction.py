from datetime import datetime
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field, field_validator

class TransactionType(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"

class TransactionCreate(BaseModel):
    type: TransactionType = Field(..., description="Transaction type: credit or debit")
    amount: Decimal = Field(..., gt=Decimal("0.0000"), description="Transaction amount, must be greater than 0")
    description: str = Field(..., min_length=1, max_length=500, description="Description of transaction")
    reference_id: str = Field(..., min_length=1, max_length=100, description="Unique reference for transaction within account")

    model_config = ConfigDict(extra="forbid")

    @field_validator("description")
    @classmethod
    def validate_description_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Description must not be blank.")
        return stripped

    @field_validator("reference_id")
    @classmethod
    def validate_reference_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Reference ID must not be blank.")
        return stripped

class TransactionResponse(BaseModel):
    id: str
    account_id: str
    type: str
    amount: Decimal
    description: str
    reference_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

