from abc import ABC, abstractmethod
from decimal import Decimal
from backend.app.schemas.transaction import TransactionType
from backend.app.exceptions.domain_exceptions import InsufficientBalanceException

class TransactionPostingStrategy(ABC):
    """Abstract Strategy defining balance modification contract."""

    @abstractmethod
    def calculate_new_balance(self, current_balance: Decimal, amount: Decimal) -> Decimal:
        """Computes the new balance given current balance and transaction amount."""
        pass

class CreditStrategy(TransactionPostingStrategy):
    """Credit strategy: increases the account balance."""
    def calculate_new_balance(self, current_balance: Decimal, amount: Decimal) -> Decimal:
        return current_balance + amount

class DebitStrategy(TransactionPostingStrategy):
    """Debit strategy: checks sufficiency and decreases the account balance."""
    def calculate_new_balance(self, current_balance: Decimal, amount: Decimal) -> Decimal:
        if current_balance < amount:
            raise InsufficientBalanceException(
                current_balance=float(current_balance),
                requested_amount=float(amount)
            )
        return current_balance - amount

class StrategyFactory:
    """Factory to retrieve the appropriate strategy for a transaction type."""
    _strategies = {
        TransactionType.CREDIT: CreditStrategy(),
        TransactionType.DEBIT: DebitStrategy(),
    }

    @classmethod
    def get_strategy(cls, tx_type: TransactionType) -> TransactionPostingStrategy:
        strategy = cls._strategies.get(tx_type)
        if not strategy:
            raise ValueError(f"No posting strategy found for transaction type: {tx_type}")
        return strategy
