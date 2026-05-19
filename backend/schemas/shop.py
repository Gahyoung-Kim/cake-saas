from .base import CamelModel


class SizeOption(CamelModel):
    label: str
    price: int = 0


class FlavorOption(CamelModel):
    label: str


class ShopUpdate(CamelModel):
    name: str | None = None
    owner_name: str | None = None
    phone: str | None = None
    daily_limit: int | None = None
    size_options: list[SizeOption] | None = None
    flavor_options: list[FlavorOption] | None = None
    cancellation_policy: str | None = None


class ShopResponse(CamelModel):
    id: int
    name: str
    owner_name: str | None
    phone: str | None
    daily_limit: int
    slug: str | None
    size_options: list[SizeOption]
    flavor_options: list[FlavorOption]
    cancellation_policy: str | None


class PublicShopResponse(CamelModel):
    shop_name: str
    cancellation_policy: str | None
    size_options: list[SizeOption]
    flavor_options: list[FlavorOption]


class PublicOrderCreate(CamelModel):
    customer_name: str
    customer_phone: str | None = None
    pickup_date: str
    pickup_time: str | None = None
    cake_size: str | None = None
    cake_flavor: str | None = None
    lettering: str | None = None
    design_note: str | None = None
    design_image: str | None = None   # 업로드된 이미지 URL
