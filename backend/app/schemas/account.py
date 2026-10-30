from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

class AccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Account holder name")

    model_config = ConfigDict(extra="ignore")

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Account name must not be blank or whitespace.")
        return stripped

class AccountResponse(BaseModel):
    id: str
    name: str
    balance: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AccountBalanceResponse(BaseModel):
    account_id: str
    balance: Decimal
    account_name: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

