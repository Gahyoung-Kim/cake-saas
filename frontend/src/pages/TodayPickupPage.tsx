import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import toast from 'react-hot-toast';
import { reservationApi } from '../api/reservation';
import type { Reservation, ReservationStatus } from '../api/reservation';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/reservation/StatusBadge';

dayjs.locale('ko');

const TODAY = dayjs().format('YYYY-MM-DD');
const TODAY_LABEL = dayjs().format('YYYY년 M월 D일 (ddd)');

export default function TodayPickupPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['today-pickups', TODAY],
    queryFn:  () => reservationApi.list({ date: TODAY, perPage: 100 }),
    staleTime: 1000 * 60,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) =>
      reservationApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-pickups'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('상태가 변경됐습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const orders = data?.items ?? [];
  const doneCount = orders.filter((o) => o.status === 'done').length;
  const total     = orders.length;

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-14 xl:pb-0">
        <div className="max-w-[720px] mx-auto px-5 xl:px-10 py-8">

          {/* 헤더 */}
          <header className="flex items-start justify-between gap-4 mb-6 print:mb-4">
            <div>
              <div className="text-caption text-ink-muted mb-1">{TODAY_LABEL}</div>
              <h1 className="text-h1 font-semibold text-ink font-ko">오늘 픽업</h1>
              {!isLoading && (
                <p className="text-body text-ink-sub mt-1">
                  총 <span className="font-semibold text-ink font-num">{total}</span>건
                  {doneCount > 0 && (
                    <> · 완료 <span className="font-semibold text-success font-num">{doneCount}</span>건</>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* 인쇄 버튼 */}
              {total > 0 && (
                <button
                  onClick={() => window.print()}
                  className="print:hidden inline-flex items-center gap-1.5 h-9 px-3 text-[13px] rounded-md border-[0.5px] border-border text-ink-sub hover:bg-muted transition-colors"
                >
                  <svg viewBox="0 0 16 16" width="14" height="14">
                    <path d="M4 6V2h8v4M4 11H2V6h12v5h-2M4 9h8v5H4V9z"
                      stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                  인쇄
                </button>
              )}
            </div>

            {/* 진행바 */}
            {total > 0 && (
              <div className="flex flex-col items-end gap-1 shrink-0 print:hidden">
                <span className="text-[11px] text-ink-muted font-num">
                  {doneCount} / {total}
                </span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </header>

          {/* 목록 */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-[120px] rounded-xl"/>)}
            </div>
          ) : total === 0 ? (
            <EmptyToday />
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <PickupCard
                  key={order.id}
                  order={order}
                  onDone={() => statusMutation.mutate({ id: order.id, status: 'done' })}
                  onUndo={() => statusMutation.mutate({ id: order.id, status: 'confirmed' })}
                  loading={statusMutation.isPending}
                />
              ))}
            </div>
          )}

        </div>
      </main>
    </AppLayout>
  );
}

// ── 픽업 카드 ─────────────────────────────────────────────────────────────

function PickupCard({ order: o, onDone, onUndo, loading }: {
  order: Reservation;
  onDone: () => void;
  onUndo: () => void;
  loading: boolean;
}) {
  const isDone      = o.status === 'done';
  const isCancelled = o.status === 'cancelled';

  return (
    <article className={`
      bg-bg border-[0.5px] rounded-xl p-4
      transition-[opacity,border-color] duration-200
      ${isDone      ? 'border-success/30 opacity-60'
        : isCancelled ? 'border-border opacity-40'
        : 'border-border hover:border-border-strong hover:shadow-sm'}
    `}>
      <div className="flex items-start gap-4">

        {/* 픽업 시간 */}
        <div className="shrink-0 text-center w-14">
          <div className="text-[20px] font-bold text-ink font-num leading-none">
            {o.pickupTime ?? '—'}
          </div>
          <div className="text-[10px] text-ink-muted mt-0.5">픽업</div>
        </div>

        {/* 세로 구분선 */}
        <div className={`w-px self-stretch rounded-full ${isDone ? 'bg-success/40' : 'bg-border'}`} />

        {/* 주문 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-[15px] font-semibold text-ink">{o.customerName}</span>
              {o.customerPhone && (
                <span className="text-[12px] text-ink-muted font-num ml-2">{o.customerPhone}</span>
              )}
            </div>
            <StatusBadge status={o.status} size="sm" />
          </div>

          {/* 케이크 정보 */}
          <div className="text-[13px] text-ink-sub">
            {[o.cakeFlavor, o.cakeSize].filter(Boolean).join(' · ') || '케이크 정보 없음'}
          </div>

          {/* 레터링 */}
          {o.lettering && (
            <div className="text-[12px] text-ink-muted mt-0.5">
              레터링: <span className="text-ink">"{o.lettering}"</span>
            </div>
          )}

          {/* 요청사항 */}
          {o.designNote && (
            <div className="mt-1 text-[11px] bg-status-inquiry-bg text-status-inquiry-fg px-2 py-1 rounded-md inline-block">
              {o.designNote.length > 40 ? o.designNote.slice(0, 40) + '…' : o.designNote}
            </div>
          )}

          {/* 금액 + 입금 + 액션 */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t-[0.5px] border-border">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-ink font-num">
                {o.price > 0 ? `₩${o.price.toLocaleString()}` : '금액 미정'}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                o.depositPaid
                  ? 'bg-status-confirmed-bg text-status-confirmed-fg'
                  : 'bg-status-inquiry-bg text-status-inquiry-fg'
              }`}>
                {o.depositPaid ? '입금 완료' : '미입금'}
              </span>
            </div>

            {/* 체크인 / 되돌리기 버튼 */}
            {!isCancelled && (
              isDone ? (
                <button
                  onClick={onUndo}
                  disabled={loading}
                  className="h-8 px-3 text-[12px] font-medium rounded-lg border-[0.5px] border-border text-ink-muted hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  되돌리기
                </button>
              ) : (
                <button
                  onClick={onDone}
                  disabled={loading}
                  className="h-8 px-4 text-[12px] font-semibold rounded-lg bg-success text-bg hover:brightness-95 disabled:opacity-40 transition-[filter] flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 14 14" width="12" height="12">
                    <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  픽업 완료
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── 빈 상태 ──────────────────────────────────────────────────────────────

function EmptyToday() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <svg viewBox="0 0 64 64" width="52" height="52" className="opacity-25">
        <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" fill="none" strokeWidth="2"/>
        <path d="M8 22h48M20 12v10M44 12v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 36l6 6 18-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <p className="text-body font-medium text-ink">오늘 픽업 예약이 없어요</p>
      <p className="text-caption text-ink-muted">여유로운 하루 되세요 ☕</p>
    </div>
  );
}
