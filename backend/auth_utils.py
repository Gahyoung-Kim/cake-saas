from datetime import timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models.user import User
from .time_utils import utcnow_naive

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# bcrypt는 72바이트를 넘는 입력을 거부한다. 한글은 UTF-8에서 글자당 3바이트라
# 스키마의 72'자' 제한만으로는 초과할 수 있어, 해시/검증 양쪽에서 동일하게
# 잘라낸다. (기존 passlib도 같은 방식으로 잘랐으므로 기존 해시와 호환된다)
_BCRYPT_MAX_BYTES = 72


def _prepare(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prepare(password), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prepare(plain), hashed.encode())
    except ValueError:
        # 저장된 해시 형식이 깨진 경우 — 인증 실패로 처리한다
        return False


def create_access_token(data: dict) -> str:
    expire = utcnow_naive() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 올바르지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exc
        user_key = int(user_id)
    except (jwt.PyJWTError, TypeError, ValueError):
        raise credentials_exc

    user = db.get(User, user_key)
    if user is None:
        raise credentials_exc
    return user
