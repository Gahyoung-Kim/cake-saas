"""요청 빈도 제한.

로그인 무차별 대입, 공개 주문서·업로드 스팸을 막는다.
기본 저장소는 프로세스 메모리라 워커가 여러 개면 워커별로 카운트된다.
운영에서 워커를 늘릴 경우 RATE_LIMIT_STORAGE_URI에 redis://... 를 지정한다.
"""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from .config import settings


def _client_key(request: Request) -> str:
    """프록시 뒤에서도 실제 클라이언트를 식별한다.

    uvicorn을 --proxy-headers로 띄우면 request.client.host가 X-Forwarded-For의
    첫 항목으로 채워지므로 get_remote_address로 충분하다. 프록시를 신뢰할 수
    없는 환경에서 헤더를 직접 읽으면 위조로 제한을 우회할 수 있어 쓰지 않는다.
    """
    return get_remote_address(request) or "unknown"


limiter = Limiter(
    key_func=_client_key,
    storage_uri=settings.RATE_LIMIT_STORAGE_URI or None,
    enabled=settings.RATE_LIMIT_ENABLED,
)
