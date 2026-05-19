import type { ReservationStatus } from '../../api/reservation';

// ── 디자인 토큰 매핑 ───────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<ReservationStatus, {
  label: string;
  bg: string;
  fg: string;
  dot: string;
}> = {
  inquiry:   { label: '문의',   bg: 'bg-status-inquiry-bg',   fg: 'text-status-inquiry-fg',   dot: 'bg-status-inquiry-fg'   },
  confirmed: { label: '확정',   bg: 'bg-status-confirmed-bg', fg: 'text-status-confirmed-fg', dot: 'bg-status-confirmed-fg' },
  making:    { label: '제작중', bg: 'bg-status-making-bg',    fg: 'text-status-making-fg',    dot: 'bg-status-making-fg'    },
  done:      { label: '완료',   bg: 'bg-status-done-bg',      fg: 'text-status-done-fg',      dot: 'bg-status-done-fg'      },
  cancelled: { label: '취소',   bg: 'bg-status-cancel-bg',    fg: 'text-status-cancel-fg',    dot: 'bg-status-cancel-fg'    },
};

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  status: ReservationStatus;
  /** 'md' = 24px 기본 | 'sm' = 캘린더 칩용 */
  size?: 'md' | 'sm';
}

// ── Component ─────────────────────────────────────────────────────────────

export default function StatusBadge({ status, size = 'md' }: Props) {
  const { label, bg, fg } = STATUS_CONFIG[status];

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center text-[11px] font-medium px-[7px] py-[3px] rounded-sm ${bg} ${fg} leading-none`}>
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-[6px] h-6 px-[10px] rounded-full text-[12px] font-medium leading-none ${bg} ${fg}`}>
      <span className="w-[6px] h-[6px] rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
