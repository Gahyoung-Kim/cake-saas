import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import type { CalendarDay } from '../../api/reservation';
import DayCell from './DayCell';

dayjs.locale('ko');

const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;

interface Props {
  year: number;
  month: number;
  days: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export default function CalendarGrid({ year, month, days, selectedDate, onSelectDate }: Props) {
  const first      = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const startOffset = first.day();      // 0=일
  const daysInMonth = first.daysInMonth();
  const today       = dayjs().format('YYYY-MM-DD');

  const dayMap = new Map(days.map((d) => [d.date, d]));

  // 앞 빈칸 (이전 달 말일부터)
  const prevDays: { day: number; dateStr: string }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = first.subtract(i + 1, 'day');
    prevDays.push({ day: d.date(), dateStr: d.format('YYYY-MM-DD') });
  }

  // 이번 달
  const currDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      day,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };
  });

  // 뒤 빈칸 (다음 달 1일부터)
  const totalCells = prevDays.length + currDays.length;
  const trailingCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextDays: { day: number; dateStr: string }[] = [];
  for (let i = 1; i <= trailingCount; i++) {
    const d = first.add(daysInMonth - 1 + i, 'day');
    nextDays.push({ day: d.date(), dateStr: d.format('YYYY-MM-DD') });
  }

  const allCells = [
    ...prevDays.map((c) => ({ ...c, isOtherMonth: true })),
    ...currDays.map((c) => ({ ...c, isOtherMonth: false })),
    ...nextDays.map((c) => ({ ...c, isOtherMonth: true })),
  ];

  return (
    <div className="border-[0.5px] border-border rounded-xl overflow-hidden bg-bg">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-surface border-b-[0.5px] border-border">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={[
              'text-center text-[11px] font-semibold py-2.5 tracking-wide',
              i === 0 ? 'text-danger'
              : i === 6 ? 'text-primary'
              : 'text-ink-muted',
            ].join(' ')}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {allCells.map(({ day, dateStr, isOtherMonth }, idx) => (
          <DayCell
            key={dateStr}
            day={day}
            dateStr={dateStr}
            info={dayMap.get(dateStr)}
            isToday={dateStr === today}
            isSelected={dateStr === selectedDate}
            isOtherMonth={isOtherMonth}
            colIdx={idx % 7}
            onClick={() => onSelectDate(dateStr)}
          />
        ))}
      </div>
    </div>
  );
}
