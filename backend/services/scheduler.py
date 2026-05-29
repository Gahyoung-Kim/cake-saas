from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from ..database import SessionLocal
from ..models.order import Order, OrderStatus

_scheduler = BackgroundScheduler(timezone="UTC")


def _expire_inquiries() -> None:
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        expired = (
            db.query(Order)
            .filter(
                Order.status == OrderStatus.inquiry,
                Order.expires_at.isnot(None),
                Order.expires_at < now,
            )
            .all()
        )
        if expired:
            for order in expired:
                order.status = OrderStatus.cancelled
            db.commit()
    finally:
        db.close()


def start_scheduler() -> None:
    _scheduler.add_job(_expire_inquiries, "interval", minutes=5, id="expire_inquiries")
    _scheduler.start()


def stop_scheduler() -> None:
    _scheduler.shutdown(wait=False)
