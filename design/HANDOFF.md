# caker · Design Handoff

> 1인 수제케이크샵 운영 SaaS — 디자인 토큰 + 컴포넌트 매핑.
> 라이트 모드 기준 v0.1. Tailwind v3.x 기반 가정.

---

## 1. CSS `:root {}` 변수

`globals.css` 또는 Tailwind의 `@layer base { :root {} }`에 그대로 붙여 넣으세요.

```css
:root {
  /* ────────── Colors ────────── */
  --color-bg:             #FFFDF5;   /* Primary Background · 크림 화이트 */
  --color-surface:        #F5EDE8;   /* Surface · 웜 크림 */
  --color-surface-2:      #FBF6F0;   /* Surface 한 단계 더 연한 종이 */

  --color-primary:        #C8917A;   /* Pink Brown · CTA */
  --color-primary-dark:   #A0685A;   /* Hover / Press */
  --color-primary-light:  #F2C4B0;   /* Tab active · Badge bg */
  --color-muted:          #E8D5CC;   /* Disabled · 보조 서피스 */

  --color-text:           #3D2B24;   /* 본문 · 다크 초코 */
  --color-text-sub:       #8C6B62;   /* 보조 · 미디엄 브라운 */
  --color-text-muted:     #B89E98;   /* 옅음 · 연한 브라운 */

  --color-border:         #E8D5CC;   /* Border · 머드 핑크 */
  --color-border-strong:  #D7BFB4;   /* Hover/Focus 경계 */

  --color-success:        #7CAE8A;   /* 세이지 그린 */
  --color-warning:        #D4A850;   /* 웜 앰버 */
  --color-danger:         #C4706A;   /* 소프트 레드 */

  /* Status tonal pairs (bg / fg) */
  --status-inquiry-bg:    #FAEFD5;
  --status-inquiry-fg:    #8A6A1F;
  --status-confirmed-bg:  #DFEFE3;
  --status-confirmed-fg:  #3F7A52;
  --status-making-bg:     #DDE6F1;
  --status-making-fg:     #46668C;
  --status-done-bg:       #E8E2DE;
  --status-done-fg:       #8C6B62;
  --status-cancel-bg:     #F2DDDB;
  --status-cancel-fg:     #9F4A44;

  /* ────────── Typography ────────── */
  --font-ko:   "SUITE Variable", "SUITE", "Pretendard Variable", "Pretendard",
               -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
               "Noto Sans KR", system-ui, sans-serif;
  --font-num:  "Paperlogy", "Inter Tight", "Pretendard Variable", "Pretendard",
               ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo,
               "SF Mono", monospace;

  /* Type scale */
  --text-h1:       24px;   /* SemiBold 600 */
  --text-h2:       20px;   /* Medium   500 */
  --text-h3:       16px;   /* Medium   500 */
  --text-body:     14px;   /* Regular  400 */
  --text-caption:  12px;   /* Regular  400 */

  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;

  --leading-base: 1.6;

  /* ────────── Spacing (4px scale) ────────── */
  --spacing-0:  0;
  --spacing-1:  4px;
  --spacing-2:  8px;
  --spacing-3:  12px;
  --spacing-4:  16px;
  --spacing-5:  24px;
  --spacing-6:  32px;
  --spacing-7:  48px;
  --spacing-8:  64px;

  /* ────────── Border Radius ────────── */
  --border-radius-sm:   4px;
  --border-radius-md:   8px;
  --border-radius-lg:   12px;
  --border-radius-xl:   16px;
  --border-radius-2xl:  24px;
  --border-radius-full: 9999px;

  /* ────────── Shadows (warm brown tint) ────────── */
  --shadow-sm: 0 1px 2px rgba(61, 43, 36, 0.04),
               0 1px 1px rgba(61, 43, 36, 0.03);
  --shadow-md: 0 4px 12px rgba(61, 43, 36, 0.06),
               0 1px 3px rgba(61, 43, 36, 0.04);
  --shadow-lg: 0 20px 40px rgba(61, 43, 36, 0.08),
               0 4px 12px rgba(61, 43, 36, 0.04);

  /* ────────── Motion ────────── */
  --ease:      cubic-bezier(0.22, 0.61, 0.36, 1);
  --dur-fast:  120ms;
  --dur:       200ms;
  --dur-slow:  320ms;
}
```

### `tailwind.config.ts` 매핑

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        bg:           'var(--color-bg)',
        surface:      'var(--color-surface)',
        'surface-2':  'var(--color-surface-2)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark:    'var(--color-primary-dark)',
          light:   'var(--color-primary-light)',
        },
        muted:        'var(--color-muted)',
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
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '24px',
        6: '32px',
        7: '48px',
        8: '64px',
      },
      borderRadius: {
        sm:    '4px',
        md:    '8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '24px',
        full:  '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(61,43,36,.04), 0 1px 1px rgba(61,43,36,.03)',
        md: '0 4px 12px rgba(61,43,36,.06), 0 1px 3px rgba(61,43,36,.04)',
        lg: '0 20px 40px rgba(61,43,36,.08), 0 4px 12px rgba(61,43,36,.04)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
};
export default config;
```

---

## 2. 컴포넌트 → Tailwind 클래스 매핑

### Button

공통:
```html
class="inline-flex items-center justify-center gap-[6px] rounded-md
       font-medium font-ko whitespace-nowrap border border-transparent
       transition-[background,color,border-color,box-shadow] duration-200 ease-out
       active:translate-y-px focus-visible:outline-2 focus-visible:outline-primary-light
       focus-visible:outline-offset-2 disabled:opacity-45 disabled:cursor-not-allowed"
```

| Variant   | Size | Tailwind                                                                                 |
|-----------|------|------------------------------------------------------------------------------------------|
| Primary   | sm   | `h-7  px-3 text-[12px] rounded-[6px] bg-primary text-bg hover:bg-primary-dark`           |
| Primary   | md   | `h-9  px-4 text-[13px] bg-primary text-bg hover:bg-primary-dark`                         |
| Primary   | lg   | `h-11 px-5 text-[14px] rounded-[10px] bg-primary text-bg hover:bg-primary-dark`          |
| Secondary | md   | `h-9  px-4 text-[13px] bg-bg text-ink border-border-strong hover:border-primary hover:text-primary-dark` |
| Ghost     | md   | `h-9  px-4 text-[13px] bg-transparent text-ink-sub hover:bg-muted hover:text-ink`        |
| Danger    | md   | `h-9  px-4 text-[13px] bg-danger text-bg hover:brightness-95`                            |

### Badge / Chip

```html
<!-- 상태 뱃지 (24px 높이) -->
<span class="inline-flex items-center gap-[6px] h-6 px-[10px] rounded-full
             text-[12px] font-medium leading-none
             bg-status-confirmed-bg text-status-confirmed-fg">
  <span class="w-[6px] h-[6px] rounded-full bg-current opacity-70"></span>
  확정
</span>

<!-- 캘린더 칩 (compact) -->
<span class="inline-flex items-center text-[11px] font-medium px-[7px] py-[3px]
             rounded-sm bg-status-confirmed-bg text-status-confirmed-fg">
  확정 5
</span>
```

### Card

```html
<!-- 예약 카드 -->
<article class="bg-bg border-[0.5px] border-border rounded-lg p-5
                flex flex-col gap-[14px]
                hover:shadow-md hover:border-border-strong
                transition-[box-shadow,border-color] duration-200">
  …
</article>

<!-- 요약 통계 카드 -->
<div class="bg-bg border-[0.5px] border-border rounded-lg p-5
            flex flex-col gap-[10px] min-h-[130px]">
  <div class="text-[12px] text-ink-sub font-medium">오늘 픽업</div>
  <div class="text-[28px] font-semibold tracking-[-0.01em] font-num
              tabular-nums flex items-baseline gap-1">
    3<span class="text-[13px] font-medium text-ink-sub font-ko">건</span>
  </div>
  <div class="text-[12px] text-ink-muted mt-auto">14:00 · 16:30 · 18:00</div>
</div>
```

### Input / Textarea / Select

```html
<!-- 공통 Input -->
<input class="bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px]
              text-[13px] text-ink outline-none transition-[border-color,box-shadow]
              duration-200 placeholder:text-ink-muted
              hover:border-border-strong
              focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)]" />

<!-- Error 상태 -->
<input class="… border-danger focus:shadow-[0_0_0_3px_rgba(196,112,106,0.14)]" />

<!-- Textarea -->
<textarea rows="4" class="… h-auto py-[10px] leading-[1.5] resize-y font-ko" />

<!-- Select (네이티브) -->
<div class="relative">
  <select class="appearance-none bg-bg border-[0.5px] border-border rounded-md
                 pl-3 pr-9 h-[38px] w-full text-[13px] outline-none
                 hover:border-border-strong focus:border-primary
                 focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)]">
    <option>6호</option>
  </select>
  <svg class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-sub
              pointer-events-none w-3 h-3"> … </svg>
</div>

<!-- Segmented (탭 톤) -->
<div class="inline-flex p-[3px] bg-muted rounded-md gap-[2px]">
  <button class="h-[30px] px-[14px] rounded-[6px] text-[12px] font-medium
                 text-ink-sub transition-all duration-200">4호</button>
  <button class="h-[30px] px-[14px] rounded-[6px] text-[12px] font-medium
                 bg-bg text-ink shadow-sm">6호</button>
</div>
```

---

## 3. 상태별 컬러 매핑

| 상태       | 의미          | Background | Foreground | Tailwind class                          |
|-----------|--------------|------------|------------|-----------------------------------------|
| 문의       | 노란 경고     | `#FAEFD5`  | `#8A6A1F`  | `bg-status-inquiry-bg   text-status-inquiry-fg`   |
| 확정       | 세이지 그린   | `#DFEFE3`  | `#3F7A52`  | `bg-status-confirmed-bg text-status-confirmed-fg` |
| 제작중     | 더스티 블루   | `#DDE6F1`  | `#46668C`  | `bg-status-making-bg    text-status-making-fg`    |
| 완료       | 차분한 그레이 | `#E8E2DE`  | `#8C6B62`  | `bg-status-done-bg      text-status-done-fg`      |
| 취소       | 소프트 레드   | `#F2DDDB`  | `#9F4A44`  | `bg-status-cancel-bg    text-status-cancel-fg`    |

### 시맨틱 액션 컬러

| 의미     | Hex       | Tailwind     | 용도                            |
|---------|-----------|--------------|--------------------------------|
| Success | `#7CAE8A` | `bg-success` | 체크/완료/△ 증가                |
| Warning | `#D4A850` | `bg-warning` | 낮은 신뢰도/주의/경계 노란 강조  |
| Danger  | `#C4706A` | `bg-danger`  | 미입금/취소/▽ 감소               |

---

## 4. 웹 레이아웃 치수

```ts
export const WEB = {
  // Layout
  sidebarWidth:     220,   // px
  pageMaxWidth:     1280,  // px (와이드스크린 콘텐츠 컨테이너)
  pagePaddingX:     40,    // px (메인 좌우 패딩)
  pagePaddingY:     36,    // px (상단), 80 (하단)

  // Header
  pageHeaderHeight: 96,    // eyebrow + title + sub
  appTopHeight:     72,    // 짧은 헤더(콘텐츠 내부)

  // Spacing rhythm
  sectionGap:       32,    // 큰 섹션 사이
  cardGap:          16,    // 카드 간 간격
  rowGap:           14,    // 테이블 행 패딩(상하)

  // Grid
  summaryCols:      3,     // 요약 카드 (3 columns)
  cardGrid:         4,     // 통계 4-col / 카드 3-col
  reservationCols:  '96px 1.1fr 1.8fr 140px 120px 36px', // 예약 테이블

  // Borders
  borderWidth:      0.5,   // px
  cardRadius:       12,    // --border-radius-lg
  sectionRadius:    16,    // --border-radius-xl

  // Components
  inputHeight:      38,
  buttonMd:         36,
  buttonLg:         44,
  badgeHeight:      24,
};
```

### CSS Grid 예시

```css
/* 예약 테이블 행 */
.rsv-row {
  display: grid;
  grid-template-columns: 96px minmax(0,1.1fr) minmax(0,1.8fr) 140px 120px 36px;
  gap: 16px;
}

/* 요약 카드 그리드 (대시보드) */
.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

/* 통계 4개 (앱 메인) */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
```

---

## 5. 앱 레이아웃 치수 (iPhone 14 · 375×812)

```ts
export const APP = {
  // Device
  screenWidth:       375,
  screenHeight:      812,

  // Safe area
  safeAreaTop:       47,    // 다이내믹 아일랜드 + 상태바
  safeAreaBottom:    34,    // 홈 인디케이터

  // Chrome
  tabbarHeight:      80,    // 안전영역 포함 (콘텐츠 46 + safe 34)
  topnavHeight:      44,    // 뒤로가기 + 타이틀

  // Touch target
  minTouchTarget:    44,    // 모든 인터랙티브 요소

  // Layout
  contentPaddingX:   20,    // 좌우
  cardPadding:       14,    // 모바일 카드 내부
  cardGap:           10,    // 카드 간 간격
  cardRadius:        14,    // 모바일 카드 라운드

  // Components
  fabSize:           56,
  fabBottomOffset:   100,   // tabbar(80) + 20 여유
  fabRightOffset:    16,
  avatarSize:        36,
  iconBtnSize:       36,

  // Sheet (슬라이드업 패널)
  sheetRadius:       24,    // 상단만
  sheetMaxHeight:    '56%', // 화면 비율
  sheetHandleW:      36,
  sheetHandleH:      4,

  // Calendar
  calCellAspect:     '1 / 1',
  calCellMinHeight:  44,
  calCellRadius:     10,
};
```

### 모바일 화면 골격

```css
.m-screen {
  width: 375px;
  height: 812px;
  box-sizing: border-box;
  padding-top: 47px;             /* Safe area top */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.m-tabbar {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 80px;
  padding-bottom: 34px;          /* Safe area bottom */
  display: grid; grid-template-columns: repeat(5, 1fr);
}
```

### 폰트 크기 하한

| 위치              | 최소 크기 | 권장      |
|------------------|----------|-----------|
| Caption / 시간    | 11px     | 12px      |
| 메타 / 옵션 칩    | 12px     | 12-13px   |
| 본문 / 입력값     | 13px     | 14px      |
| 카드 제목         | 14px     | 14-15px   |
| 페이지 타이틀     | 17px     | 18-22px   |

---

## 6. 반응형 브레이크포인트

Tailwind 기본 + 본 디자인 시스템 활용 권장값:

```ts
screens: {
  sm:   '640px',   // 모바일 가로 / 작은 태블릿
  md:   '768px',   // 태블릿 세로
  lg:   '1024px', // 태블릿 가로 / 좁은 데스크탑
  xl:   '1280px', // 본 시스템의 기준 데스크탑 (사이드바 + 콘텐츠)
  '2xl':'1536px', // 와이드 데스크탑
}
```

### 사용 규칙

```html
<!-- 모바일 우선, 데스크탑에서 사이드바 노출 -->
<aside class="hidden xl:flex w-[220px] shrink-0">…</aside>

<!-- 요약 카드: 모바일 2열 → 데스크탑 3-4열 -->
<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">…</div>

<!-- 예약 테이블 → 모바일에서는 카드 스택으로 변환 -->
<div class="hidden md:grid grid-cols-[96px_1.1fr_1.8fr_140px_120px_36px] gap-4">…</div>
<div class="md:hidden flex flex-col gap-[10px]">…</div>
```

### 브레이크포인트별 레이아웃 의도

| BP          | 사이드바  | 컬럼 수 | 카드 패딩 | 비고                             |
|-------------|----------|--------|----------|----------------------------------|
| `< sm`      | none     | 1      | 14px     | 모바일 앱 화면 패턴 그대로        |
| `sm–md`     | none     | 2      | 16-18px  | 통계 2×2, 리스트 카드            |
| `md–lg`     | drawer   | 2      | 20px     | 사이드바 드로어로 토글            |
| `lg–xl`     | 200px    | 3      | 20px     | 사이드바 등장, 콘텐츠 압축        |
| `≥ xl`      | 220px    | 3-4    | 22-24px  | 본 시스템 기준 1280px 와이드 레이아웃 |

---

## 부록 · 폰트 로딩

```html
<!-- 한글: SUITE 또는 Pretendard(폴백) -->
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />

<!-- 영문/숫자: Paperlogy 또는 Inter Tight(폴백) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap" />
```

> SUITE / Paperlogy를 사내 호스팅으로 제공할 경우, 위 링크를 사내 webfont CSS로 교체하면 `--font-ko`, `--font-num` 변수가 그대로 동작합니다.

---

## 부록 · 모션 가이드

```css
/* 표준 트랜지션 — 200ms ease-out */
transition: background var(--dur) var(--ease),
            color      var(--dur) var(--ease),
            border-color var(--dur) var(--ease);

/* 페이지 진입 페이드인 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* AI 스파클 (강조용) */
@keyframes sparkle {
  0%, 100% { transform: scale(1)   rotate(0);   opacity: 1; }
  50%      { transform: scale(1.15) rotate(8deg); opacity: 0.85; }
}
```

| Duration   | 용도                              |
|-----------|----------------------------------|
| `120ms`   | 즉시 반응 (버튼 press, 토글)      |
| `200ms`   | 표준 (호버, 포커스, 색 변화)      |
| `320ms`   | 진입/전환 (모달, 슬라이드 패널)   |
