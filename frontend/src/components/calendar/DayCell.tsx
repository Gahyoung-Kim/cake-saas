import type { CalendarDay } from '../../api/reservation';
import CakeIcon from '../CakeIcon';

const DOT_COLOR: Record<string, string> = {
  confirmed: '#3F7A52',
  making:    '#46668C',
  inquiry:   '#8A6A1F',
  done:      '#C9A227',
  cancelled: '#9F4A44',
};
const STATUS_ORDER = ['confirmed', 'making', 'inquiry', 'done', 'cancelled'] as const;
const MAX_DOTS = 3;

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
  const count  = info?.count ?? 0;
  const isOver = info?.isOverLimit ?? false;
  const hasOrders = count > 0;

  const dots: string[] = [];
  for (const s of STATUS_ORDER) {
    const n = info?.[s] ?? 0;
    for (let i = 0; i < n && dots.length < MAX_DOTS; i++) dots.push(DOT_COLOR[s]);
  }

  const cellBg = isSelected
    ? undefined
    : isOver
    ? 'rgba(196,112,106,0.12)'
    : hasOrders
    ? 'rgba(200,145,122,0.10)'
    : undefined;

  return (
    <button
      onClick={onClick}
      data-date={dateStr}
      style={cellBg ? { backgroundColor: cellBg } : undefined}
      className={[
        'text-left w-full flex flex-col transition-colors duration-150',
        'min-h-[72px]',
        'p-1.5 md:p-2',
        'border-b-[0.5px] border-r-[0.5px] border-border',
        isSelected   ? 'bg-primary-light'
        : isOtherMonth ? 'bg-surface/40'
        : !hasOrders  ? 'hover:bg-surface'
        : '',
      ].join(' ')}
    >
      {/* ── 날짜 숫자 + 상태 도트 ── */}
      <div className="flex items-center gap-[4px]">
        <span className={[
          'flex items-center justify-center rounded-full font-medium leading-none shrink-0',
          'w-[22px] h-[22px] text-[11px] md:w-6 md:h-6 md:text-[13px]',
          isToday      ? 'bg-primary text-bg font-semibold'
          : isSelected  ? 'bg-primary text-bg'
          : isOtherMonth ? 'text-ink-muted'
          : colIdx === 0 ? 'text-danger'
          : colIdx === 6 ? 'text-primary'
          : 'text-ink',
        ].join(' ')}>
          {day}
        </span>
        {dots.length > 0 && (
          <div className="flex flex-wrap gap-[3px] max-w-[18px]">
            {dots.map((color, i) => (
              <span
                key={i}
                style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 케이크 아이콘 + 건수 ── */}
      {hasOrders && (
        <div className="flex items-center gap-[4px] mt-auto">
          <CakeIcon size={40} overLimit={isOver} />
          <span
            className="font-num leading-none"
            style={{ fontSize: 11, color: 'var(--color-text-sub)' }}
          >
            ×{count}
          </span>
        </div>
      )}
    </button>
  );
}
