from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from ..database import get_db
from ..models.user import User
from ..models.customer import Customer
from ..models.order import Order, OrderStatus
from ..schemas.base import CamelModel
from ..schemas.order import OrderResponse
from ..auth_utils import get_current_user

router = APIRouter()

_REVENUE_STATUSES = [OrderStatus.confirmed, OrderStatus.making, OrderStatus.done]
_alias = {"response_model_by_alias": True}


class CustomerSummary(CamelModel):
    customer_id:      int
    customer_name:    str
    customer_phone:   str | None
    order_count:      int
    total_revenue:    int
    last_pickup_date: str | None
    last_status:      str | None


@router.get("", response_model=list[CustomerSummary], **_alias)
def list_customers(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    search: str | None = Query(None),
):
    query = (
        db.query(
            Customer.id.label("customer_id"),
            Customer.name.label("customer_name"),
            Customer.phone.label("customer_phone"),
            func.count(Order.id).label("order_count"),
            func.coalesce(
                func.sum(
                    case(
                        (Order.status.in_(_REVENUE_STATUSES), Order.price),
                        else_=0,
                    )
                ),
                0,
            ).label("total_revenue"),
            func.max(Order.pickup_date).label("last_pickup_date"),
        )
        .join(Order, Order.customer_id == Customer.id)
        .filter(Customer.shop_id == current_user.shop_id)
        .group_by(Customer.id, Customer.name, Customer.phone)
    )

    if search:
        like = f"%{search}%"
        query = query.filter(Customer.name.ilike(like) | Customer.phone.ilike(like))

    rows = query.order_by(func.max(Order.pickup_date).desc()).all()

    result = []
    for row in rows:
        last_order = (
            db.query(Order.status)
            .filter(
                Order.shop_id == current_user.shop_id,
                Order.customer_id == row.customer_id,
            )
            .order_by(Order.pickup_date.desc(), Order.created_at.desc())
            .first()
        )
        result.append(CustomerSummary(
            customer_id=row.customer_id,
            customer_name=row.customer_name,
            customer_phone=row.customer_phone,
            order_count=row.order_count,
            total_revenue=row.total_revenue,
            last_pickup_date=str(row.last_pickup_date) if row.last_pickup_date else None,
            last_status=last_order[0].value if last_order else None,
        ))

    return result


@router.get("/{customer_id}/orders", response_model=list[OrderResponse], **_alias)
def get_customer_orders(
    customer_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.shop_id == current_user.shop_id,
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다.")

    return (
        db.query(Order)
        .filter(Order.customer_id == customer_id, Order.shop_id == current_user.shop_id)
        .order_by(Order.pickup_date.desc(), Order.created_at.desc())
        .all()
    )
