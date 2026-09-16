from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base
from ..time_utils import utcnow_naive


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("shop_id", "phone_normalized", name="uq_customers_shop_phone_normalized"),
        Index("ix_customers_shop_name", "shop_id", "name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shop_id: Mapped[int] = mapped_column(Integer, ForeignKey("shops.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    phone_normalized: Mapped[str | None] = mapped_column(String(20))
    memo: Mapped[str | None] = mapped_column(Text)
    last_order_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow_naive, onupdate=utcnow_naive
    )

    shop: Mapped["Shop"] = relationship("Shop", back_populates="customers")  # type: ignore[name-defined]
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="customer")  # type: ignore[name-defined]
