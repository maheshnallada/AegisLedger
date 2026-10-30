from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from backend.app.exceptions.domain_exceptions import SelfTransferException

class TransferCreate(BaseModel):
    source_account_id: str = Field(..., min_length=1, description="Source account identifier")
    destination_account_id: str = Field(..., min_length=1, description="Destination account identifier")
    amount: Decimal = Field(..., gt=Decimal("0.0000"), description="Transfer amount, must be greater than 0")
    reference_id: str = Field(..., min_length=1, max_length=100, description="Unique transfer reference")
    description: str = Field(..., min_length=1, max_length=500, description="Transfer memo/description")

    model_config = ConfigDict(extra="forbid")

    @field_validator("destination_account_id")
    @classmethod
    def validate_distinct_accounts(cls, v: str, info) -> str:
        src = info.data.get("source_account_id")
        if src and v == src:
            raise SelfTransferException(v)
        return v

    @field_validator("reference_id")
    @classmethod
    def validate_reference_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Reference ID must not be blank.")
        return stripped

    @field_validator("description")
    @classmethod
    def validate_description_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Description must not be blank.")
        return stripped

class TransferResponse(BaseModel):
    id: str
    source_account_id: str
    destination_account_id: str
    amount: Decimal
    reference_id: str
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
