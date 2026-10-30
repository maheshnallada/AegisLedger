import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, String, Text, DateTime, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    destination_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(18, 4), nullable=False)
    reference_id = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("source_account_id <> destination_account_id", name="chk_transfer_distinct_accounts"),
        CheckConstraint("amount > 0", name="chk_transfer_positive_amount"),
    )

    source_account = relationship("Account", foreign_keys=[source_account_id])
    destination_account = relationship("Account", foreign_keys=[destination_account_id])

    def __repr__(self) -> str:
        return f"<Transfer id={self.id} from={self.source_account_id} to={self.destination_account_id} amount={self.amount}>"

