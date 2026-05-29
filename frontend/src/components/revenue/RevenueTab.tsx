import type { RevenueDay } from '../../api/revenue';

interface Props {
  daily:        RevenueDay[];
  revenueTotal: number;
  costTotal:    number;
}

export default function RevenueTab({ daily, revenueTotal, costTotal }: Props) {
  const activeDays = daily.filter((d) => d.orderCount > 0);

  if (activeDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
        <svg viewBox="0 0 40 40" width="36" height="36" className="mb-3 opacity-40">
          <rect x="4" y="8" width="32" height="26" rx="3" stroke="currentColor" fill="none" strokeWidth="2"/>
          <path d="M4 16h32M13 8v4M27 8v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <p className="text-[13px]">이번 달 매출 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[11px] font-semibold text-ink-muted uppercase tracking-wide border-b-[0.5px] border-border">
        <span>날짜</span>
        <span className="text-right">주문</span>
        <span className="text-right">매출</span>
        <span className="text-right">원가</span>
      </div>

      {/* 행 */}
      {activeDays.map((d) => {
        const [, m, day] = d.date.split('-');
        return (
          <div key={d.date} className="grid grid-cols-4 gap-2 px-4 py-3 border-b-[0.5px] border-border hover:bg-surface/50 transition-colors">
            <span className="text-[13px] text-ink font-num">{m}/{day}</span>
            <span className="text-[13px] text-ink-sub text-right font-num">{d.orderCount}건</span>
            <span className="text-[13px] font-semibold text-ink text-right font-num">₩{d.revenue.toLocaleString()}</span>
            <span className="text-[12px] text-ink-muted text-right font-num">
              {d.cost > 0 ? `₩${d.cost.toLocaleString()}` : '—'}
            </span>
          </div>
        );
      })}

      {/* 합계 */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-surface rounded-b-xl">
        <span className="text-[12px] font-semibold text-ink-sub">합계</span>
        <span className="text-[12px] text-ink-sub text-right font-num">{activeDays.reduce((s, d) => s + d.orderCount, 0)}건</span>
        <span className="text-[13px] font-bold text-primary text-right font-num">₩{revenueTotal.toLocaleString()}</span>
        <span className="text-[12px] text-ink-muted text-right font-num">
          {costTotal > 0 ? `₩${costTotal.toLocaleString()}` : '—'}
        </span>
      </div>
    </div>
  );
}
