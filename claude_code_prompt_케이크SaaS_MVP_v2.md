# 🎂 수제케이크 예약 운영 SaaS — Claude Code 프롬프트 v2

---

## 📌 프로젝트 개요

> 국내 1인·소규모 수제케이크샵 오너를 위한 **주문 운영 OS** MVP를 구축한다.
> 핵심 포지션: 인스타그램·카카오톡·네이버 톡톡 등 비정형 채팅 상담에서 발생하는
> 주문 누락, 중복 예약, 상담 반복, 입금 관리 문제를 자동화하는 SaaS.
>
> 경쟁 제품 참고: 똑톡(채팅 예약 자동 정리), 케이크데이(마켓플레이스형)
> 차별화 방향: 멀티채널 AI 예약함 + 커스텀 주문서 빌더 + 제작 캘린더 통합

---

## 🛠 기술 스택

### Frontend
- React 19 + TypeScript + Vite
- Zustand (전역 상태관리)
- Framer Motion (애니메이션)
- React Router v6
- TanStack Query (서버 상태)
- Tailwind CSS
- dayjs + locale ko (한국어 날짜)
- react-hot-toast (알림)

### Backend
- Python + FastAPI + Uvicorn
- SQLAlchemy + Alembic (ORM + 마이그레이션)
- MySQL (DB)
- python-jose (JWT 인증)
- bcrypt (비밀번호 해싱)

### AI
- **Anthropic Claude API (claude-sonnet-4-20250514)** — 고정 사용
  → 채팅 텍스트 붙여넣기 → 주문 정보 자동 추출
  → OpenAI API 사용 안 함

### 패키지 매니저
- **프론트엔드: pnpm** (npm, yarn 사용 금지)
- 백엔드: pip

---

## 🎯 MVP 범위 (Phase 1)

> **"채팅 주문 누락 없이 예약함 하나로 통합한다"** 가 MVP의 단 하나의 목표.
> 화려한 기능보다 오너가 매일 쓰는 핵심 루프를 완성한다.

### 포함 기능
1. **AI 주문 추출** — 채팅 텍스트 붙여넣기 → 예약 정보 자동 파싱
2. **예약 관리 대시보드** — 예약 리스트, 상태 관리(문의/확정/제작중/완료/취소)
3. **픽업 캘린더** — 일자별 예약 현황, 일별 제작 가능량 슬롯
4. **커스텀 주문서 빌더** — 매장별 옵션 구성 (사이즈/맛/문구/디자인 레퍼런스 이미지)
5. **공개 주문서 URL** — `/order/:slug` 경로로 고객이 직접 접수
6. **예약금 상태 관리** — 입금 여부 수동 확인 + 상태 변경
7. **오너 인증** — 회원가입 / 로그인 / 매장 기본 정보 설정

### 제외 기능 (Phase 2 이후)
- 카카오 알림톡 자동 발송
- PG 결제 연동 (토스페이먼츠 등)
- 원가·마진 계산
- 재구매 CRM / 기념일 리마인드
- 인스타그램 DM 직접 연동
- 인터랙티브 케이크 디자인 캔버스 (**Konva.js** 채택 예정 — Phase 2)

---

## 📁 프로젝트 구조

```
cake-saas/
├── CLAUDE.md                   # Claude Code 프로젝트 규칙 (반드시 생성)
├── .env.example
├── docker-compose.yml
│
├── frontend/                   # React + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx       # 예약 대시보드 (메인)
│   │   │   ├── OrderExtract.tsx    # AI 주문 추출 페이지
│   │   │   ├── Calendar.tsx        # 픽업 캘린더
│   │   │   ├── OrderForm.tsx       # 커스텀 주문서 빌더 (오너용)
│   │   │   ├── PublicOrderForm.tsx # 공개 주문서 (고객용, JWT 불필요)
│   │   │   └── Settings.tsx        # 매장 설정
│   │   ├── components/
│   │   │   ├── OrderCard.tsx       # 예약 카드 컴포넌트
│   │   │   ├── StatusBadge.tsx     # 상태 뱃지
│   │   │   ├── ChatPasteBox.tsx    # 채팅 붙여넣기 입력창
│   │   │   └── CalendarGrid.tsx    # 캘린더 그리드
│   │   ├── store/
│   │   │   ├── orderStore.ts       # 예약 상태 (Zustand)
│   │   │   └── authStore.ts        # 인증 상태 (Zustand)
│   │   └── api/
│   │       ├── orders.ts
│   │       └── auth.ts
│
└── backend/                    # FastAPI
    ├── main.py
    ├── routers/
    │   ├── auth.py
    │   ├── orders.py
    │   ├── extract.py          # AI 주문 추출 엔드포인트
    │   ├── calendar.py
    │   └── public.py           # 공개 주문서 엔드포인트 (JWT 불필요)
    ├── models/
    │   ├── user.py
    │   ├── order.py
    │   ├── shop.py
    │   └── form_config.py      # 매장별 주문서 설정
    ├── schemas/                # Pydantic 스키마 (models와 분리)
    │   ├── auth.py
    │   ├── order.py
    │   └── shop.py
    └── services/
        └── ai_extractor.py     # LLM 파싱 서비스
```

---

## 🗄 데이터베이스 스키마

```sql
-- 매장 오너
CREATE TABLE shops (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,         -- 매장명
  owner_name  VARCHAR(50),
  phone       VARCHAR(20),
  daily_limit INT DEFAULT 5,                 -- 하루 최대 제작 가능 수량
  created_at  DATETIME DEFAULT NOW()
);

-- 예약 주문
CREATE TABLE orders (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  shop_id         INT NOT NULL,
  customer_name   VARCHAR(50),
  customer_phone  VARCHAR(20),
  pickup_date     DATE NOT NULL,
  pickup_time     VARCHAR(10),               -- "14:00"
  cake_size       VARCHAR(20),               -- "1호", "2호"
  cake_flavor     VARCHAR(50),               -- "바닐라", "초코"
  lettering       VARCHAR(200),              -- 레터링 문구
  design_note     TEXT,                      -- 디자인 요청사항
  design_image    VARCHAR(500),              -- 이미지 URL
  price           INT DEFAULT 0,             -- 주문 금액
  deposit         INT DEFAULT 0,             -- 예약금
  deposit_paid    BOOLEAN DEFAULT FALSE,     -- 입금 여부
  status          ENUM('inquiry','confirmed','making','done','cancelled') DEFAULT 'inquiry',
  raw_chat        TEXT,                      -- 원본 채팅 텍스트 (AI 추출 원본)
  memo            TEXT,
  created_at      DATETIME DEFAULT NOW(),
  updated_at      DATETIME DEFAULT NOW() ON UPDATE NOW()
);

-- 사용자 인증
CREATE TABLE users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  shop_id       INT,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  created_at    DATETIME DEFAULT NOW()
);

-- 매장별 커스텀 주문서 설정 (v1에서 추가)
CREATE TABLE form_configs (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  shop_id             INT NOT NULL UNIQUE,
  size_options        JSON,         -- [{"label":"1호","price":35000}, ...]
  flavor_options      JSON,         -- [{"label":"바닐라"}, ...]
  cancellation_policy TEXT,         -- 취소/환불 규정 안내문
  slug                VARCHAR(100) UNIQUE,  -- 공개 URL용 식별자 (예: my-cake-shop)
  updated_at          DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (shop_id) REFERENCES shops(id)
);
```

---

## 🤖 AI 주문 추출 스펙

### 엔드포인트
```
POST /api/extract
Body: { "chat_text": "안녕하세요~ 6월 15일 토요일 오후 2시 픽업으로..." }
Response: {
  "customer_name": "김지수",
  "pickup_date": "2026-06-15",
  "pickup_time": "14:00",
  "cake_size": "2호",
  "cake_flavor": "바닐라",
  "lettering": "지수야 생일 축하해",
  "design_note": "핑크 계열, 꽃 장식",
  "price": 55000,
  "deposit": 20000,
  "confidence": 0.92
}
```

### LLM 프롬프트 (ai_extractor.py)
```python
SYSTEM_PROMPT = """
다음 카카오톡/인스타그램 채팅 내용에서 케이크 주문 정보를 추출해줘.
없는 정보는 null로, 날짜는 YYYY-MM-DD 형식으로 반환해.
반드시 JSON만 반환하고 다른 텍스트는 절대 붙이지 마.

추출 필드:
- customer_name: 고객 이름
- pickup_date: 픽업 날짜 (YYYY-MM-DD). 오늘/내일/이번주 토요일 같은 상대 날짜는 실제 날짜로 변환
- pickup_time: 픽업 시간 ("HH:MM")
- cake_size: 케이크 크기 ("1호", "2호" 등)
- cake_flavor: 맛
- lettering: 레터링 문구
- design_note: 디자인 요청사항
- price: 금액 (숫자만, 오만원→50000)
- deposit: 예약금 (숫자만)
- confidence: 추출 신뢰도 (0.0~1.0)
"""

# Anthropic Claude API 사용 (고정)
# model: claude-sonnet-4-20250514
# max_tokens: 1000
```

---

## 🎨 디자인 시스템 — caker Design Handoff v0.1

> Claude Design에서 생성된 실제 토큰. 아래 내용을 그대로 코드에 반영한다.
> 브랜드명: **caker** · 라이트 모드 기준 · Tailwind v3.x

### 브랜드 방향
- 크림 + 핑크브라운 톤 — 따뜻하고 세련된 케이크샵 감성
- 운영 툴이지만 매일 열고 싶은 비주얼
- 웹(1280px) + 앱(375px·iPhone 14) 동시 지원

### CSS 변수 전체 (`globals.css` 또는 `@layer base { :root {} }` 에 붙여넣기)

```css
:root {
  /* ── Colors ── */
  --color-bg:             #FFFDF5;
  --color-surface:        #F5EDE8;
  --color-surface-2:      #FBF6F0;

  --color-primary:        #C8917A;
  --color-primary-dark:   #A0685A;
  --color-primary-light:  #F2C4B0;
  --color-muted:          #E8D5CC;

  --color-text:           #3D2B24;
  --color-text-sub:       #8C6B62;
  --color-text-muted:     #B89E98;

  --color-border:         #E8D5CC;
  --color-border-strong:  #D7BFB4;

  --color-success:        #7CAE8A;
  --color-warning:        #D4A850;
  --color-danger:         #C4706A;

  /* Status tonal pairs (bg / fg) */
  --status-inquiry-bg:    #FAEFD5;   --status-inquiry-fg:    #8A6A1F;
  --status-confirmed-bg:  #DFEFE3;   --status-confirmed-fg:  #3F7A52;
  --status-making-bg:     #DDE6F1;   --status-making-fg:     #46668C;
  --status-done-bg:       #E8E2DE;   --status-done-fg:       #8C6B62;
  --status-cancel-bg:     #F2DDDB;   --status-cancel-fg:     #9F4A44;

  /* ── Typography ── */
  --font-ko:   "SUITE Variable", "SUITE", "Pretendard Variable", "Pretendard",
               -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
               "Noto Sans KR", system-ui, sans-serif;
  --font-num:  "Paperlogy", "Inter Tight", "Pretendard Variable", "Pretendard",
               ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --text-h1: 24px;  --text-h2: 20px;  --text-h3: 16px;
  --text-body: 14px;  --text-caption: 12px;
  --weight-regular: 400;  --weight-medium: 500;  --weight-semibold: 600;
  --leading-base: 1.6;

  /* ── Spacing (4px scale) ── */
  --spacing-1: 4px;   --spacing-2: 8px;   --spacing-3: 12px;
  --spacing-4: 16px;  --spacing-5: 24px;  --spacing-6: 32px;
  --spacing-7: 48px;  --spacing-8: 64px;

  /* ── Border Radius ── */
  --border-radius-sm:   4px;
  --border-radius-md:   8px;
  --border-radius-lg:   12px;
  --border-radius-xl:   16px;
  --border-radius-2xl:  24px;
  --border-radius-full: 9999px;

  /* ── Shadows (warm brown tint) ── */
  --shadow-sm: 0 1px 2px rgba(61,43,36,.04), 0 1px 1px rgba(61,43,36,.03);
  --shadow-md: 0 4px 12px rgba(61,43,36,.06), 0 1px 3px rgba(61,43,36,.04);
  --shadow-lg: 0 20px 40px rgba(61,43,36,.08), 0 4px 12px rgba(61,43,36,.04);

  /* ── Motion ── */
  --ease:     cubic-bezier(0.22, 0.61, 0.36, 1);
  --dur-fast: 120ms;
  --dur:      200ms;
  --dur-slow: 320ms;
}
```

### `tailwind.config.ts` 전체

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        bg:          'var(--color-bg)',
        surface:     'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark:    'var(--color-primary-dark)',
          light:   'var(--color-primary-light)',
        },
        muted:  'var(--color-muted)',
        ink: {
          DEFAULT: 'var(--color-text)',
          sub:     'var(--color-text-sub)',
          muted:   'var(--color-text-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger:  'var(--color-danger)',
        status: {
          'inquiry-bg':   'var(--status-inquiry-bg)',
          'inquiry-fg':   'var(--status-inquiry-fg)',
          'confirmed-bg': 'var(--status-confirmed-bg)',
          'confirmed-fg': 'var(--status-confirmed-fg)',
          'making-bg':    'var(--status-making-bg)',
          'making-fg':    'var(--status-making-fg)',
          'done-bg':      'var(--status-done-bg)',
          'done-fg':      'var(--status-done-fg)',
          'cancel-bg':    'var(--status-cancel-bg)',
          'cancel-fg':    'var(--status-cancel-fg)',
        },
      },
      fontFamily: {
        ko:   ['var(--font-ko)'],
        num:  ['var(--font-num)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        h1:      ['24px', { lineHeight: '1.6', fontWeight: '600' }],
        h2:      ['20px', { lineHeight: '1.6', fontWeight: '500' }],
        h3:      ['16px', { lineHeight: '1.6', fontWeight: '500' }],
        body:    ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.6', fontWeight: '400' }],
      },
      spacing: {
        1: '4px',  2: '8px',  3: '12px', 4: '16px',
        5: '24px', 6: '32px', 7: '48px', 8: '64px',
      },
      borderRadius: {
        sm: '4px', md: '8px', lg: '12px',
        xl: '16px', '2xl': '24px', full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(61,43,36,.04), 0 1px 1px rgba(61,43,36,.03)',
        md: '0 4px 12px rgba(61,43,36,.06), 0 1px 3px rgba(61,43,36,.04)',
        lg: '0 20px 40px rgba(61,43,36,.08), 0 4px 12px rgba(61,43,36,.04)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
      screens: {
        sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
      },
    },
  },
};
export default config;
```

### 폰트 로딩 (index.html `<head>`)

```html
<!-- 한글: Pretendard (SUITE 폴백) -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />
<!-- 영문/숫자: Inter Tight (Paperlogy 폴백) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap" />
```

> SUITE / Paperlogy 자체 호스팅 시 위 링크를 내부 webfont CSS로 교체하면 `--font-ko`, `--font-num` 변수가 그대로 동작한다.

### 컴포넌트 Tailwind 클래스 매핑

**Button 공통**
```html
class="inline-flex items-center justify-center gap-[6px] rounded-md font-medium
       font-ko whitespace-nowrap border border-transparent
       transition-[background,color,border-color,box-shadow] duration-200 ease-out
       active:translate-y-px focus-visible:outline-2 focus-visible:outline-primary-light
       focus-visible:outline-offset-2 disabled:opacity-45 disabled:cursor-not-allowed"
```

| Variant   | Size | 추가 클래스 |
|-----------|------|------------|
| Primary   | sm   | `h-7 px-3 text-[12px] rounded-[6px] bg-primary text-bg hover:bg-primary-dark` |
| Primary   | md   | `h-9 px-4 text-[13px] bg-primary text-bg hover:bg-primary-dark` |
| Primary   | lg   | `h-11 px-5 text-[14px] rounded-[10px] bg-primary text-bg hover:bg-primary-dark` |
| Secondary | md   | `h-9 px-4 text-[13px] bg-bg text-ink border-border-strong hover:border-primary hover:text-primary-dark` |
| Ghost     | md   | `h-9 px-4 text-[13px] bg-transparent text-ink-sub hover:bg-muted hover:text-ink` |
| Danger    | md   | `h-9 px-4 text-[13px] bg-danger text-bg hover:brightness-95` |

**Badge (상태 뱃지)**
```html
<span class="inline-flex items-center gap-[6px] h-6 px-[10px] rounded-full
             text-[12px] font-medium leading-none
             bg-status-confirmed-bg text-status-confirmed-fg">
  <span class="w-[6px] h-[6px] rounded-full bg-current opacity-70"></span>
  확정
</span>
```

**예약 카드**
```html
<article class="bg-bg border-[0.5px] border-border rounded-lg p-5
                flex flex-col gap-[14px]
                hover:shadow-md hover:border-border-strong
                transition-[box-shadow,border-color] duration-200">
```

**통계 카드**
```html
<div class="bg-bg border-[0.5px] border-border rounded-lg p-5
            flex flex-col gap-[10px] min-h-[130px]">
  <div class="text-[12px] text-ink-sub font-medium">오늘 픽업</div>
  <div class="text-[28px] font-semibold tracking-[-0.01em] font-num tabular-nums
              flex items-baseline gap-1">
    3<span class="text-[13px] font-medium text-ink-sub font-ko">건</span>
  </div>
</div>
```

**Input**
```html
<input class="bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px]
              text-[13px] text-ink outline-none
              transition-[border-color,box-shadow] duration-200
              placeholder:text-ink-muted hover:border-border-strong
              focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)]" />
<!-- Error → border-danger focus:shadow-[0_0_0_3px_rgba(196,112,106,0.14)] -->
```

### 상태별 컬러 매핑

| 상태   | Background | Foreground | Tailwind |
|--------|-----------|-----------|---------|
| 문의   | `#FAEFD5` | `#8A6A1F` | `bg-status-inquiry-bg text-status-inquiry-fg` |
| 확정   | `#DFEFE3` | `#3F7A52` | `bg-status-confirmed-bg text-status-confirmed-fg` |
| 제작중 | `#DDE6F1` | `#46668C` | `bg-status-making-bg text-status-making-fg` |
| 완료   | `#E8E2DE` | `#8C6B62` | `bg-status-done-bg text-status-done-fg` |
| 취소   | `#F2DDDB` | `#9F4A44` | `bg-status-cancel-bg text-status-cancel-fg` |

### 웹 레이아웃 치수

```ts
export const WEB = {
  sidebarWidth: 220,       // px (접힘 시 64px)
  pageMaxWidth: 1280,
  pagePaddingX: 40,
  sectionGap:   32,
  cardGap:      16,
  inputHeight:  38,
  buttonMd:     36,
  buttonLg:     44,
  badgeHeight:  24,
  borderWidth:  0.5,
  cardRadius:   12,        // --border-radius-lg
  // 예약 테이블 grid-template-columns
  reservationCols: '96px 1.1fr 1.8fr 140px 120px 36px',
};

/* CSS Grid 예시 */
/* .rsv-row { display:grid; grid-template-columns:96px minmax(0,1.1fr) minmax(0,1.8fr) 140px 120px 36px; gap:16px; } */
/* .summary  { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; } */
```

**반응형 레이아웃 규칙**
```html
<!-- 사이드바: 모바일 숨김 → xl 이상 노출 -->
<aside class="hidden xl:flex w-[220px] shrink-0">…</aside>

<!-- 요약 카드: 모바일 2열 → 데스크탑 3-4열 -->
<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">…</div>

<!-- 예약 테이블: md 미만은 카드 스택 -->
<div class="hidden md:grid grid-cols-[96px_1.1fr_1.8fr_140px_120px_36px] gap-4">…</div>
<div class="md:hidden flex flex-col gap-[10px]">…</div>
```

### 앱 레이아웃 치수 (iPhone 14 · 375×812)

```ts
export const APP = {
  screenWidth:      375,
  screenHeight:     812,
  safeAreaTop:      47,    // 다이내믹 아일랜드 + 상태바
  safeAreaBottom:   34,    // 홈 인디케이터
  tabbarHeight:     80,    // 콘텐츠 46 + safe 34
  topnavHeight:     44,
  minTouchTarget:   44,
  contentPaddingX:  20,
  cardPadding:      14,
  cardGap:          10,
  cardRadius:       14,
  fabSize:          56,
  fabBottomOffset:  100,   // tabbar(80) + 20 여유
  fabRightOffset:   16,
  sheetRadius:      24,    // 슬라이드업 패널 상단
  sheetMaxHeight:   '56%',
};
```

**앱 CSS 골격**
```css
.m-screen {
  width:375px; height:812px;
  padding-top:47px;
  display:flex; flex-direction:column; overflow:hidden;
}
.m-tabbar {
  position:absolute; left:0; right:0; bottom:0;
  height:80px; padding-bottom:34px;
  display:grid; grid-template-columns:repeat(5,1fr);
}
```

**앱 폰트 크기 하한**

| 위치 | 최소 | 권장 |
|------|------|------|
| Caption / 시간 | 11px | 12px |
| 메타 / 옵션 칩 | 12px | 12–13px |
| 본문 / 입력값 | 13px | 14px |
| 카드 제목 | 14px | 14–15px |
| 페이지 타이틀 | 17px | 18–22px |

### 모션 가이드

```css
transition: background var(--dur) var(--ease),
            color var(--dur) var(--ease),
            border-color var(--dur) var(--ease);

@keyframes fadeIn {
  from { opacity:0; transform:translateY(6px); }
  to   { opacity:1; transform:translateY(0); }
}
/* duration: fast=120ms  standard=200ms  slow=320ms */
```

---

## 📱 페이지별 상세 스펙

### 1. 대시보드 (Dashboard.tsx)
- 상단: 오늘 예약 수 / 이번 주 예약 수 / 미입금 건수 요약 카드
- 중단: 예약 리스트 (상태 필터 탭: 전체/문의/확정/제작중/완료)
- 각 예약 카드: 픽업일, 고객명, 케이크 옵션 요약, 입금상태 뱃지, 상태 드롭다운
- 우측 하단 FAB: "+ AI로 주문 추출하기" 버튼
- 하단 네비게이션 바: 대시보드/캘린더/주문서/설정 (모바일)

### 2. AI 주문 추출 (OrderExtract.tsx)
- 좌측: 채팅 텍스트 붙여넣기 textarea (큰 입력창)
- 버튼: "주문 정보 추출하기"
- 우측: 추출된 정보 폼 (수정 가능한 input 필드들)
- 하단 버튼: "예약으로 저장"
- confidence < 0.7이면 노란색 경고 표시

### 3. 픽업 캘린더 (Calendar.tsx)
- 월간 캘린더 뷰 (dayjs locale ko)
- 날짜 셀에 해당 날짜 예약 건수 표시
- 날짜 클릭 → 해당 날짜 예약 리스트 슬라이드 패널 (Framer Motion)
- 일별 제작 한도 초과 시 날짜 셀 빨간색 표시
- 이전달/다음달 네비게이션

### 4. 커스텀 주문서 빌더 (OrderForm.tsx) — 오너용
- 사이즈 옵션 추가/삭제 (예: 1호 35,000원 / 2호 45,000원)
- 맛 옵션 추가/삭제
- 기본 안내문 설정 (취소 규정 등)
- 공개 주문서 URL 생성: `{origin}/order/{slug}`
- 복사 버튼 (navigator.clipboard)
- 저장 성공 시 react-hot-toast 알림

### 5. 공개 주문서 (PublicOrderForm.tsx) — 고객용, JWT 불필요
- 오너가 설정한 옵션으로 동적 렌더링
- 픽업날짜 달력 선택 (한도 초과 날짜 비활성화)
- 제출 → POST /api/public/order/:slug → inquiry 상태로 저장

---

## ⚙️ API 엔드포인트 목록

```
# 인증
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

# 예약 관리 (JWT 필요)
GET    /api/orders              ?date=&status=&page=&per_page=20
POST   /api/orders
GET    /api/orders/{id}
PUT    /api/orders/{id}
PATCH  /api/orders/{id}/status  body: { "status": "confirmed" }
PATCH  /api/orders/{id}/deposit body: { "deposit_paid": true }
DELETE /api/orders/{id}

# AI 추출 (JWT 필요)
POST   /api/extract             body: { "chat_text": "..." }

# 캘린더 (JWT 필요)
GET    /api/calendar            ?year=&month=   → [{ date, count, is_over_limit }]

# 매장 설정 (JWT 필요)
GET    /api/shop
PUT    /api/shop

# 공개 주문서 (JWT 불필요)
GET    /api/public/order/:slug  → 매장 옵션 정보 반환
POST   /api/public/order/:slug  → 고객 주문 접수
```

---

## 📝 CLAUDE.md 템플릿 (프로젝트 루트에 반드시 생성)

> Claude Code 첫 세션에서 아래 내용으로 `CLAUDE.md` 파일을 먼저 만들어야 한다.
> 이 파일이 있어야 세션이 바뀌어도 프로젝트 컨텍스트가 유지된다.

```markdown
# 🎂 수제케이크 예약 SaaS — CLAUDE.md

## 프로젝트 개요
국내 1인·소규모 수제케이크샵 오너를 위한 주문 운영 OS MVP.
채팅 주문 누락 없이 예약함 하나로 통합하는 것이 핵심 목표.

## 기술 스택
- Frontend: React 19 + TypeScript + Vite + Zustand + TanStack Query + Tailwind CSS
- Backend: Python + FastAPI + SQLAlchemy + Alembic + MySQL
- Auth: JWT (python-jose, bcrypt)
- AI: Anthropic Claude API (claude-sonnet-4-20250514) — OpenAI 사용 안 함
- 날짜: dayjs + locale ko
- 알림: react-hot-toast

## 패키지 매니저
- 프론트엔드: pnpm (npm, yarn 사용 금지)
- 백엔드: pip

## 폴더 구조
cake-saas/
├── frontend/src/pages/       # 페이지 컴포넌트
├── frontend/src/components/  # 재사용 컴포넌트 (100줄 이하)
├── frontend/src/store/       # Zustand 스토어
├── frontend/src/api/         # API 클라이언트
└── backend/
    ├── routers/    # auth, orders, extract, calendar, public
    ├── models/     # SQLAlchemy 모델
    ├── schemas/    # Pydantic 스키마 (models와 반드시 분리)
    └── services/   # ai_extractor.py

## 코딩 규칙
- TypeScript strict mode (any 타입 사용 절대 금지)
- 컴포넌트 100줄 이하로 분리
- API 에러: TanStack Query onError + react-hot-toast
- 한국어 날짜: dayjs().locale('ko').format('MM월 DD일 (ddd)')
- 모바일 퍼스트 (375px 기준)
- Pydantic 스키마와 SQLAlchemy 모델 파일 분리
- Tailwind config: 디자인 토큰을 extend.colors / extend.fontFamily에 등록
- SUITE 폰트: Google Fonts API 로드 (index.html link 태그)
- Paperlogy 폰트: public/fonts/ 로컬 파일 @font-face 로드
- 앱 Safe Area: tailwindcss-safe-area 플러그인으로 pb-safe 등 유틸 클래스 사용

## 디자인 시스템 (caker Design Handoff v0.1 기준)
- 배경: #FFFDF5 / 서피스: #F5EDE8 / 서피스2: #FBF6F0
- Primary: #C8917A / Dark: #A0685A / Light: #F2C4B0 / Muted: #E8D5CC
- 텍스트: #3D2B24 / Sub: #8C6B62 / Muted: #B89E98
- 보더: #E8D5CC (0.5px) / Strong: #D7BFB4
- 폰트: --font-ko (SUITE→Pretendard 폴백) / --font-num (Paperlogy→Inter Tight 폴백)
- 반경: sm=4 md=8 lg=12 xl=16 2xl=24 full=9999 (px)
- 상태 뱃지: Tailwind class `bg-status-{상태}-bg text-status-{상태}-fg` 패턴
- 웹 사이드바: 220px / 앱 탭바: 80px (safe area 34px 포함) / FAB: 56px
- Tailwind config: extend.colors에 ink/surface/primary/status/border 등록 완료
- 그림자: warm brown tint (rgba 61,43,36 기반)

## 예약 상태값 ENUM
inquiry → confirmed → making → done / cancelled

## 절대 하지 말 것
- 한국어 날짜를 영어로 표시하지 말 것
- 환경변수를 코드에 하드코딩하지 말 것
- npm 또는 yarn 사용 금지 (반드시 pnpm)
- any 타입 사용 금지
- OpenAI API 사용 금지 (Anthropic API만 사용)
- Fabric.js 사용 금지 (Phase 2 캔버스는 Konva.js 예정)
```

---

## 🚀 Claude Code 단계별 프롬프트

> 각 단계를 순서대로 Claude Code에 붙여넣어 실행한다.
> 각 단계 시작 전 **Shift+Tab 두 번** → Plan Mode로 계획 먼저 확인 후 실행 권장.
> 세션이 길어지면 `/compact` 실행.

---

### Step 0 — 프로젝트 초기화 (첫 번째로 실행)

> **전제 조건**: Claude Design에서 디자인 시스템을 완성하고 CSS 토큰을 추출한 뒤 이 MD 파일의 디자인 시스템 섹션을 업데이트한 상태에서 실행.

```
나는 수제케이크 예약 운영 SaaS MVP를 만들려고 해.
이 MD 파일의 스펙대로 프로젝트를 초기화해줘.

해야 할 일:
1. cake-saas/ 폴더 생성
2. 이 MD 파일의 CLAUDE.md 템플릿 내용으로 cake-saas/CLAUDE.md 파일 먼저 생성
3. frontend/ — pnpm으로 Vite React TS 프로젝트 초기화, 필요한 패키지 모두 설치
   (react-router-dom, zustand, @tanstack/react-query, tailwindcss, framer-motion,
    dayjs, react-hot-toast, tailwindcss-safe-area)
4. tailwind.config.ts — 이 MD 파일의 디자인 시스템 CSS 변수를 extend.colors, extend.fontFamily에 등록
5. index.css — :root CSS 변수 블록 전체 + SUITE(Google Fonts link), Paperlogy(@font-face) 폰트 로드
6. backend/ — FastAPI 기본 구조 생성, requirements.txt 작성 후 설치
7. backend/models/ — user.py, shop.py, order.py, form_config.py SQLAlchemy 모델 작성
8. backend/schemas/ — 각 모델에 대응하는 Pydantic 스키마 작성 (models와 분리)
9. Alembic 초기화 + 마이그레이션 파일 생성 (위 DB 스키마 기준)
10. .env.example 생성 (VITE_API_URL, ANTHROPIC_API_KEY, DATABASE_URL, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES)
11. docker-compose.yml — frontend(Vite), backend(FastAPI), mysql(8.0) 3개 서비스

완료되면 실행 방법을 알려줘.
```

---

### Step 1 — JWT 인증 구현

```
backend/routers/auth.py 와 관련 파일들을 작성해줘.

구현 내용:
1. POST /api/auth/register — 회원가입 (email, password, shop_name)
   → shops + users 동시 생성
2. POST /api/auth/login — 로그인 → JWT access token 반환
3. GET /api/auth/me — 현재 로그인 사용자 + 매장 정보
4. get_current_user Depends 함수 (다른 라우터에서 재사용)
5. 비밀번호 bcrypt 해싱 (python-jose + passlib)

주의사항:
- SQLAlchemy 세션 Depends 패턴 사용
- Pydantic 스키마는 schemas/ 에 분리
- 에러는 HTTPException으로 처리
- 테스트용 curl 명령어 3개도 같이 알려줘
```

---

### Step 2 — AI 주문 추출 엔드포인트

```
backend/services/ai_extractor.py 와 backend/routers/extract.py 를 작성해줘.

엔드포인트: POST /api/extract (JWT 필요)
Body: { "chat_text": "카카오톡/인스타 채팅 텍스트" }

반환 JSON:
{
  "customer_name": "김지수",
  "pickup_date": "2026-06-15",
  "pickup_time": "14:00",
  "cake_size": "2호",
  "cake_flavor": "바닐라",
  "lettering": "지수야 생일 축하해",
  "design_note": "핑크 계열 꽃 장식",
  "price": 55000,
  "deposit": 20000,
  "confidence": 0.92
}

AI 구현:
- Anthropic Claude API 사용 (claude-sonnet-4-20250514) — OpenAI 사용 안 함
- 반드시 JSON만 반환하도록 시스템 프롬프트 작성
- 없는 필드는 null, 날짜는 YYYY-MM-DD, 시간은 HH:MM
- confidence 0.0~1.0 (추출 신뢰도)

한국어 특수 처리 (시스템 프롬프트에 포함):
- "오늘/내일/이번주 토요일" 같은 상대 날짜 → 실제 날짜로 변환 (현재 날짜 컨텍스트 포함)
- "1호/2호" 케이크 호수 파싱
- "오만원/5만원/55,000원" 금액 표현 → 숫자로 변환
- 에러 시 422 Unprocessable Entity
```

---

### Step 3 — 예약 CRUD API + 대시보드 UI

```
# 백엔드: backend/routers/orders.py 작성 (JWT 인증 필요)

아래 엔드포인트 모두 구현:
GET    /api/orders              ?date=&status=&page=&per_page=20
POST   /api/orders
GET    /api/orders/{id}
PUT    /api/orders/{id}
PATCH  /api/orders/{id}/status  body: { "status": "confirmed" }
PATCH  /api/orders/{id}/deposit body: { "deposit_paid": true }
DELETE /api/orders/{id}

상태값: inquiry | confirmed | making | done | cancelled
shop_id는 JWT에서 자동으로 가져올 것 (query param 아님)

# 프론트엔드: Dashboard.tsx + OrderCard.tsx + StatusBadge.tsx

UI 구현:
1. 상단 요약 카드 3개: 오늘 예약 수 / 이번 주 예약 수 / 미입금 건수
2. 상태 필터 탭 (전체/문의/확정/제작중/완료)
3. OrderCard.tsx: 픽업일(한국어)/고객명/케이크 옵션/입금상태/상태 드롭다운
4. 우측 하단 FAB: "+ AI로 주문 추출하기" → /extract 페이지 이동
5. 하단 네비게이션 바 (모바일): 대시보드/캘린더/주문서/설정
6. TanStack Query로 데이터 페칭 + 낙관적 업데이트
7. 로딩: 스켈레톤 UI / 에러: react-hot-toast / 빈 상태: 안내 문구

디자인: --color-primary #2D5A3D, 배경 #FFFDF5, 폰트 SUITE, 모바일 우선(375px)
```

---

### Step 4 — AI 주문 추출 UI

```
frontend/src/pages/OrderExtract.tsx 와 ChatPasteBox.tsx 를 작성해줘.

UI 구현:
1. 상단: 뒤로가기 버튼
2. 좌측(데스크탑)/상단(모바일): ChatPasteBox 큰 textarea
   - placeholder: "카카오톡, 인스타그램 DM 채팅 내용을 여기에 붙여넣으세요"
3. "주문 정보 추출하기" 버튼 → POST /api/extract 호출
4. 추출 결과 폼 (수정 가능한 input 필드):
   - 고객명 / 연락처 / 픽업날짜(date picker) / 픽업시간
   - 케이크 사이즈 / 맛 / 레터링 문구 / 디자인 요청사항
   - 주문금액 / 예약금
5. confidence < 0.7이면 노란색 배너 경고 표시
6. "예약으로 저장" 버튼 → POST /api/orders → 대시보드로 이동
7. 로딩 중 버튼 비활성화 + 스피너
```

---

### Step 5 — 픽업 캘린더

```
# 백엔드: backend/routers/calendar.py

GET /api/calendar?year=2026&month=6
→ [{ "date": "2026-06-15", "count": 3, "is_over_limit": false }, ...]
- shops.daily_limit과 비교해서 is_over_limit 계산
- 해당 월의 모든 날짜 반환 (count 0인 날도 포함)

# 프론트엔드: frontend/src/pages/Calendar.tsx + CalendarGrid.tsx

UI 구현:
1. 월간 캘린더 그리드 (CalendarGrid.tsx)
   - 한국어 요일 표시 (일월화수목금토)
   - 날짜 셀에 예약 건수 뱃지
   - is_over_limit=true → 빨간색 배경
   - 오늘 날짜 강조
2. 날짜 클릭 → 해당 날짜 예약 리스트 슬라이드 패널
   - Framer Motion으로 오른쪽에서 슬라이드 인
   - 패널 안에 OrderCard 리스트
3. 이전달/다음달 버튼 네비게이션
4. 헤더: "2026년 6월" 형식 (dayjs locale ko)
```

---

### Step 6 — 커스텀 주문서 빌더 + 공개 주문서

```
# 백엔드: backend/routers/public.py + GET/PUT /api/shop

GET /api/shop        → 매장 설정 + form_config 반환 (JWT 필요)
PUT /api/shop        → 매장 설정 + form_config 업데이트 (JWT 필요)

GET /api/public/order/:slug   → 매장 옵션 정보 반환 (JWT 불필요)
POST /api/public/order/:slug  → 고객 주문 접수 → inquiry 상태로 저장 (JWT 불필요)

# 프론트엔드 1: OrderForm.tsx (오너용 빌더, JWT 필요)

UI 구현:
1. 사이즈 옵션 CRUD (라벨 + 가격, 추가/삭제)
2. 맛 옵션 CRUD (라벨만, 추가/삭제)
3. 기본 안내문 textarea (취소 규정 등)
4. 공개 URL 표시: window.location.origin + "/order/" + shop.slug
5. URL 복사 버튼 (navigator.clipboard)
6. 저장 성공 시 react-hot-toast 알림

# 프론트엔드 2: PublicOrderForm.tsx (고객용, JWT 불필요)

UI 구현:
1. 매장명 + 안내문 헤더
2. 오너가 설정한 옵션으로 동적 렌더링 (사이즈/맛 라디오 버튼)
3. 픽업날짜 선택 (한도 초과 날짜 비활성화)
4. 픽업시간 선택
5. 레터링 문구 입력
6. 디자인 요청사항 textarea
7. 고객 이름 + 연락처
8. 제출 버튼 → 성공 시 완료 메시지 페이지
```

---

### Step 7 — 마무리 + 배포

```
마무리 작업을 해줘.

1. 모바일 반응형 점검
   - 모든 페이지를 375px 기준으로 점검하고 수정
   - 하단 네비게이션 바가 모든 페이지에서 정상 동작하는지 확인

2. 빈 상태 / 에러 상태 처리
   - 예약 없을 때: "아직 예약이 없어요" 안내 문구
   - API 에러: react-hot-toast 에러 메시지
   - 로딩: 스켈레톤 UI

3. 환경변수 정리
   .env.example:
   VITE_API_URL=http://localhost:8000
   ANTHROPIC_API_KEY=sk-ant-api...
   DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/cakesaas
   SECRET_KEY=랜덤_32자_시크릿_키
   ACCESS_TOKEN_EXPIRE_MINUTES=10080

4. docker-compose.yml 완성
   - frontend (Vite dev server)
   - backend (FastAPI + uvicorn)
   - mysql (8.0, 헬스체크 + 볼륨)

5. README.md 작성
   - 로컬 개발 실행 방법 (docker-compose up)
   - 환경변수 설정 방법
   - API 테스트 curl 명령어 5개

6. 전체 기능 테스트 체크리스트 출력
```

---

## ✅ 추가 지시사항

- 컴포넌트는 100줄 이하로 분리해서 재사용성 높게
- API 에러 처리는 TanStack Query의 onError + react-hot-toast 활용
- 환경변수: `VITE_API_URL`, `ANTHROPIC_API_KEY`
- TypeScript strict mode 사용 (any 절대 금지)
- 한국어 날짜/시간 포맷 사용 (dayjs + locale ko)
- 모바일 우선 반응형 (오너가 핸드폰으로 쓰는 경우 多)
- Pydantic 스키마와 SQLAlchemy 모델 파일 반드시 분리
- 패키지 매니저: 프론트엔드는 **pnpm** 고정
- Phase 2 캔버스 기능은 **Konva.js** 사용 예정 (지금은 구현 안 함)
