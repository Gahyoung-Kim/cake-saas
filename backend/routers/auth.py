from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.shop import Shop
from ..schemas.auth import RegisterRequest, LoginRequest, TokenResponse, MeResponse
from ..auth_utils import hash_password, verify_password, create_access_token, get_current_user
from ..rate_limit import limiter

router = APIRouter()

_alias = {"response_model_by_alias": True}


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, **_alias)
@limiter.limit("5/hour")
def register(request: Request, body: RegisterRequest, db: Annotated[Session, Depends(get_db)]):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")

    shop = Shop(name=body.shop_name)
    db.add(shop)
    db.flush()

    user = User(shop_id=shop.id, email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # 위 조회와 commit 사이에 같은 이메일이 먼저 들어온 경우
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")
    db.refresh(user)

    return TokenResponse(access_token=create_access_token({"sub": str(user.id)}))


@router.post("/login", response_model=TokenResponse, **_alias)
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    return TokenResponse(access_token=create_access_token({"sub": str(user.id)}))


@router.get("/me", response_model=MeResponse, **_alias)
def me(current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    shop = db.get(Shop, current_user.shop_id)
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        shop_id=current_user.shop_id,
        shop_name=shop.name if shop else None,
    )
