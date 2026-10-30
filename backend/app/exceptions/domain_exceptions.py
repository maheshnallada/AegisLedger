from typing import Any, Dict, Optional

class LedgerDomainException(Exception):
    """Base exception for all Ledger domain errors."""
    def __init__(self, message: str, code: str = "LEDGER_ERROR", status_code: int = 400, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}

class AccountNotFoundException(LedgerDomainException):
    def __init__(self, account_id: str):
        super().__init__(
            message=f"Account with ID '{account_id}' was not found.",
            code="ACCOUNT_NOT_FOUND",
            status_code=404,
            details={"account_id": account_id}
        )

class InsufficientBalanceException(LedgerDomainException):
    def __init__(self, current_balance: Any, requested_amount: Any):
        super().__init__(
            message=f"Insufficient balance. Current balance is {current_balance}, but requested debit is {requested_amount}.",
            code="INSUFFICIENT_FUNDS",
            status_code=400,
            details={"current_balance": current_balance, "requested_amount": requested_amount}
        )

class DuplicateTransactionException(LedgerDomainException):
    def __init__(self, account_id: str, reference_id: str):
        super().__init__(
            message=f"Transaction with reference ID '{reference_id}' already exists for account '{account_id}'.",
            code="DUPLICATE_TRANSACTION",
            status_code=409,
            details={"account_id": account_id, "reference_id": reference_id}
        )

class InvalidTransactionException(LedgerDomainException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="INVALID_TRANSACTION",
            status_code=400,
            details=details or {}
        )

class SelfTransferException(LedgerDomainException):
    def __init__(self, account_id: str):
        super().__init__(
            message="Source and destination accounts must be distinct.",
            code="SELF_TRANSFER_PROHIBITED",
            status_code=400,
            details={"account_id": account_id}
        )
