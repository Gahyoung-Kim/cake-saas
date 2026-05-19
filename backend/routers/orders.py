from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.order import Order, OrderStatus
from ..schemas.order import (
    OrderCreate, OrderUpdate, StatusUpdate, DepositUpdate,
    OrderResponse, OrderListResponse,
)
from ..auth_utils import get_current_user

router = APIRouter()

_alias = {"response_model_by_alias": True}


def _get_order(order_id: int, shop_id: int, db: Session) -> Order:
    order = db.query(Order).filter(Order.id == order_id, Order.shop_id == shop_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="예약을 찾을 수 없습니다.")
    return order


@router.get("", response_model=OrderListResponse, **_alias)
def list_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    date: str | None = Query(None),
    status: OrderStatus | None = Query(None),
    search: str | None = Query(None, description="고객명 또는 케이크 맛 검색"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    q = db.query(Order).filter(Order.shop_id == current_user.shop_id)
    if date:
        q = q.filter(Order.pickup_date == date)
    if status:
        q = q.filter(Order.status == status)
    if search:
        like = f"%{search}%"
        q = q.filter(
            Order.customer_name.ilike(like) | Order.cake_flavor.ilike(like)
        )
    total = q.count()
    items = (
        q.order_by(Order.pickup_date, Order.pickup_time)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return OrderListResponse(items=items, total=total, page=page, per_page=per_page)


@router.post("", response_model=OrderResponse, status_code=201, **_alias)
def create_order(
    body: OrderCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    order = Order(**body.model_dump(), shop_id=current_user.shop_id)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderResponse, **_alias)
def get_order(
    order_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return _get_order(order_id, current_user.shop_id, db)


@router.put("/{order_id}", response_model=OrderResponse, **_alias)
def update_order(
    order_id: int,
    body: OrderUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    order = _get_order(order_id, current_user.shop_id, db)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(order, k, v)
    db.commit()
    db.refresh(order)
    return order


@router.patch("/{order_id}/status", response_model=OrderResponse, **_alias)
def update_status(
    order_id: int,
    body: StatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    order = _get_order(order_id, current_user.shop_id, db)
    order.status = body.status
    db.commit()
    db.refresh(order)
    return order


@router.patch("/{order_id}/deposit", response_model=OrderResponse, **_alias)
def update_deposit(
    order_id: int,
    body: DepositUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    order = _get_order(order_id, current_user.shop_id, db)
    order.deposit_paid = body.deposit_paid
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=204)
def delete_order(
    order_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    order = _get_order(order_id, current_user.shop_id, db)
    db.delete(order)
    db.commit()
