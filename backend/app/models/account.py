import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, DateTime, Numeric, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    balance = Column(Numeric(18, 4), nullable=False, default=Decimal("0.0000"))
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("balance >= 0", name="chk_account_balance_positive"),
    )

    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan", order_by="desc(Transaction.created_at)")

    def __repr__(self) -> str:
        return f"<Account id={self.id} name={self.name} balance={self.balance}>"
