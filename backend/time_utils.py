"""서비스 기준 시각(KST) 헬퍼.

DB에는 naive UTC로 저장하지만, "오늘"처럼 사용자에게 보이는 날짜 경계는
반드시 KST 기준이어야 한다. 서버 로컬 시각(date.today())을 쓰면 UTC 서버에서
00~09시 사이에 하루 전 날짜로 계산된다.
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")


def now_kst() -> datetime:
    return datetime.now(KST)


def today_kst() -> date:
    return now_kst().date()


def utcnow_naive() -> datetime:
    """DB 저장용 naive UTC. datetime.utcnow()가 3.12에서 deprecated라 대체한다."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
