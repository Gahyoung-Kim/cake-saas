from datetime import date, datetime
from pydantic import Field
from ..models.order import OrderStatus
from .base import CamelModel


# 컬럼 길이는 models/order.py와 맞춘다
_MONEY = {"ge": 0, "le": 100_000_000}


class OrderCreate(CamelModel):
    customer_name:  str | None = Field(default=None, max_length=50)
    customer_phone: str | None = Field(default=None, max_length=20)
    pickup_date:    date
    pickup_time:    str | None = Field(default=None, max_length=10)
    cake_size:      str | None = Field(default=None, max_length=20)
    cake_flavor:    str | None = Field(default=None, max_length=50)
    lettering:      str | None = Field(default=None, max_length=200)
    design_note:    str | None = Field(default=None, max_length=2000)
    design_image:   str | None = Field(default=None, max_length=500)
    price:          int = Field(default=0, **_MONEY)
    cost_price:     int = Field(default=0, **_MONEY)
    deposit:        int = Field(default=0, **_MONEY)
    raw_chat:       str | None = Field(default=None, max_length=10000)
    memo:           str | None = Field(default=None, max_length=2000)
    status:         OrderStatus = OrderStatus.inquiry


class OrderUpdate(CamelModel):
    customer_name:  str | None = Field(default=None, max_length=50)
    customer_phone: str | None = Field(default=None, max_length=20)
    pickup_date:    date | None = None
    pickup_time:    str | None = Field(default=None, max_length=10)
    cake_size:      str | None = Field(default=None, max_length=20)
    cake_flavor:    str | None = Field(default=None, max_length=50)
    lettering:      str | None = Field(default=None, max_length=200)
    design_note:    str | None = Field(default=None, max_length=2000)
    design_image:   str | None = Field(default=None, max_length=500)
    price:          int | None = Field(default=None, **_MONEY)
    cost_price:     int | None = Field(default=None, **_MONEY)
    deposit:        int | None = Field(default=None, **_MONEY)
    deposit_paid:   bool | None = None
    memo:           str | None = Field(default=None, max_length=2000)
    status:         OrderStatus | None = None


class StatusUpdate(CamelModel):
    status: OrderStatus


class DepositUpdate(CamelModel):
    deposit_paid: bool


class OrderResponse(CamelModel):
    id: int
    shop_id: int
    customer_id: int | None
    customer_name: str | None
    customer_phone: str | None
    pickup_date: date
    pickup_time: str | None
    cake_size: str | None
    cake_flavor: str | None
    lettering: str | None
    design_note: str | None
    design_image: str | None
    price:       int
    cost_price:  int
    deposit:     int
    deposit_paid: bool
    status:      OrderStatus
    raw_chat:    str | None
    memo:        str | None
    created_at:  datetime
    updated_at:  datetime


class OrderListResponse(CamelModel):
    items: list[OrderResponse]
    total: int
    page: int
    per_page: int


class CalendarDay(CamelModel):
    date: str
    count: int
    is_over_limit: bool
    # 상태별 건수 (도트 표시용)
    inquiry: int = 0
    confirmed: int = 0
    making: int = 0
    done: int = 0
    cancelled: int = 0


class ExtractRequest(CamelModel):
    # 토큰 비용이 입력 길이에 비례하므로 상한을 둔다
    chat_text: str = Field(min_length=1, max_length=5000)


class ExtractResponse(CamelModel):
    customer_name: str | None = None
    pickup_date: str | None = None
    pickup_time: str | None = None
    cake_size: str | None = None
    cake_flavor: str | None = None
    lettering: str | None = None
    design_note: str | None = None
    price: int | None = None
    deposit: int | None = None
    confidence: float = 0.0
