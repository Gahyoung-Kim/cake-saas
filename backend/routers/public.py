from datetime import datetime, timedelta, date
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.order import Order, OrderStatus
from ..models.form_config import FormConfig
from ..services.customers import get_or_create_customer
from ..schemas.shop import PublicShopResponse, PublicOrderCreate, SizeOption, FlavorOption, parse_form_config

router = APIRouter()


def _get_config(slug: str, db: Session) -> FormConfig:
    config = db.query(FormConfig).filter(FormConfig.slug == slug).first()
    if not config:
        raise HTTPException(status_code=404, detail="주문서를 찾을 수 없습니다.")
    return config


@router.get("/order/{slug}", response_model=PublicShopResponse, response_model_by_alias=True)
def get_public_form(slug: str, db: Annotated[Session, Depends(get_db)]):
    config = _get_config(slug, db)
    return PublicShopResponse(
        shop_name=config.shop.name,
        cancellation_policy=config.cancellation_policy,
        size_options=[SizeOption(**s) for s in (config.size_options or [])],
        flavor_options=[FlavorOption(**f) for f in (config.flavor_options or [])],
        form_config=parse_form_config(config.config_json),
    )


@router.post("/order/{slug}", status_code=201)
def submit_public_order(
    slug: str,
    body: PublicOrderCreate,
    db: Annotated[Session, Depends(get_db)],
):
    config = _get_config(slug, db)
    customer = get_or_create_customer(
        db,
        shop_id=config.shop_id,
        name=body.customer_name,
        phone=body.customer_phone,
        ordered_at=datetime.utcnow(),
    )
    expire_minutes = config.shop.inquiry_expire_minutes
    expires_at = datetime.utcnow() + timedelta(minutes=expire_minutes) if expire_minutes > 0 else None

    order = Order(
        shop_id=config.shop_id,
        customer_id=customer.id if customer else None,
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        pickup_date=body.pickup_date,
        pickup_time=body.pickup_time,
        cake_size=body.cake_size,
        cake_flavor=body.cake_flavor,
        lettering=body.lettering,
        design_note=body.design_note,
        design_image=body.design_image,
        price=body.price,
        status=OrderStatus.inquiry,
        expires_at=expires_at,
    )
    db.add(order)
    db.commit()
    return {"message": "주문이 접수되었습니다."}


_ACTIVE_STATUSES = [OrderStatus.inquiry, OrderStatus.confirmed, OrderStatus.making]


@router.get("/order/{slug}/availability")
def get_availability(
    slug: str,
    db: Annotated[Session, Depends(get_db)],
    from_date: date = Query(alias="from"),
    days: int = Query(default=14, ge=1, le=90),
):
    config = _get_config(slug, db)
    shop = config.shop
    now = datetime.utcnow()

    date_range = [from_date + timedelta(days=i) for i in range(days)]

    rows = (
        db.query(Order.pickup_date, func.count(Order.id))
        .filter(
            Order.shop_id == shop.id,
            Order.pickup_date >= date_range[0],
            Order.pickup_date <= date_range[-1],
            Order.status.in_(_ACTIVE_STATUSES),
            ~(
                (Order.status == OrderStatus.inquiry)
                & Order.expires_at.isnot(None)
                & (Order.expires_at < now)
            ),
        )
        .group_by(Order.pickup_date)
        .all()
    )

    counts: dict[date, int] = {r[0]: r[1] for r in rows}
    limit = shop.daily_limit

    def _status(count: int) -> str:
        if count >= limit:
            return "full"
        if count == limit - 1:
            return "almost"
        return "available"

    return [
        {
            "date": str(d),
            "count": counts.get(d, 0),
            "limit": limit,
            "status": _status(counts.get(d, 0)),
        }
        for d in date_range
    ]
