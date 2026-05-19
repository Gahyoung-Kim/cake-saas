from datetime import date, datetime
from pydantic import Field
from ..models.order import OrderStatus
from .base import CamelModel


class OrderCreate(CamelModel):
    customer_name: str | None = None
    customer_phone: str | None = None
    pickup_date: date
    pickup_time: str | None = None
    cake_size: str | None = None
    cake_flavor: str | None = None
    lettering: str | None = None
    design_note: str | None = None
    design_image: str | None = None
    price: int = 0
    deposit: int = 0
    raw_chat: str | None = None
    memo: str | None = None
    status: OrderStatus = OrderStatus.inquiry


class OrderUpdate(CamelModel):
    customer_name: str | None = None
    customer_phone: str | None = None
    pickup_date: date | None = None
    pickup_time: str | None = None
    cake_size: str | None = None
    cake_flavor: str | None = None
    lettering: str | None = None
    design_note: str | None = None
    design_image: str | None = None
    price: int | None = None
    deposit: int | None = None
    deposit_paid: bool | None = None
    memo: str | None = None
    status: OrderStatus | None = None


class StatusUpdate(CamelModel):
    status: OrderStatus


class DepositUpdate(CamelModel):
    deposit_paid: bool


class OrderResponse(CamelModel):
    id: int
    shop_id: int
    customer_name: str | None
    customer_phone: str | None
    pickup_date: date
    pickup_time: str | None
    cake_size: str | None
    cake_flavor: str | None
    lettering: str | None
    design_note: str | None
    design_image: str | None
    price: int
    deposit: int
    deposit_paid: bool
    status: OrderStatus
    raw_chat: str | None
    memo: str | None
    created_at: datetime
    updated_at: datetime


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
    chat_text: str


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
