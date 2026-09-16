from datetime import datetime
from sqlalchemy import Integer, String, Text, Boolean, Date, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from ..database import Base
from ..time_utils import utcnow_naive


class OrderStatus(str, enum.Enum):
    inquiry = "inquiry"
    confirmed = "confirmed"
    making = "making"
    done = "done"
    cancelled = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shop_id: Mapped[int] = mapped_column(Integer, ForeignKey("shops.id"), nullable=False)
    customer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("customers.id"))
    customer_name: Mapped[str | None] = mapped_column(String(50))
    customer_phone: Mapped[str | None] = mapped_column(String(20))
    pickup_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    pickup_time: Mapped[str | None] = mapped_column(String(10))
    cake_size: Mapped[str | None] = mapped_column(String(20))
    cake_flavor: Mapped[str | None] = mapped_column(String(50))
    lettering: Mapped[str | None] = mapped_column(String(200))
    design_note: Mapped[str | None] = mapped_column(Text)
    design_image: Mapped[str | None] = mapped_column(String(500))
    price:       Mapped[int] = mapped_column(Integer, default=0)
    cost_price:  Mapped[int] = mapped_column(Integer, default=0)
    deposit:     Mapped[int] = mapped_column(Integer, default=0)
    deposit_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.inquiry
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    raw_chat: Mapped[str | None] = mapped_column(Text)
    memo: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow_naive, onupdate=utcnow_naive
    )

    shop: Mapped["Shop"] = relationship("Shop", back_populates="orders")  # type: ignore[name-defined]
    customer: Mapped["Customer | None"] = relationship("Customer", back_populates="orders")  # type: ignore[name-defined]
