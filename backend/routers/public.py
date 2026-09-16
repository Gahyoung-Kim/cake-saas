from datetime import timedelta, date
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.order import Order, OrderStatus
from ..models.form_config import FormConfig
from ..services.customers import get_or_create_customer
from ..time_utils import today_kst, utcnow_naive
from ..schemas.shop import PublicShopResponse, PublicOrderCreate, SizeOption, FlavorOption, parse_form_config

router = APIRouter()

# 공개 주문서에서 선택 가능한 최대 미래 일수 (프론트 DatePicker의 14일 + 여유)
MAX_ADVANCE_DAYS = 90


_ACTIVE_STATUSES = [OrderStatus.inquiry, OrderStatus.confirmed, OrderStatus.making]


def _calc_price(config: FormConfig, body: PublicOrderCreate) -> int:
    """공개 주문서 금액을 서버에서 다시 계산한다.

    클라이언트가 보낸 price는 신뢰하지 않는다. 사장님이 설정한 옵션 가격만
    합산하며, 설정에 없는 옵션이 선택된 경우 0원으로 취급한다.
    """
    cfg = parse_form_config(config.config_json)

    # formConfig 우선, 없으면 구버전 size_options/flavor_options 폴백
    if cfg and cfg.sizes:
        size_prices = {s.label: s.price for s in cfg.sizes}
    else:
        size_prices = {s["label"]: s.get("price", 0) for s in (config.size_options or [])}

    if cfg and cfg.flavors:
        flavor_prices = {f.label: f.extra_price for f in cfg.flavors}
    else:
        flavor_prices = {f["label"]: 0 for f in (config.flavor_options or [])}

    tier_prices  = {t.name: t.extra_price for t in cfg.design_tiers}  if cfg else {}
    extra_prices = {o.label: o.price      for o in cfg.extra_options} if cfg else {}

    total = size_prices.get(body.cake_size or "", 0)
    total += flavor_prices.get(body.cake_flavor or "", 0)
    total += tier_prices.get(body.design_tier or "", 0)
    total += sum(extra_prices.get(label, 0) for label in body.selected_extras)
    return max(total, 0)


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
    shop = config.shop

    # ── 픽업 날짜 검증 (프론트는 D+1부터 노출하지만 서버에서 다시 막는다) ──
    today = today_kst()
    if body.pickup_date <= today:
        raise HTTPException(status_code=400, detail="픽업 날짜는 내일 이후로 선택해 주세요.")
    if (body.pickup_date - today).days > MAX_ADVANCE_DAYS:
        raise HTTPException(
            status_code=400,
            detail=f"픽업 날짜는 {MAX_ADVANCE_DAYS}일 이내로 선택해 주세요.",
        )

    # ── 일일 제작 한도 검증 ──
    now = utcnow_naive()
    same_day_count = (
        db.query(func.count(Order.id))
        .filter(
            Order.shop_id == shop.id,
            Order.pickup_date == body.pickup_date,
            Order.status.in_(_ACTIVE_STATUSES),
            ~(
                (Order.status == OrderStatus.inquiry)
                & Order.expires_at.isnot(None)
                & (Order.expires_at < now)
            ),
        )
        .scalar() or 0
    )
    if same_day_count >= shop.daily_limit:
        raise HTTPException(status_code=409, detail="선택하신 날짜는 예약이 마감되었습니다.")

    # ── 금액 재계산 (클라이언트가 보낸 price는 신뢰하지 않는다) ──
    price = _calc_price(config, body)

    customer = get_or_create_customer(
        db,
        shop_id=config.shop_id,
        name=body.customer_name,
        phone=body.customer_phone,
        ordered_at=now,
    )
    expire_minutes = shop.inquiry_expire_minutes
    expires_at = now + timedelta(minutes=expire_minutes) if expire_minutes > 0 else None

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
        price=price,
        status=OrderStatus.inquiry,
        expires_at=expires_at,
    )
    db.add(order)
    db.commit()
    return {"message": "주문이 접수되었습니다."}


@router.get("/order/{slug}/availability")
def get_availability(
    slug: str,
    db: Annotated[Session, Depends(get_db)],
    from_date: date = Query(alias="from"),
    days: int = Query(default=14, ge=1, le=90),
):
    config = _get_config(slug, db)
    shop = config.shop
    now = utcnow_naive()

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
