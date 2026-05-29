from calendar import monthrange
from datetime import date, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.order import Order, OrderStatus
from ..models.expense import Expense
from ..schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from ..auth_utils import get_current_user

router = APIRouter()

_REVENUE_STATUSES = [OrderStatus.confirmed, OrderStatus.making, OrderStatus.done]
_alias = {"response_model_by_alias": True}


# ── 매출 요약 ──────────────────────────────────────────────────────────────

@router.get("/revenue")
def get_revenue(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    year:  int = Query(...),
    month: int = Query(...),
):
    shop_id = current_user.shop_id
    _, last_day = monthrange(year, month)
    month_start = date(year, month, 1)
    month_end   = date(year, month, last_day)

    # 월별 주문 집계 (pickup_date 기준)
    orders = (
        db.query(Order)
        .filter(
            Order.shop_id == shop_id,
            Order.pickup_date >= month_start,
            Order.pickup_date <= month_end,
            Order.status.in_(_REVENUE_STATUSES),
        )
        .all()
    )

    revenue_total  = sum(o.price      for o in orders)
    cost_total     = sum(o.cost_price for o in orders)
    confirmed_count = len(orders)

    unpaid_count = (
        db.query(func.count(Order.id))
        .filter(
            Order.shop_id == shop_id,
            Order.pickup_date >= month_start,
            Order.pickup_date <= month_end,
            Order.status.in_([OrderStatus.confirmed, OrderStatus.making]),
            Order.deposit_paid == False,
        )
        .scalar() or 0
    )

    # 지출 합계
    expense_total = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.shop_id == shop_id,
            Expense.expense_date >= month_start,
            Expense.expense_date <= month_end,
        )
        .scalar() or 0
    )

    # 일별 집계
    daily_map: dict[date, dict] = {}
    for o in orders:
        d = o.pickup_date
        if d not in daily_map:
            daily_map[d] = {"revenue": 0, "cost": 0, "order_count": 0}
        daily_map[d]["revenue"]     += o.price
        daily_map[d]["cost"]        += o.cost_price
        daily_map[d]["order_count"] += 1

    daily = [
        {
            "date":        str(month_start + timedelta(days=i)),
            "revenue":     daily_map.get(month_start + timedelta(days=i), {}).get("revenue",     0),
            "cost":        daily_map.get(month_start + timedelta(days=i), {}).get("cost",        0),
            "orderCount":  daily_map.get(month_start + timedelta(days=i), {}).get("order_count", 0),
        }
        for i in range(last_day)
    ]

    return {
        "revenueTotal":   revenue_total,
        "costTotal":      cost_total,
        "expenseTotal":   expense_total,
        "netProfit":      revenue_total - cost_total - expense_total,
        "confirmedCount": confirmed_count,
        "unpaidCount":    unpaid_count,
        "daily":          daily,
    }


# ── 지출 CRUD ──────────────────────────────────────────────────────────────

@router.get("/expenses", response_model=list[ExpenseResponse], **_alias)
def list_expenses(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    year:  int = Query(...),
    month: int = Query(...),
):
    _, last_day = monthrange(year, month)
    return (
        db.query(Expense)
        .filter(
            Expense.shop_id == current_user.shop_id,
            Expense.expense_date >= date(year, month, 1),
            Expense.expense_date <= date(year, month, last_day),
        )
        .order_by(Expense.expense_date, Expense.id)
        .all()
    )


@router.post("/expenses", response_model=ExpenseResponse, status_code=201, **_alias)
def create_expense(
    body: ExpenseCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    expense = Expense(**body.model_dump(), shop_id=current_user.shop_id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/expenses/{expense_id}", response_model=ExpenseResponse, **_alias)
def update_expense(
    expense_id: int,
    body: ExpenseUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.shop_id == current_user.shop_id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="지출 내역을 찾을 수 없습니다.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(expense, k, v)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.shop_id == current_user.shop_id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="지출 내역을 찾을 수 없습니다.")
    db.delete(expense)
    db.commit()
