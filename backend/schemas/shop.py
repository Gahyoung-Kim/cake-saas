import json
from typing import Literal
from .base import CamelModel


# ── 기존 공개 주문서용 (하위 호환) ─────────────────────────────────────────

class SizeOption(CamelModel):
    label: str
    price: int = 0


class FlavorOption(CamelModel):
    label: str


# ── 새 formConfig 구조 ────────────────────────────────────────────────────

class FormSize(CamelModel):
    label: str
    price: int = 0


class FormFlavor(CamelModel):
    label: str
    extra_price: int = 0     # 0 = 기본 포함


class FormDesignTier(CamelModel):
    name: str
    description: str = ''
    extra_price: int = 0


class FormExtraOption(CamelModel):
    label: str
    price: int = 0


class FormPickup(CamelModel):
    type: Literal['store', 'quick'] = 'store'
    delivery_fee: int | None = None
    delivery_area: str | None = None
    store_notes: str | None = None   # 매장 픽업 준수사항


class FormConfig(CamelModel):
    sizes:               list[FormSize]        = []
    flavors:             list[FormFlavor]      = []
    design_tiers:        list[FormDesignTier]  = []
    extra_options:       list[FormExtraOption] = []
    pickup:              FormPickup            = FormPickup()
    cancellation_policy: str                   = ''


# ── ShopUpdate / ShopResponse ─────────────────────────────────────────────

class ShopUpdate(CamelModel):
    name:                str | None        = None
    owner_name:          str | None        = None
    phone:               str | None        = None
    daily_limit:         int | None        = None
    # 기존 필드 (하위 호환)
    size_options:        list[SizeOption] | None = None
    flavor_options:      list[FlavorOption] | None = None
    cancellation_policy: str | None        = None
    # 새 필드
    form_config:         FormConfig | None = None


class ShopResponse(CamelModel):
    id:                  int
    name:                str
    owner_name:          str | None
    phone:               str | None
    daily_limit:         int
    slug:                str | None
    size_options:        list[SizeOption]
    flavor_options:      list[FlavorOption]
    cancellation_policy: str | None
    form_config:         FormConfig | None = None


# ── 공개 주문서용 ─────────────────────────────────────────────────────────

class PublicShopResponse(CamelModel):
    shop_name:           str
    cancellation_policy: str | None
    size_options:        list[SizeOption]
    flavor_options:      list[FlavorOption]
    form_config:         FormConfig | None = None


class PublicOrderCreate(CamelModel):
    customer_name:  str
    customer_phone: str | None = None
    pickup_date:    str
    pickup_time:    str | None = None
    cake_size:      str | None = None
    cake_flavor:    str | None = None
    lettering:      str | None = None
    design_note:    str | None = None
    design_image:   str | None = None


# ── 유틸 ─────────────────────────────────────────────────────────────────

def parse_form_config(config_json: str | None) -> FormConfig | None:
    if not config_json:
        return None
    try:
        return FormConfig.model_validate(json.loads(config_json))
    except Exception:
        return None


def dump_form_config(fc: FormConfig) -> str:
    return fc.model_dump_json(by_alias=True)
