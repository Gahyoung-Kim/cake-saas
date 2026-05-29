from datetime import datetime
from sqlalchemy.orm import Session

from ..models.customer import Customer


def normalize_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = "".join(ch for ch in phone if ch.isdigit())
    return digits or None


def get_or_create_customer(
    db: Session,
    *,
    shop_id: int,
    name: str | None,
    phone: str | None,
    ordered_at: datetime | None = None,
) -> Customer | None:
    clean_name = name.strip() if name else ""
    display_phone = phone.strip() if phone else None
    phone_normalized = normalize_phone(phone)
    if not clean_name and not phone_normalized:
        return None

    customer = None
    if clean_name and phone_normalized:
        # 이름 + 전화번호 조합으로 우선 매칭
        customer = (
            db.query(Customer)
            .filter(
                Customer.shop_id == shop_id,
                Customer.name == clean_name,
                Customer.phone_normalized == phone_normalized,
            )
            .first()
        )

    if not customer and not clean_name and phone_normalized:
        # 이름 없이 전화번호만 있을 때만 전화번호 단독 매칭
        customer = (
            db.query(Customer)
            .filter(Customer.shop_id == shop_id, Customer.phone_normalized == phone_normalized)
            .first()
        )

    if not customer and clean_name:
        customer = (
            db.query(Customer)
            .filter(Customer.shop_id == shop_id, Customer.name == clean_name, Customer.phone_normalized.is_(None))
            .first()
        )

    if customer:
        if clean_name and customer.name != clean_name:
            customer.name = clean_name
        if display_phone and customer.phone != display_phone:
            customer.phone = display_phone
        if phone_normalized and customer.phone_normalized != phone_normalized:
            customer.phone_normalized = phone_normalized
    else:
        customer = Customer(
            shop_id=shop_id,
            name=clean_name or phone_normalized or "Customer",
            phone=display_phone,
            phone_normalized=phone_normalized,
        )
        db.add(customer)
        db.flush()

    if ordered_at and (customer.last_order_at is None or ordered_at > customer.last_order_at):
        customer.last_order_at = ordered_at

    return customer
