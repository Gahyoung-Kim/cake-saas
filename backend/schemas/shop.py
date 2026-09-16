import json
from datetime import date
from typing import Literal
from pydantic import Field, field_validator
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


class OperatingHours(CamelModel):
    start: str = '10:00'   # "HH:MM"
    end:   str = '19:00'   # "HH:MM"


class FormConfig(CamelModel):
    sizes:               list[FormSize]        = []
    flavors:             list[FormFlavor]      = []
    design_tiers:        list[FormDesignTier]  = []
    extra_options:       list[FormExtraOption] = []
    pickup:              FormPickup            = FormPickup()
    cancellation_policy: str                   = ''
    operating_hours:     OperatingHours | None = None
    kakao_channel_url:   str | None            = None


# ── ShopUpdate / ShopResponse ─────────────────────────────────────────────

class ShopUpdate(CamelModel):
    name:                str | None        = Field(default=None, min_length=1, max_length=100)
    owner_name:          str | None        = Field(default=None, max_length=50)
    phone:               str | None        = Field(default=None, max_length=20)
    daily_limit:         int | None        = Field(default=None, ge=1, le=100)
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
    customer_name:  str        = Field(min_length=1, max_length=50)
    customer_phone: str | None = Field(default=None, max_length=20)
    pickup_date:    date
    pickup_time:    str | None = Field(default=None, max_length=10)
    cake_size:      str | None = Field(default=None, max_length=20)
    cake_flavor:    str | None = Field(default=None, max_length=50)
    lettering:      str | None = Field(default=None, max_length=200)
    design_note:    str | None = Field(default=None, max_length=2000)
    design_image:   str | None = Field(default=None, max_length=500)
    # 서버가 금액을 재계산하기 위해 필요한 선택값 (price는 참고용으로만 받는다)
    design_tier:     str | None      = Field(default=None, max_length=100)
    selected_extras: list[str]       = Field(default_factory=list, max_length=20)
    price:           int             = Field(default=0, ge=0, le=100_000_000)

    @field_validator("customer_name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("이름을 입력해 주세요.")
        return v


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
