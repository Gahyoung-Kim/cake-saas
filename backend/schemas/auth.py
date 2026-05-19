from pydantic import EmailStr
from .base import CamelModel


class RegisterRequest(CamelModel):
    email: EmailStr
    password: str
    shop_name: str


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(CamelModel):
    id: int
    email: str
    shop_id: int | None
    shop_name: str | None
