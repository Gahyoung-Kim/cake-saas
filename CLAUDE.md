# 🎂 수제케이크 예약 SaaS — CLAUDE.md

## 프로젝트 개요
국내 1인·소규모 수제케이크샵 오너를 위한 주문 운영 OS MVP.
채팅 주문 누락 없이 예약함 하나로 통합하는 것이 핵심 목표.

## 기술 스택
- Frontend: React 19 + TypeScript + Vite + Zustand + TanStack Query + Tailwind CSS
- Backend: Python + FastAPI + SQLAlchemy + Alembic + MySQL
- Auth: JWT (python-jose, bcrypt)
- AI: OpenAI API (gpt-4o-mini) 기반 주문 추출
- Anthropic Claude API 키는 추후 전환 가능성을 위해 보관할 수 있음

- 날짜: dayjs + locale ko
- 알림: react-hot-toast
- 애니메이션: Framer Motion

## 패키지 매니저
- 프론트엔드: pnpm (npm, yarn 사용 금지)
- 백엔드: pip

## 폴더 구조
```
cake-saas/                        # = c:\kkh\cake_saas
├── CLAUDE.md
├── .env.example
├── docker-compose.yml
├── design/                       # 디자인 프로토타입 (참고용)
├── frontend/
│   └── src/
│       ├── pages/                # Dashboard, OrderExtract, Calendar, OrderForm, PublicOrderForm, Settings, Login
│       ├── components/           # OrderCard, StatusBadge, ChatPasteBox, CalendarGrid (100줄 이하)
│       ├── store/                # authStore.ts, orderStore.ts (Zustand)
│       └── api/                  # orders.ts, auth.ts
└── backend/
    ├── main.py
    ├── routers/                  # auth, orders, extract, calendar, public
    ├── models/                   # SQLAlchemy (user, shop, order, form_config)
    ├── schemas/                  # Pydantic 스키마 (models와 반드시 분리)
    └── services/                 # ai_extractor.py
```

## 코딩 규칙
- TypeScript strict mode (any 타입 사용 절대 금지)
- 컴포넌트 100줄 이하로 분리
- API 에러: TanStack Query onError + react-hot-toast
- 한국어 날짜: dayjs().locale('ko').format('MM월 DD일 (ddd)')
- 모바일 퍼스트 (375px 기준)
- Pydantic 스키마와 SQLAlchemy 모델 파일 분리
- Tailwind config: 디자인 토큰을 extend.colors / extend.fontFamily에 등록
- 폰트: Pretendard(한글 CDN) / Inter Tight(숫자 Google Fonts)
- 앱 Safe Area: tailwindcss-safe-area 플러그인으로 pb-safe 등 유틸 클래스 사용

## 디자인 시스템 (caker Design Handoff v0.1)
- 배경: #FFFDF5 / 서피스: #F5EDE8 / 서피스2: #FBF6F0
- Primary: #C8917A / Dark: #A0685A / Light: #F2C4B0 / Muted: #E8D5CC
- 텍스트: #3D2B24 / Sub: #8C6B62 / Muted: #B89E98
- 보더: #E8D5CC (0.5px) / Strong: #D7BFB4
- 폰트: --font-ko (Pretendard) / --font-num (Inter Tight)
- 반경: sm=4 md=8 lg=12 xl=16 2xl=24 full=9999 (px)
- 상태 뱃지: `bg-status-{상태}-bg text-status-{상태}-fg` 패턴
- 웹 사이드바: 220px / 앱 탭바: 80px / FAB: 56px
- 그림자: warm brown tint (rgba 61,43,36 기반)

## AI Workspace 문서 구조
- 이 문서(CLAUDE.md)와 [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)는 고정 규칙/철학 문서 (거의 안 바뀜)
- [GLOBAL.md](./GLOBAL.md): 현재 상태 (최근 작업 / 현재 스프린트 / 다음 우선순위) — 작업 종료 시 AUTO 영역 갱신
- [skills/](./skills/): 프로젝트에서 축적된 작업 노하우 (project / frontend / backend)
- Codex는 [AGENTS.md](./AGENTS.md)를 진입점으로 사용 (동일한 규칙을 가리킴)
- 작업 종료 시 컨벤션은 AGENTS.md 참고. `python3 scripts/validate_workspace.py`로 AUTO 마커 형식만 기계적으로 검증 (내용 자동 생성 아님)

## 예약 상태값 ENUM
inquiry → confirmed → making → done / cancelled

## AI 추출 엔드포인트
POST /api/extract  →  { chat_text } → 주문 정보 JSON + confidence
모델: gpt-4o-mini (기본)

## 절대 하지 말 것
- 한국어 날짜를 영어로 표시하지 말 것
- 환경변수를 코드에 하드코딩하지 말 것
- npm 또는 yarn 사용 금지 (반드시 pnpm)
- any 타입 사용 금지
- 기본 AI 추출은 OpenAI gpt-4o-mini 기준으로 작업
- 사용자가 별도로 요청하기 전까지 Claude API로 전환하지 않기
- Fabric.js 사용 금지 (Phase 2 캔버스는 Konva.js 예정)
