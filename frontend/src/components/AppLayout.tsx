import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { reservationApi } from '../api/reservation';

// ── 데스크탑 사이드바 전체 ───────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/',              label: '대시보드',   end: true  },
  { to: '/reservations',  label: '예약 목록'             },
  { to: '/today',         label: '오늘 픽업'             },
  { to: '/customers',     label: '고객'                  },
  { to: '/extract',       label: '예약 추출',  badge: 'AI' },
  { to: '/calendar',      label: '캘린더'                 },
  { to: '/revenue',       label: '매출 · 지출'           },
  { to: '/order-form',    label: '주문서 설정'            },
  { to: '/settings',      label: '설정'                   },
];

// ── 모바일 하단 탭 (4개 고정) ────────────────────────────────────────────

const MOBILE_TABS = [
  { to: '/',             label: '홈',    end: true },
  { to: '/reservations', label: '예약'            },
  { to: '/extract',      label: 'AI'              },
  { to: '/calendar',     label: '캘린더'           },
];

// ── 더보기 시트 항목 ─────────────────────────────────────────────────────

function RevenueIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className="text-ink-sub">
      <path d="M4 14l3-4 3 2 3-5 3 3" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" fill="none" strokeWidth="1.4"/>
    </svg>
  );
}

const MORE_ITEMS = [
  { to: '/today',      label: '오늘 픽업',   icon: TodayIcon    },
  { to: '/customers',  label: '고객 목록',   icon: PeopleIcon   },
  { to: '/revenue',    label: '매출 · 지출', icon: RevenueIcon  },
  { to: '/order-form', label: '주문서 설정', icon: FormIcon     },
  { to: '/settings',   label: '설정',       icon: SettingsIcon  },
];

// ── 아이콘 ───────────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, React.ReactNode> = {
  '/': (
    <svg viewBox="0 0 20 20" width="22" height="22">
      <rect x="3" y="3" width="6" height="6" rx="1.2" fill="currentColor"/>
      <rect x="11" y="3" width="6" height="6" rx="1.2" fill="currentColor" opacity=".4"/>
      <rect x="3" y="11" width="6" height="6" rx="1.2" fill="currentColor" opacity=".4"/>
      <rect x="11" y="11" width="6" height="6" rx="1.2" fill="currentColor" opacity=".4"/>
    </svg>
  ),
  '/reservations': (
    <svg viewBox="0 0 20 20" width="22" height="22">
      <rect x="3" y="4" width="14" height="13" rx="1.6" stroke="currentColor" fill="none" strokeWidth="1.6"/>
      <path d="M3 9h14M7 4v5M13 4v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6 13h8M6 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  '/extract': (
    <svg viewBox="0 0 20 20" width="22" height="22">
      <path d="M10 2l1.75 4.5L16 8l-4.25 1.75L10 14.5l-1.75-4.75L4 8l4.25-1.5L10 2z" fill="currentColor"/>
    </svg>
  ),
  '/calendar': (
    <svg viewBox="0 0 20 20" width="22" height="22">
      <rect x="3" y="4" width="14" height="13" rx="1.6" stroke="currentColor" fill="none" strokeWidth="1.6"/>
      <path d="M3 8h14M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
};

// ── Component ────────────────────────────────────────────────────────────

interface Props { children: React.ReactNode; }

export default function AppLayout({ children }: Props) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();
  const [moreOpen, setMoreOpen] = useState(false);

  // 대기중 예약 카운트 (문의 + 확정)
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn:  () => reservationApi.dashboardStats(),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 5, // 5분마다 갱신
  });
  const pendingCount = stats?.pendingCount ?? 0;

  // 더보기 항목 중 하나가 활성 상태면 더보기 탭을 활성으로 표시
  const moreActive = MORE_ITEMS.some((m) => location.pathname.startsWith(m.to));

  function handleLogout() { logout(); navigate('/login'); }
  function handleMoreNav(to: string) { setMoreOpen(false); navigate(to); }

  return (
    <div className="flex min-h-screen bg-bg">

      {/* ── 데스크탑 사이드바 ── */}
      <aside className="hidden xl:flex w-[220px] shrink-0 flex-col border-r-[0.5px] border-border bg-surface">
        <div className="flex items-center gap-3 px-4 py-5 border-b-[0.5px] border-border">
          <CakeLogo />
          <div>
            <div className="text-[13px] font-semibold text-ink leading-tight truncate max-w-[130px]">
              {user?.shopName ?? 'caker'}
            </div>
            <div className="text-[11px] text-ink-muted leading-tight">수제케이크 운영 도구</div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          {NAV_ITEMS.map(({ to, label, badge, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-[7px] rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  isActive ? 'bg-primary-light text-primary-dark' : 'text-ink-sub hover:bg-muted hover:text-ink'
                }`
              }
            >
              {label}
              {badge && (
                <span className="ml-auto text-[10px] font-semibold px-[6px] py-[2px] rounded-full bg-primary text-bg leading-none">
                  {badge}
                </span>
              )}
              {/* 대기중 카운트 뱃지 — 예약 목록 항목에만 */}
              {to === '/reservations' && pendingCount > 0 && (
                <span className="ml-auto text-[10px] font-bold px-[6px] py-[2px] rounded-full bg-warning text-bg leading-none">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t-[0.5px] border-border">
          <div className="flex items-center gap-2 px-2 py-1">
            <Avatar name={user?.shopName} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-ink truncate">{user?.shopName}</div>
              <div className="text-[11px] text-ink-muted truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-muted transition-colors"
              aria-label="로그아웃">
              <svg viewBox="0 0 16 16" width="14" height="14">
                <path d="M9 3H3.5A.5.5 0 003 3.5v9a.5.5 0 00.5.5H9M7 8h8m-3-3l3 3-3 3"
                  stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>

      {/* ── 모바일 하단 탭바 (4탭 + 더보기) ── */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-surface/95 backdrop-blur-sm border-t-[0.5px] border-border grid grid-cols-5 z-20 pb-safe">
        {/* 고정 4탭 */}
        {MOBILE_TABS.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-[3px] transition-colors relative ${
                isActive ? 'text-primary' : 'text-ink-muted'
              }`
            }
          >
            <span className="relative">
              {TAB_ICONS[to]}
              {to === '/reservations' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold rounded-full bg-warning text-bg px-[3px] leading-none">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </NavLink>
        ))}

        {/* 더보기 탭 */}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center justify-center gap-[3px] transition-colors ${
            moreActive ? 'text-primary' : 'text-ink-muted'
          }`}
        >
          <svg viewBox="0 0 20 20" width="22" height="22">
            <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
          </svg>
          <span className="text-[10px] font-medium leading-none">더보기</span>
        </button>
      </nav>

      {/* ── 더보기 시트 ── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* 오버레이 */}
            <motion.div
              key="more-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden fixed inset-0 bg-ink/20 z-30"
              onClick={() => setMoreOpen(false)}
            />

            {/* 시트 */}
            <motion.div
              key="more-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              className="xl:hidden fixed bottom-0 left-0 right-0 bg-bg rounded-t-2xl border-t-[0.5px] border-border z-40 pb-safe"
            >
              {/* 핸들 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-9 h-1 rounded-full bg-border" />
              </div>

              {/* 매장명 */}
              <div className="flex items-center gap-3 px-5 py-3 border-b-[0.5px] border-border">
                <Avatar name={user?.shopName} />
                <div>
                  <div className="text-[13px] font-semibold text-ink">{user?.shopName}</div>
                  <div className="text-[11px] text-ink-muted">{user?.email}</div>
                </div>
              </div>

              {/* 메뉴 항목 */}
              <div className="px-4 py-3 flex flex-col gap-1">
                {MORE_ITEMS.map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname.startsWith(to);
                  return (
                    <button
                      key={to}
                      onClick={() => handleMoreNav(to)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-colors text-left ${
                        isActive ? 'bg-primary-light text-primary-dark' : 'text-ink hover:bg-surface'
                      }`}
                    >
                      <Icon />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* 로그아웃 */}
              <div className="px-4 pb-4 pt-1 border-t-[0.5px] border-border mt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-[14px] font-medium text-danger hover:bg-status-cancel-bg transition-colors"
                >
                  <svg viewBox="0 0 20 20" width="20" height="20">
                    <path d="M11 3H4.5A.5.5 0 004 3.5v13a.5.5 0 00.5.5H11M9 10h10m-4-4l4 4-4 4"
                      stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  로그아웃
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 아이콘 함수 ──────────────────────────────────────────────────────────

function TodayIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className="text-ink-sub">
      <rect x="3" y="4" width="14" height="13" rx="1.6" stroke="currentColor" fill="none" strokeWidth="1.6"/>
      <path d="M3 8h14M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M7 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className="text-ink-sub">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" fill="none" strokeWidth="1.6"/>
      <path d="M3 17c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function FormIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className="text-ink-sub">
      <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.6"/>
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className="text-ink-sub">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" fill="none" strokeWidth="1.6"/>
      <path d="M10 2v2m0 12v2m8-8h-2M4 10H2m11.66-5.66l-1.42 1.42M7.76 12.24l-1.42 1.42m9.9 0l-1.42-1.42M7.76 7.76L6.34 6.34"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function CakeLogo() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" className="shrink-0">
      <path d="M6 22 C6 19, 9 18, 16 18 C23 18, 26 19, 26 22 L26 26 L6 26 Z" fill="var(--color-primary)"/>
      <rect x="8" y="14" width="16" height="6" rx="1" fill="var(--color-primary-light)"/>
      <circle cx="16" cy="11" r="2" fill="var(--color-primary-dark)"/>
      <rect x="15.4" y="6" width="1.2" height="5" rx="0.6" fill="var(--color-primary-dark)"/>
    </svg>
  );
}

function Avatar({ name }: { name?: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[12px] font-semibold text-bg shrink-0">
      {name?.[0] ?? '?'}
    </div>
  );
}
