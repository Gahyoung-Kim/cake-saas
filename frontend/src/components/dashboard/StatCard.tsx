// ── 증감 계산 헬퍼 ───────────────────────────────────────────────────────

export function calcDelta(current: number, prev: number): number {
  return current - prev;
}

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  label: string;
  value: number | string;
  unit?: string;
  sub?: string;
  icon: React.ReactNode;
  delta?: number;          // 전월 대비 증감 (양수=증가, 음수=감소)
  deltaLabel?: string;     // "전월 대비" 등
  accent?: 'danger' | 'warning' | 'success';
  loading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function StatCard({
  label, value, unit, sub, icon, delta, deltaLabel = '전월 대비', accent, loading,
}: Props) {
  const valueColor =
    accent === 'danger'  ? 'text-danger'
    : accent === 'warning' ? 'text-warning'
    : accent === 'success' ? 'text-success'
    : 'text-ink';

  return (
    <div className="bg-bg border-[0.5px] border-border rounded-xl p-5 flex flex-col gap-3 min-h-[130px] hover:shadow-sm transition-shadow duration-200">
      {/* 아이콘 + 라벨 */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-sub">{label}</span>
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface text-ink-muted shrink-0">
          {icon}
        </span>
      </div>

      {/* 숫자 */}
      {loading ? (
        <div className="skeleton h-8 w-24 rounded-md" />
      ) : (
        <div className={`text-[28px] font-semibold tracking-[-0.01em] font-num tabular-nums flex items-baseline gap-1 ${valueColor}`}>
          {value}
          {unit && <span className="text-[14px] font-medium text-ink-sub font-ko">{unit}</span>}
        </div>
      )}

      {/* 하단: sub 텍스트 + 증감 */}
      <div className="flex items-center justify-between mt-auto gap-2 flex-wrap">
        {sub && <span className="text-[11px] text-ink-muted truncate">{sub}</span>}
        {delta !== undefined && !loading && (
          <DeltaBadge delta={delta} label={deltaLabel} />
        )}
      </div>
    </div>
  );
}

// ── 증감 뱃지 ─────────────────────────────────────────────────────────────

function DeltaBadge({ delta, label }: { delta: number; label: string }) {
  if (delta === 0) {
    return (
      <span className="text-[11px] text-ink-muted flex items-center gap-0.5 shrink-0">
        <span>━</span>
        {label}
      </span>
    );
  }

  const isUp = delta > 0;
  return (
    <span className={`text-[11px] font-medium flex items-center gap-0.5 shrink-0 ${
      isUp ? 'text-success' : 'text-danger'
    }`}>
      {isUp ? (
        <svg viewBox="0 0 10 10" width="9" height="9">
          <path d="M5 2l3.5 5H1.5z" fill="currentColor" />
        </svg>
      ) : (
        <svg viewBox="0 0 10 10" width="9" height="9">
          <path d="M5 8L1.5 3h7z" fill="currentColor" />
        </svg>
      )}
      {Math.abs(delta).toLocaleString()}
      <span className="text-ink-muted font-normal ml-0.5">{label}</span>
    </span>
  );
}
