from datetime import datetime
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Shop(Base):
    __tablename__ = "shops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    owner_name: Mapped[str | None] = mapped_column(String(50))
    phone: Mapped[str | None] = mapped_column(String(20))
    daily_limit: Mapped[int] = mapped_column(Integer, default=5)
    inquiry_expire_minutes: Mapped[int] = mapped_column(Integer, default=60)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users:       Mapped[list["User"]]       = relationship("User",       back_populates="shop")  # type: ignore[name-defined]
    customers:   Mapped[list["Customer"]]   = relationship("Customer",   back_populates="shop")  # type: ignore[name-defined]
    orders:      Mapped[list["Order"]]      = relationship("Order",      back_populates="shop")  # type: ignore[name-defined]
    expenses:    Mapped[list["Expense"]]    = relationship("Expense",    back_populates="shop")  # type: ignore[name-defined]
    form_config: Mapped["FormConfig | None"] = relationship("FormConfig", back_populates="shop", uselist=False)  # type: ignore[name-defined]
