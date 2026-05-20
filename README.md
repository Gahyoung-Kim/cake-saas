# caker — 수제케이크 예약 운영 SaaS

> 1인·소규모 수제케이크샵 오너를 위한 주문 운영 OS MVP.
> 카카오톡·인스타그램 채팅을 AI로 자동 파싱해 예약함 하나에 통합합니다.

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트엔드 | React 19 + TypeScript + Vite + Tailwind CSS v3 |
| 상태 관리 | Zustand + TanStack Query |
| 애니메이션 | Framer Motion |
| 백엔드 | Python 3.12 + FastAPI + SQLAlchemy |
| DB | MySQL 8.0 |
| 인증 | JWT (python-jose + passlib/bcrypt) |
| AI | OpenAI GPT-4o mini 기반 주문 추출 (Claude API는 필요 시 검토) |
| 패키지 | pnpm (프론트), pip (백엔드) |

---

## 로컬 개발 환경 실행

### 사전 준비

- Node.js 18+, pnpm 8+
- Python 3.12+
- MySQL 8.0 (로컬 설치 또는 Docker)

### 1. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 아래 값을 채웁니다:

```env
VITE_API_URL=http://localhost:8000
OPENAI_API_KEY=sk-실제키값
# 선택: Claude API 검토/전환 시 사용
ANTHROPIC_API_KEY=sk-ant-api03-실제키값
DATABASE_URL=mysql+pymysql://root:비밀번호@localhost:3306/cakesaas
SECRET_KEY=랜덤_32자_문자열
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 2. DB 생성

```sql
CREATE DATABASE cakesaas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 백엔드 실행

```bash
# 프로젝트 루트(cake-saas/)에서 실행
cd backend
python -m venv venv

# Windows (프로젝트 루트에서)
backend\venv\Scripts\pip install -r backend\requirements.txt
backend\venv\Scripts\alembic -c backend\alembic.ini upgrade head
backend\venv\Scripts\uvicorn backend.main:app --reload

# macOS / Linux (프로젝트 루트에서)
python -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
alembic -c backend/alembic.ini upgrade head
uvicorn backend.main:app --reload
```

> ⚠️ uvicorn은 반드시 프로젝트 루트(`cake-saas/`)에서 실행해야 합니다.  
> `backend/` 디렉터리 안에서 실행하면 패키지 경로 오류가 발생합니다.

서버: http://localhost:8000  
API 문서: http://localhost:8000/docs

### 4. 프론트엔드 실행

```bash
cd frontend
pnpm install
pnpm dev
```

앱: http://localhost:5173

---

## Docker Compose로 전체 실행

```bash
# .env 설정 후
docker compose up --build
```

- 프론트엔드: http://localhost:5173
- 백엔드: http://localhost:8000
- MySQL: localhost:3306

---

## 주요 기능

### 오너용 (인증 필요)

| 기능 | 경로 |
|------|------|
| 대시보드 (예약 목록·상태 관리) | `/` |
| AI 주문 추출 | `/extract` |
| 픽업 캘린더 | `/calendar` |
| 주문서 설정 (옵션 빌더 + 공개 URL) | `/order-form` |
| 매장 설정 | `/settings` |

### 고객용 (인증 불필요)

| 기능 | 경로 |
|------|------|
| 공개 주문서 | `/order/:slug` |

### 예약 상태 플로우

```
문의(inquiry) → 확정(confirmed) → 제작중(making) → 완료(done)
                                                  ↘ 취소(cancelled)
```

---

## API 테스트 (curl)

```bash
BASE=http://localhost:8000

# 회원가입
curl -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@caker.com","password":"pass1234","shopName":"소라의 디저트"}'

# 로그인
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@caker.com","password":"pass1234"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

# 현재 사용자 정보
curl $BASE/api/auth/me -H "Authorization: Bearer $TOKEN"

# 예약 목록 조회
curl "$BASE/api/orders" -H "Authorization: Bearer $TOKEN"

# AI 주문 추출 (현재 기본: OPENAI_API_KEY 설정 필요)
curl -X POST $BASE/api/extract \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chatText":"안녕하세요~ 다음주 토요일 오후 2시 딸기 생크림 6호 케이크 부탁드려요. 레터링은 Happy Birthday Sora로요!"}'

# 픽업 캘린더
curl "$BASE/api/calendar?year=2026&month=5" -H "Authorization: Bearer $TOKEN"

# 매장 설정 조회
curl $BASE/api/shop -H "Authorization: Bearer $TOKEN"

# 공개 주문서 조회 (SLUG는 /api/shop 응답의 slug 값)
curl $BASE/api/public/order/SLUG
```

---

## 프로젝트 구조

```
cake-saas/
├── frontend/
│   └── src/
│       ├── pages/          # 7개 페이지
│       ├── components/     # AppLayout, OrderCard, CalendarGrid 등
│       ├── store/          # authStore, orderStore (Zustand)
│       └── api/            # apiFetch, auth, orders
└── backend/
    ├── main.py
    ├── config.py           # 환경변수 (pydantic-settings)
    ├── auth_utils.py       # JWT + bcrypt
    ├── routers/            # auth, orders, extract, calendar, shop, public
    ├── models/             # SQLAlchemy ORM
    ├── schemas/            # Pydantic (CamelModel 기반 camelCase I/O)
    ├── services/
    │   └── ai_extractor.py # OpenAI GPT-4o mini 기반 주문 추출
    └── alembic/            # DB 마이그레이션
```

---

## 환경변수 목록

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VITE_API_URL` | 프론트엔드 → 백엔드 API URL | `http://localhost:8000` |
| `OPENAI_API_KEY` | 현재 기본 AI 주문 추출용 OpenAI API 키 | — |
| `ANTHROPIC_API_KEY` | Claude API 검토/전환 시 사용할 선택 키 | — |
| `DATABASE_URL` | MySQL 연결 URL | `mysql+pymysql://...` |
| `SECRET_KEY` | JWT 서명 시크릿 (32자 이상 랜덤) | — |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 토큰 유효 시간 (분) | `10080` (7일) |

---

## 라이선스

MIT
