import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request

from ..models.user import User
from ..schemas.order import ExtractRequest, ExtractResponse
from ..auth_utils import get_current_user
from ..rate_limit import limiter
from ..services.ai_extractor import extract_order

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/extract", response_model=ExtractResponse, response_model_by_alias=True)
@limiter.limit("30/hour")
def extract(
    request: Request,
    body: ExtractRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    try:
        data = extract_order(body.chat_text)
    except Exception:
        # 예외 원문에는 API 키·모델명 등이 섞일 수 있어 로그에만 남긴다
        logger.exception("AI 추출 실패 (shop_id=%s)", current_user.shop_id)
        raise HTTPException(
            status_code=422,
            detail="주문 정보를 추출하지 못했습니다. 채팅 내용을 확인해 주세요.",
        )

    return ExtractResponse(
        customer_name=data.get("customer_name"),
        pickup_date=data.get("pickup_date"),
        pickup_time=data.get("pickup_time"),
        cake_size=data.get("cake_size"),
        cake_flavor=data.get("cake_flavor"),
        lettering=data.get("lettering"),
        design_note=data.get("design_note"),
        price=data.get("price"),
        deposit=data.get("deposit"),
        confidence=float(data.get("confidence", 0.0)),
    )
