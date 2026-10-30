import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, Text, DateTime, Numeric, ForeignKey, UniqueConstraint, CheckConstraint, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    type = Column(String(10), nullable=False)  # 'credit' or 'debit'
    amount = Column(Numeric(18, 4), nullable=False)
    description = Column(Text, nullable=False)
    reference_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("account_id", "reference_id", name="uq_account_reference_id"),
        CheckConstraint("type IN ('credit', 'debit')", name="chk_transaction_type"),
        CheckConstraint("amount > 0", name="chk_transaction_positive_amount"),
        Index("idx_tx_account_created", "account_id", "created_at"),
    )

    account = relationship("Account", back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction id={self.id} account_id={self.account_id} type={self.type} amount={self.amount} ref={self.reference_id}>"
