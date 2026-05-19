from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.order import Order, OrderStatus
from ..models.form_config import FormConfig
from ..schemas.shop import PublicShopResponse, PublicOrderCreate, SizeOption, FlavorOption

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
    )


@router.post("/order/{slug}", status_code=201)
def submit_public_order(
    slug: str,
    body: PublicOrderCreate,
    db: Annotated[Session, Depends(get_db)],
):
    config = _get_config(slug, db)
    order = Order(
        shop_id=config.shop_id,
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        pickup_date=body.pickup_date,
        pickup_time=body.pickup_time,
        cake_size=body.cake_size,
        cake_flavor=body.cake_flavor,
        lettering=body.lettering,
        design_note=body.design_note,
        status=OrderStatus.inquiry,
    )
    db.add(order)
    db.commit()
    return {"message": "주문이 접수되었습니다."}
