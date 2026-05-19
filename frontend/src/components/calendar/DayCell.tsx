import type { CalendarDay } from '../../api/reservation';

// ── 상태별 도트 컬러 ──────────────────────────────────────────────────────

const DOT_COLOR: Record<string, string> = {
  inquiry:   'bg-status-inquiry-fg',
  confirmed: 'bg-status-confirmed-fg',
  making:    'bg-status-making-fg',
  done:      'bg-status-done-fg',
  cancelled: 'bg-status-cancel-fg',
};

// 상태 우선순위: 중요한 것부터 앞에 표시
const STATUS_ORDER = ['making', 'confirmed', 'inquiry', 'done', 'cancelled'] as const;

interface Props {
  day: number;
  dateStr: string;
  info?: CalendarDay;
  isToday: boolean;
  isSelected: boolean;
  isOtherMonth?: boolean;
  colIdx: number;        // 0=일, 6=토
  onClick: () => void;
}

export default function DayCell({
  day, dateStr, info, isToday, isSelected, isOtherMonth = false, colIdx, onClick,
}: Props) {
  const count    = info?.count ?? 0;
  const isOver   = info?.isOverLimit ?? false;
  const hasDot   = count > 0;

  // 도트 배열 생성 (우선순위 순)
  const dots: string[] = [];
  for (const s of STATUS_ORDER) {
    const n = info?.[s as keyof CalendarDay] as number ?? 0;
    for (let i = 0; i < n; i++) dots.push(DOT_COLOR[s]);
  }

  const MAX_MOBILE  = 3;
  const MAX_DESKTOP = 5;

  const mobileExtra  = Math.max(0, dots.length - MAX_MOBILE);
  const desktopExtra = Math.max(0, dots.length - MAX_DESKTOP);

  return (
    <button
      onClick={onClick}
      data-date={dateStr}
      className={[
        'text-left w-full flex flex-col transition-colors duration-150',
        // 높이: 모바일 44px, 데스크탑 80px
        'min-h-[44px] md:min-h-[80px]',
        // 패딩
        'p-1.5 md:p-2',
        // 경계
        'border-b-[0.5px] border-r-[0.5px] border-border',
        // 배경
        isSelected  ? 'bg-primary-light'
        : isOver    ? 'bg-status-cancel-bg/50'
        : isOtherMonth ? 'bg-surface/40'
        : 'hover:bg-surface',
      ].join(' ')}
    >
      {/* ── 날짜 숫자 ── */}
      <span className={[
        'flex items-center justify-center rounded-full font-medium leading-none shrink-0',
        // 크기: 모바일 22px, 데스크탑 24px
        'w-[22px] h-[22px] text-[11px] md:w-6 md:h-6 md:text-[13px]',
        isToday     ? 'bg-primary text-bg font-semibold'
        : isSelected ? 'bg-primary text-bg'
        : isOtherMonth ? 'text-ink-muted'
        : colIdx === 0 ? 'text-danger'
        : colIdx === 6 ? 'text-primary'
        : 'text-ink',
      ].join(' ')}>
        {day}
      </span>

      {/* ── 데스크탑: 건수 텍스트 ── */}
      {hasDot && (
        <span className={[
          'hidden md:block text-[10px] font-semibold leading-none mt-1',
          isOver ? 'text-status-cancel-fg' : 'text-ink-muted',
        ].join(' ')}>
          {count}건
        </span>
      )}

      {/* ── 도트 영역 ── */}
      {hasDot && (
        <>
          {/* 모바일: 최대 3개 + "+N" */}
          <div className="flex items-center gap-[3px] mt-auto md:hidden flex-wrap">
            {dots.slice(0, MAX_MOBILE).map((color, i) => (
              <span key={i} className={`w-[5px] h-[5px] rounded-full shrink-0 ${color}`} />
            ))}
            {mobileExtra > 0 && (
              <span className="text-[8px] font-semibold text-ink-muted leading-none">
                +{mobileExtra}
              </span>
            )}
          </div>

          {/* 데스크탑: 최대 5개 + "+N" */}
          <div className="hidden md:flex items-center gap-[3px] mt-1 flex-wrap">
            {dots.slice(0, MAX_DESKTOP).map((color, i) => (
              <span key={i} className={`w-[6px] h-[6px] rounded-full shrink-0 ${color}`} />
            ))}
            {desktopExtra > 0 && (
              <span className="text-[9px] font-semibold text-ink-muted leading-none">
                +{desktopExtra}
              </span>
            )}
          </div>
        </>
      )}

      {/* ── 한도 초과 마커 (데스크탑) ── */}
      {isOver && (
        <span className="hidden md:block text-[9px] text-status-cancel-fg font-medium leading-none mt-0.5">
          한도 초과
        </span>
      )}
    </button>
  );
}
