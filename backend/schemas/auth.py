from pydantic import EmailStr, Field, field_validator
from .base import CamelModel

# bcrypt는 72바이트까지만 해시에 반영하므로 상한을 명시한다
PASSWORD_MIN = 8
PASSWORD_MAX = 72


class RegisterRequest(CamelModel):
    email: EmailStr = Field(max_length=100)
    password: str = Field(min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)
    shop_name: str = Field(min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: str) -> str:
        # 대소문자만 다른 계정이 따로 생기지 않도록 소문자로 통일
        return v.strip().lower()

    @field_validator("shop_name")
    @classmethod
    def _strip_shop_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("매장명을 입력해 주세요.")
        return v


class LoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(max_length=PASSWORD_MAX)

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(CamelModel):
    id: int
    email: str
    shop_id: int | None
    shop_name: str | None
