import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const NAV_ITEMS = [
  { to: '/',              label: '대시보드',   end: true  },
  { to: '/reservations',  label: '예약 목록'             },
  { to: '/customers',     label: '고객'                  },
  { to: '/extract',       label: '예약 추출',  badge: 'AI' },
  { to: '/calendar',      label: '캘린더'                 },
  { to: '/order-form',    label: '주문서 설정'            },
  { to: '/settings',      label: '설정'                   },
];

// 아이콘 SVG (16×16)
const ICONS: Record<string, React.ReactNode> = {
  '/': (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="11" y="3" width="6" height="6" rx="1.2" fill="currentColor" opacity=".4" />
      <rect x="3" y="11" width="6" height="6" rx="1.2" fill="currentColor" opacity=".4" />
      <rect x="11" y="11" width="6" height="6" rx="1.2" fill="currentColor" opacity=".4" />
    </svg>
  ),
  '/reservations': (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <rect x="3" y="4" width="14" height="13" rx="1.6" stroke="currentColor" fill="none" strokeWidth="1.6" />
      <path d="M3 9h14M7 4v5M13 4v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 13h8M6 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  '/customers': (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" fill="none" strokeWidth="1.6" />
      <path d="M3 17c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  '/extract': (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M10 2l1.75 4.5L16 8l-4.25 1.75L10 14.5l-1.75-4.75L4 8l4.25-1.5L10 2z" fill="currentColor" />
    </svg>
  ),
  '/calendar': (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <rect x="3" y="4" width="14" height="13" rx="1.6" stroke="currentColor" fill="none" strokeWidth="1.6" />
      <path d="M3 8h14M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  '/order-form': (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.6" />
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  '/settings': (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" fill="none" strokeWidth="1.6" />
      <path d="M10 2v2m0 12v2m8-8h-2M4 10H2m11.66-5.66l-1.42 1.42M7.76 12.24l-1.42 1.42m9.9 0l-1.42-1.42M7.76 7.76L6.34 6.34"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

interface Props { children: React.ReactNode; }

export default function AppLayout({ children }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-bg">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden xl:flex w-[220px] shrink-0 flex-col border-r-[0.5px] border-border bg-surface">
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b-[0.5px] border-border">
          <CakeLogo />
          <div>
            <div className="text-[13px] font-semibold text-ink leading-tight truncate max-w-[130px]">
              {user?.shopName ?? 'caker'}
            </div>
            <div className="text-[11px] text-ink-muted leading-tight">수제케이크 운영 도구</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          {NAV_ITEMS.map(({ to, label, badge, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-[7px] rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-light text-primary-dark'
                    : 'text-ink-sub hover:bg-muted hover:text-ink'
                }`
              }
            >
              {label}
              {badge && (
                <span className="ml-auto text-[10px] font-semibold px-[6px] py-[2px] rounded-full bg-primary text-bg leading-none">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t-[0.5px] border-border">
          <div className="flex items-center gap-2 px-2 py-1">
            <Avatar name={user?.shopName} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-ink truncate">{user?.shopName}</div>
              <div className="text-[11px] text-ink-muted truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-muted transition-colors"
              aria-label="로그아웃"
            >
              <svg viewBox="0 0 16 16" width="14" height="14">
                <path d="M9 3H3.5A.5.5 0 003 3.5v9a.5.5 0 00.5.5H9M7 8h8m-3-3l3 3-3 3"
                  stroke="currentColor" fill="none" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>

      {/* ── Mobile Bottom Nav (5 tabs) ── */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-surface/95 backdrop-blur border-t-[0.5px] border-border grid grid-cols-7 z-20 pb-safe">
        {NAV_ITEMS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-[3px] transition-colors ${
                isActive ? 'text-primary' : 'text-ink-muted'
              }`
            }
          >
            {ICONS[to]}
            <span className="text-[9px] font-medium leading-none">
              {label === '예약 추출' ? 'AI 추출' : label === '주문서 설정' ? '주문서' : label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function CakeLogo() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" className="shrink-0">
      <path d="M6 22 C6 19, 9 18, 16 18 C23 18, 26 19, 26 22 L26 26 L6 26 Z" fill="var(--color-primary)" />
      <rect x="8" y="14" width="16" height="6" rx="1" fill="var(--color-primary-light)" />
      <circle cx="16" cy="11" r="2" fill="var(--color-primary-dark)" />
      <rect x="15.4" y="6" width="1.2" height="5" rx="0.6" fill="var(--color-primary-dark)" />
    </svg>
  );
}

function Avatar({ name }: { name?: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-semibold text-bg shrink-0">
      {name?.[0] ?? '?'}
    </div>
  );
}
