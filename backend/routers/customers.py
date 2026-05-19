from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.order import Order, OrderStatus
from ..schemas.base import CamelModel
from ..auth_utils import get_current_user

router = APIRouter()


class CustomerSummary(CamelModel):
    customer_name: str
    customer_phone: str | None
    order_count: int
    total_revenue: int
    last_pickup_date: str | None
    last_status: str | None


@router.get("", response_model=list[CustomerSummary], response_model_by_alias=True)
def list_customers(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    search: str | None = Query(None),
):
    # customer_name + customer_phone 기준으로 그룹핑
    subq = (
        db.query(
            Order.customer_name,
            Order.customer_phone,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.price), 0).label("total_revenue"),
            func.max(Order.pickup_date).label("last_pickup_date"),
        )
        .filter(
            Order.shop_id == current_user.shop_id,
            Order.customer_name.isnot(None),
            Order.status != OrderStatus.cancelled,
        )
        .group_by(Order.customer_name, Order.customer_phone)
    )

    if search:
        like = f"%{search}%"
        subq = subq.filter(
            Order.customer_name.ilike(like) | Order.customer_phone.ilike(like)
        )

    rows = subq.order_by(func.max(Order.pickup_date).desc()).all()

    result = []
    for row in rows:
        # 해당 고객의 마지막 주문 상태
        last_order = (
            db.query(Order.status)
            .filter(
                Order.shop_id == current_user.shop_id,
                Order.customer_name == row.customer_name,
                Order.customer_phone == row.customer_phone,
                Order.status != OrderStatus.cancelled,
            )
            .order_by(Order.pickup_date.desc())
            .first()
        )
        result.append(CustomerSummary(
            customer_name=row.customer_name,
            customer_phone=row.customer_phone,
            order_count=row.order_count,
            total_revenue=row.total_revenue,
            last_pickup_date=str(row.last_pickup_date) if row.last_pickup_date else None,
            last_status=last_order[0].value if last_order else None,
        ))

    return result
