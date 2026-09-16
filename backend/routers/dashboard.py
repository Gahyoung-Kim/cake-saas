from datetime import date
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.order import Order, OrderStatus
from ..schemas.base import CamelModel
from ..auth_utils import get_current_user
from ..time_utils import today_kst

router = APIRouter()

# "대기중" 으로 간주하는 상태 목록 — 상태 enum 변경 시 이곳만 수정
PENDING_STATUSES = [OrderStatus.inquiry, OrderStatus.confirmed]


class DashboardStats(CamelModel):
    # 이번 달 예약
    monthly_count: int
    monthly_count_prev: int          # 전월

    # 이번 달 매출
    monthly_revenue: int
    monthly_revenue_prev: int

    # 대기중 (문의 + 확정)
    pending_count: int

    # 오늘 픽업
    today_count: int
    today_pickup_times: list[str]    # ["14:00", "16:30"] 등


def _month_range(y: int, m: int) -> tuple[date, date]:
    """해당 월의 첫날, 마지막날 반환"""
    import calendar as cal
    last_day = cal.monthrange(y, m)[1]
    return date(y, m, 1), date(y, m, last_day)


def _prev_month(y: int, m: int) -> tuple[int, int]:
    return (y, m - 1) if m > 1 else (y - 1, 12)


@router.get("/stats", response_model=DashboardStats, response_model_by_alias=True)
def get_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    today = today_kst()
    y, m = today.year, today.month

    # 이번 달
    cur_start, cur_end = _month_range(y, m)
    # 전월
    py, pm = _prev_month(y, m)
    prev_start, prev_end = _month_range(py, pm)

    shop_id = current_user.shop_id

    def month_count(start: date, end: date) -> int:
        return (
            db.query(func.count(Order.id))
            .filter(Order.shop_id == shop_id,
                    Order.pickup_date >= start,
                    Order.pickup_date <= end,
                    Order.status != OrderStatus.cancelled)
            .scalar() or 0
        )

    def month_revenue(start: date, end: date) -> int:
        return (
            db.query(func.coalesce(func.sum(Order.price), 0))
            .filter(Order.shop_id == shop_id,
                    Order.pickup_date >= start,
                    Order.pickup_date <= end,
                    Order.status.in_([OrderStatus.confirmed, OrderStatus.making, OrderStatus.done]))
            .scalar() or 0
        )

    # 대기중 (PENDING_STATUSES 참조)
    pending = (
        db.query(func.count(Order.id))
        .filter(Order.shop_id == shop_id,
                Order.status.in_(PENDING_STATUSES))
        .scalar() or 0
    )

    # 오늘 픽업
    today_orders = (
        db.query(Order)
        .filter(Order.shop_id == shop_id,
                Order.pickup_date == today,
                Order.status != OrderStatus.cancelled)
        .order_by(Order.pickup_time)
        .all()
    )
    today_times = [o.pickup_time for o in today_orders if o.pickup_time]

    return DashboardStats(
        monthly_count=month_count(cur_start, cur_end),
        monthly_count_prev=month_count(prev_start, prev_end),
        monthly_revenue=month_revenue(cur_start, cur_end),
        monthly_revenue_prev=month_revenue(prev_start, prev_end),
        pending_count=pending,
        today_count=len(today_orders),
        today_pickup_times=today_times,
    )
