import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import StatusBadge, { STATUS_CONFIG } from './StatusBadge';
import type { Reservation, ReservationStatus } from '../../api/reservation';

dayjs.locale('ko');

const STATUS_OPTIONS: ReservationStatus[] = [
  'inquiry', 'confirmed', 'making', 'done', 'cancelled',
];

interface Props {
  reservation: Reservation;
  onStatusChange: (status: ReservationStatus) => void;
  onClick: () => void;
}

export default function ReservationCard({ reservation: r, onStatusChange, onClick }: Props) {
  const pickup = dayjs(r.pickupDate);
  const isToday = r.pickupDate === dayjs().format('YYYY-MM-DD');
  const isDone = r.status === 'done' || r.status === 'cancelled';

  return (
    <article
      onClick={onClick}
      className={`
        bg-bg border-[0.5px] border-border rounded-lg p-4
        flex flex-col gap-3 cursor-pointer
        hover:shadow-md hover:border-border-strong
        transition-[box-shadow,border-color] duration-200
        ${isDone ? 'opacity-60' : ''}
      `}
    >
      {/* Row 1: 날짜 + 상태 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isToday && (
            <span className="text-[10px] font-semibold px-[6px] py-[2px] rounded-full bg-primary text-bg leading-none shrink-0">
              오늘
            </span>
          )}
          <div>
            <span className="text-[14px] font-semibold text-ink font-num">
              {pickup.format('MM.DD')}
            </span>
            <span className="text-[12px] text-ink-muted font-num ml-1.5">
              {pickup.format('ddd')}
              {r.pickupTime && ` · ${r.pickupTime}`}
            </span>
          </div>
        </div>

        {/* 상태 셀렉터 — 클릭 버블 막기 */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <select
            value={r.status}
            onChange={(e) => onStatusChange(e.target.value as ReservationStatus)}
            className="text-[11px] border-[0.5px] border-border rounded-md px-1.5 h-6 bg-bg text-ink outline-none focus:border-primary cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <StatusBadge status={r.status} />
        </div>
      </div>

      {/* Row 2: 고객 정보 */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-[11px] font-semibold text-ink-sub shrink-0 border-[0.5px] border-border">
          {r.customerName?.[0] ?? '?'}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-ink truncate">{r.customerName}</div>
          {r.customerPhone && (
            <div className="text-[12px] text-ink-muted font-num">{r.customerPhone}</div>
          )}
        </div>
      </div>

      {/* Row 3: 케이크 정보 */}
      <div className="flex gap-3 items-start">
        {/* 디자인 이미지 썸네일 */}
        {r.designImage && (
          <img
            src={r.designImage}
            alt="디자인 참고"
            onClick={(e) => e.stopPropagation()}
            className="w-14 h-14 object-cover rounded-lg border-[0.5px] border-border shrink-0 cursor-zoom-in"
          />
        )}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {r.cakeFlavor && <Chip>{r.cakeFlavor}</Chip>}
          {r.cakeSize   && <Chip>{r.cakeSize}</Chip>}
          {r.lettering  && (
            <Chip className="max-w-[180px] truncate">"{r.lettering}"</Chip>
          )}
          {r.designNote && (
            <Chip className="text-status-inquiry-fg bg-status-inquiry-bg border-status-inquiry-fg/20">
              {r.designNote.length > 20 ? r.designNote.slice(0, 20) + '…' : r.designNote}
            </Chip>
          )}
        </div>
      </div>

      {/* Row 4: 금액 + 입금 */}
      <div
        className="flex items-center justify-between pt-3 border-t-[0.5px] border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[14px] font-semibold text-ink font-num">
          {r.price > 0 ? `₩${r.price.toLocaleString()}` : '금액 미정'}
        </span>
        <button
          onClick={() => onStatusChange(r.depositPaid ? r.status : r.status)}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
            r.depositPaid
              ? 'bg-status-confirmed-bg text-status-confirmed-fg'
              : 'bg-status-inquiry-bg text-status-inquiry-fg'
          }`}
        >
          {r.depositPaid ? '입금 완료' : '미입금'}
        </button>
      </div>
    </article>
  );
}

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-sm bg-muted text-ink-sub border-[0.5px] border-border ${className}`}>
      {children}
    </span>
  );
}
