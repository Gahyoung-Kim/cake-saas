from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import uuid

from ..database import get_db
from ..models.user import User
from ..models.shop import Shop
from ..models.form_config import FormConfig
from ..schemas.shop import (
    ShopUpdate, ShopResponse, ShopResponse,
    SizeOption, FlavorOption,
    parse_form_config, dump_form_config,
)
from ..auth_utils import get_current_user

router = APIRouter()

_alias = {"response_model_by_alias": True}


def _get_or_create_config(shop_id: int, db: Session) -> FormConfig:
    config = db.query(FormConfig).filter(FormConfig.shop_id == shop_id).first()
    if not config:
        slug = str(uuid.uuid4())[:8]
        config = FormConfig(shop_id=shop_id, slug=slug, size_options=[], flavor_options=[])
        db.add(config)
        db.flush()
    return config


def _build_shop_response(shop: Shop, config: FormConfig) -> ShopResponse:
    return ShopResponse(
        id=shop.id,
        name=shop.name,
        owner_name=shop.owner_name,
        phone=shop.phone,
        daily_limit=shop.daily_limit,
        slug=config.slug,
        size_options=[SizeOption(**s) for s in (config.size_options or [])],
        flavor_options=[FlavorOption(**f) for f in (config.flavor_options or [])],
        cancellation_policy=config.cancellation_policy,
        form_config=parse_form_config(config.config_json),
    )


@router.get("", response_model=ShopResponse, **_alias)
def get_shop(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    shop = db.get(Shop, current_user.shop_id)
    config = _get_or_create_config(shop.id, db)
    db.commit()
    return _build_shop_response(shop, config)


@router.put("", response_model=ShopResponse, **_alias)
def update_shop(
    body: ShopUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    shop = db.get(Shop, current_user.shop_id)
    for field in ("name", "owner_name", "phone", "daily_limit"):
        val = getattr(body, field, None)
        if val is not None:
            setattr(shop, field, val)

    config = _get_or_create_config(shop.id, db)

    # 새 formConfig 저장
    if body.form_config is not None:
        config.config_json = dump_form_config(body.form_config)
        # 공개 주문서 하위 호환용 동기화
        config.size_options = [
            {"label": s.label, "price": s.price}
            for s in body.form_config.sizes
        ]
        config.flavor_options = [
            {"label": f.label}
            for f in body.form_config.flavors
        ]
        config.cancellation_policy = body.form_config.cancellation_policy

    # 기존 필드 개별 업데이트 (Settings 페이지용)
    else:
        if body.size_options is not None:
            config.size_options = [s.model_dump() for s in body.size_options]
        if body.flavor_options is not None:
            config.flavor_options = [f.model_dump() for f in body.flavor_options]
        if body.cancellation_policy is not None:
            config.cancellation_policy = body.cancellation_policy

    db.commit()
    db.refresh(shop)
    return _build_shop_response(shop, config)
