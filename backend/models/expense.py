from datetime import datetime, date
from sqlalchemy import Integer, Text, Date, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from ..database import Base
from ..time_utils import utcnow_naive


class ExpenseCategory(str, enum.Enum):
    임대료 = "임대료"
    전기세 = "전기세"
    재료비 = "재료비"
    포장재 = "포장재"
    기타   = "기타"


class Expense(Base):
    __tablename__ = "expenses"

    id:           Mapped[int]             = mapped_column(Integer, primary_key=True, autoincrement=True)
    shop_id:      Mapped[int]             = mapped_column(Integer, ForeignKey("shops.id"), nullable=False)
    category:     Mapped[ExpenseCategory] = mapped_column(Enum(ExpenseCategory), nullable=False)
    amount:       Mapped[int]             = mapped_column(Integer, nullable=False)
    memo:         Mapped[str | None]      = mapped_column(Text)
    expense_date: Mapped[date]            = mapped_column(Date, nullable=False)
    created_at:   Mapped[datetime]        = mapped_column(DateTime, default=utcnow_naive)

    shop: Mapped["Shop"] = relationship("Shop", back_populates="expenses")  # type: ignore[name-defined]
