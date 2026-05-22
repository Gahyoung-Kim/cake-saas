from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class FormConfig(Base):
    __tablename__ = "form_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shop_id: Mapped[int] = mapped_column(Integer, ForeignKey("shops.id"), nullable=False, unique=True)
    size_options: Mapped[list | None] = mapped_column(JSON)
    flavor_options: Mapped[list | None] = mapped_column(JSON)
    cancellation_policy: Mapped[str | None] = mapped_column(Text)
    slug: Mapped[str | None] = mapped_column(String(100), unique=True)
    config_json: Mapped[str | None] = mapped_column(Text)   # 전체 formConfig JSON
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    shop: Mapped["Shop"] = relationship("Shop", back_populates="form_config")  # type: ignore[name-defined]
