from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException

from ..models.user import User
from ..schemas.order import ExtractRequest, ExtractResponse
from ..auth_utils import get_current_user
from ..services.ai_extractor import extract_order

router = APIRouter()


@router.post("/extract", response_model=ExtractResponse, response_model_by_alias=True)
def extract(
    body: ExtractRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    try:
        data = extract_order(body.chat_text)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"AI 추출 실패: {e}")

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
