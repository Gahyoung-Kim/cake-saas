import calendar as cal_module
from collections import defaultdict
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.order import Order, OrderStatus
from ..models.shop import Shop
from ..schemas.order import CalendarDay
from ..auth_utils import get_current_user

router = APIRouter()


@router.get("/calendar", response_model=list[CalendarDay], response_model_by_alias=True)
def get_calendar(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    year: int = Query(..., ge=2020, le=2099),
    month: int = Query(..., ge=1, le=12),
):
    shop = db.get(Shop, current_user.shop_id)
    daily_limit = shop.daily_limit if shop else 5

    # 날짜 × 상태별 건수 조회
    rows = (
        db.query(Order.pickup_date, Order.status, func.count(Order.id).label("cnt"))
        .filter(
            Order.shop_id == current_user.shop_id,
            func.year(Order.pickup_date) == year,
            func.month(Order.pickup_date) == month,
        )
        .group_by(Order.pickup_date, Order.status)
        .all()
    )

    # {date_str: {status: count}} 구조로 변환
    status_map: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for row in rows:
        status_map[str(row.pickup_date)][row.status.value] += row.cnt

    days_in_month = cal_module.monthrange(year, month)[1]
    result = []
    for day in range(1, days_in_month + 1):
        date_str = f"{year}-{month:02d}-{day:02d}"
        s = status_map.get(date_str, {})
        total = sum(s.values())
        result.append(CalendarDay(
            date=date_str,
            count=total,
            is_over_limit=total >= daily_limit,
            inquiry=s.get(OrderStatus.inquiry.value, 0),
            confirmed=s.get(OrderStatus.confirmed.value, 0),
            making=s.get(OrderStatus.making.value, 0),
            done=s.get(OrderStatus.done.value, 0),
            cancelled=s.get(OrderStatus.cancelled.value, 0),
        ))
    return result
