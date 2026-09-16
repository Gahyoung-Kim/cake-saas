import json
import re
from openai import OpenAI
from ..config import settings
from ..time_utils import today_kst

_SYSTEM_TEMPLATE = """\
다음 카카오톡/인스타그램/네이버 채팅 내용에서 케이크 주문 정보를 추출해줘.
없는 정보는 null로, 날짜는 YYYY-MM-DD 형식으로 반환해.
반드시 JSON만 반환하고 다른 텍스트는 절대 붙이지 마.

오늘 날짜: {today}

추출 필드:
- customer_name: 고객 이름
- pickup_date: 픽업 날짜 (YYYY-MM-DD). "오늘/내일/이번주 토요일/다음 주 토요일" 같은 상대 날짜는 오늘 기준으로 실제 날짜로 변환
- pickup_time: 픽업 시간 ("HH:MM" 24시간 형식). "오후 3시" → "15:00"
- cake_size: 케이크 크기 ("1호", "2호", "4호", "6호", "8호" 등)
- cake_flavor: 맛 (예: 딸기 생크림, 초콜릿 가나슈, 티라미수, 당근 케이크 등)
- lettering: 레터링 문구 (따옴표 안 문구 또는 명시된 레터링 내용)
- design_note: 디자인 요청사항 (알러지·장식·색상·특별 요청 등. 여러 항목은 줄바꿈으로 구분)
- price: 주문 금액 (숫자만. "오만원"→50000, "5만원"→50000, "55,000원"→55000)
- deposit: 예약금 (숫자만)
- confidence: 추출 신뢰도 (0.0~1.0. 정보가 명확할수록 높게. 모호하면 0.6 이하)
"""


def _build_system_prompt() -> str:
    return _SYSTEM_TEMPLATE.format(today=today_kst().isoformat())


def _parse_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw.strip())


def extract_order(chat_text: str) -> dict:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=1024,
        messages=[
            {"role": "system", "content": _build_system_prompt()},
            {"role": "user",   "content": chat_text},
        ],
    )
    return _parse_json(response.choices[0].message.content)
