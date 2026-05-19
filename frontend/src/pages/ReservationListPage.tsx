import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import toast from 'react-hot-toast';
import { reservationApi } from '../api/reservation';
import type { Reservation, ReservationStatus } from '../api/reservation';
import AppLayout from '../components/AppLayout';
import StatusBadge, { STATUS_CONFIG } from '../components/reservation/StatusBadge';
import ReservationCard from '../components/reservation/ReservationCard';
import ReservationDetailModal from '../components/reservation/ReservationDetailModal';
import ReservationFormModal from '../components/reservation/ReservationFormModal';

dayjs.locale('ko');

// ── 상수 ─────────────────────────────────────────────────────────────────

const PER_PAGE = 20;

const TABS: { value: ReservationStatus | 'all'; label: string }[] = [
  { value: 'all',       label: '전체'   },
  { value: 'inquiry',   label: '문의'   },
  { value: 'confirmed', label: '확정'   },
  { value: 'making',    label: '제작중' },
  { value: 'done',      label: '완료'   },
  { value: 'cancelled', label: '취소'   },
];

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

export default function ReservationListPage() {
  const qc = useQueryClient();

  const [tab,    setTab]    = useState<ReservationStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);

  // 탭 변경 시 페이지 리셋
  function handleTabChange(t: ReservationStatus | 'all') {
    setTab(t);
    setPage(1);
  }

  // 검색 변경 시 페이지 리셋
  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  const queryKey = ['reservations', tab, search, page] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      reservationApi.list({
        status:  tab === 'all' ? undefined : tab,
        search:  search.trim() || undefined,
        page,
        perPage: PER_PAGE,
      }),
    placeholderData: (prev) => prev,
  });

  // ── 상세 모달 상태 ──
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const modalOpen = selectedReservation !== null;
  function closeModal() { setSelectedReservation(null); }

  // ── 등록/수정 폼 모달 상태 ──
  const [formModal, setFormModal] = useState<{ mode: 'create' | 'edit'; reservation?: Reservation } | null>(null);

  // ── 상태 변경 (목록 인라인 + 모달) ──
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) =>
      reservationApi.updateStatus(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      // 모달이 열린 예약이면 로컬 상태도 갱신
      if (selectedReservation?.id === updated.id) {
        setSelectedReservation(updated);
      }
      toast.success('상태가 변경되었습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── 예약 삭제 ──
  const deleteMutation = useMutation({
    mutationFn: (id: number) => reservationApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard-recent'] });
      qc.invalidateQueries({ queryKey: ['calendar-v2'] });
      setSelectedReservation(null);
      toast.success('예약이 삭제됐습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── 입금 변경 (모달) ──
  const depositMutation = useMutation({
    mutationFn: ({ id, paid }: { id: number; paid: boolean }) =>
      reservationApi.updateDeposit(id, paid),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      if (selectedReservation?.id === updated.id) {
        setSelectedReservation(updated);
      }
      toast.success(updated.depositPaid ? '입금 완료로 변경됐습니다.' : '미입금으로 변경됐습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSelect = useCallback((r: Reservation) => {
    setSelectedReservation(r);
  }, []);

  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const items      = data?.items ?? [];

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-14 xl:pb-0">
        <div className="max-w-[1280px] mx-auto px-5 xl:px-10 py-9">

          {/* ── Header ── */}
          <header className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-h1 font-semibold text-ink font-ko">예약 목록</h1>
              <p className="text-body text-ink-sub mt-1">
                총 <span className="font-num font-semibold text-ink">{total.toLocaleString()}</span>건
                {tab !== 'all' && ` · ${STATUS_CONFIG[tab].label}`}
                {search && ` · "${search}" 검색 결과`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* 예약 등록 버튼 */}
              <button
                onClick={() => setFormModal({ mode: 'create' })}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] rounded-md font-medium bg-primary text-bg hover:bg-primary-dark transition-colors"
              >
                <svg viewBox="0 0 14 14" width="12" height="12">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                예약 등록
              </button>
            </div>

            {/* 검색 */}
            <div className="relative shrink-0 w-full max-w-xs hidden sm:block">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
                viewBox="0 0 16 16" width="14" height="14"
              >
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" fill="none" strokeWidth="1.4" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="고객명 또는 케이크 검색"
                className="w-full pl-9 pr-3 h-9 bg-bg border-[0.5px] border-border rounded-md text-[13px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] placeholder:text-ink-muted transition-[border-color,box-shadow] duration-200"
              />
            </div>
          </header>

          {/* 모바일 검색 */}
          <div className="sm:hidden mb-4 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              viewBox="0 0 16 16" width="14" height="14"
            >
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" fill="none" strokeWidth="1.4" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="고객명 또는 케이크 검색"
              className="w-full pl-9 pr-3 h-9 bg-bg border-[0.5px] border-border rounded-md text-[13px] text-ink outline-none focus:border-primary placeholder:text-ink-muted"
            />
          </div>

          {/* ── Filter tabs ── */}
          <div className="flex gap-1 border-b-[0.5px] border-border pb-0 mb-0 overflow-x-auto">
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleTabChange(value)}
                className={`
                  shrink-0 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors duration-150
                  ${tab === value
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink-sub'}
                `}
              >
                {label}
                {value === tab && total > 0 && (
                  <span className="ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-primary text-bg leading-none">
                    {total}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : items.length === 0 ? (
              <EmptyState tab={tab} search={search} />
            ) : (
              <>
                {/* ── Desktop Table ── */}
                <div className="hidden md:block">
                  <TableHeader />
                  <div className="flex flex-col divide-y-[0.5px] divide-border border-[0.5px] border-border rounded-xl overflow-hidden">
                    {items.map((r) => (
                      <TableRow
                        key={r.id}
                        reservation={r}
                        onStatusChange={(s) => statusMutation.mutate({ id: r.id, status: s })}
                        onClick={() => handleSelect(r)}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Mobile Cards ── */}
                <div className="md:hidden flex flex-col gap-3">
                  {items.map((r) => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      onStatusChange={(s) => statusMutation.mutate({ id: r.id, status: s })}
                      onClick={() => handleSelect(r)}
                    />
                  ))}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── 예약 상세 모달 ── */}
      <ReservationDetailModal
        reservation={selectedReservation}
        open={modalOpen}
        onClose={closeModal}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        onDepositChange={(id, paid) => depositMutation.mutate({ id, paid })}
        onEdit={() => {
          if (!selectedReservation) return;
          setFormModal({ mode: 'edit', reservation: selectedReservation });
          closeModal();
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        isLoading={statusMutation.isPending || depositMutation.isPending || deleteMutation.isPending}
      />

      {/* ── 등록/수정 폼 모달 ── */}
      <ReservationFormModal
        mode={formModal?.mode ?? 'create'}
        reservation={formModal?.reservation}
        open={formModal !== null}
        onClose={() => setFormModal(null)}
        onSuccess={(saved) => {
          // edit 모드: 저장 후 상세 모달 다시 열기
          if (formModal?.mode === 'edit') setSelectedReservation(saved);
        }}
      />
    </AppLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1.1fr)_minmax(0,1.8fr)_140px_120px_36px] gap-4 px-4 py-2.5 bg-surface border-[0.5px] border-border rounded-t-xl text-[11px] font-semibold text-ink-muted uppercase tracking-wide">
      <div>픽업일</div>
      <div>고객</div>
      <div>케이크</div>
      <div>금액 · 입금</div>
      <div>상태</div>
      <div />
    </div>
  );
}

interface RowProps {
  reservation: Reservation;
  onStatusChange: (s: ReservationStatus) => void;
  onClick: () => void;
}

function TableRow({ reservation: r, onStatusChange, onClick }: RowProps) {
  const pickup = dayjs(r.pickupDate);
  const isToday = r.pickupDate === dayjs().format('YYYY-MM-DD');
  const isDone = r.status === 'done' || r.status === 'cancelled';

  return (
    <div
      className={`
        grid grid-cols-[96px_minmax(0,1.1fr)_minmax(0,1.8fr)_140px_120px_36px]
        gap-4 px-4 py-3.5 items-center
        hover:bg-surface transition-colors duration-150 cursor-pointer
        ${isDone ? 'opacity-55' : ''}
      `}
      onClick={onClick}
      role="row"
    >
      {/* 픽업일 */}
      <div>
        <div className="flex items-center gap-1.5">
          {isToday && (
            <span className="text-[9px] font-bold px-[5px] py-[2px] rounded-full bg-primary text-bg leading-none">
              오늘
            </span>
          )}
          <span className="text-[13px] font-semibold text-ink font-num">
            {pickup.format('MM.DD')}
          </span>
        </div>
        <div className="text-[11px] text-ink-muted font-num mt-0.5">
          {pickup.format('ddd')}{r.pickupTime && ` · ${r.pickupTime}`}
        </div>
      </div>

      {/* 고객 */}
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">{r.customerName}</div>
        {r.customerPhone && (
          <div className="text-[11px] text-ink-muted font-num mt-0.5 truncate">{r.customerPhone}</div>
        )}
      </div>

      {/* 케이크 */}
      <div className="min-w-0 flex items-start gap-2">
        {r.designImage && (
          <img
            src={r.designImage}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 object-cover rounded-md border-[0.5px] border-border shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-ink truncate">
            {[r.cakeFlavor, r.cakeSize].filter(Boolean).join(' · ') || '—'}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {r.lettering && (
              <span className="text-[11px] px-1.5 py-px rounded-sm bg-muted text-ink-sub truncate max-w-[160px]">
                "{r.lettering}"
              </span>
            )}
            {r.designNote && (
              <span className="text-[11px] px-1.5 py-px rounded-sm bg-status-inquiry-bg text-status-inquiry-fg truncate max-w-[140px]">
                {r.designNote.slice(0, 18)}{r.designNote.length > 18 && '…'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 금액·입금 */}
      <div onClick={(e) => e.stopPropagation()}>
        <div className="text-[13px] font-semibold text-ink font-num">
          {r.price > 0 ? `₩${r.price.toLocaleString()}` : '—'}
        </div>
        <span
          className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
            r.depositPaid
              ? 'bg-status-confirmed-bg text-status-confirmed-fg'
              : 'bg-status-inquiry-bg text-status-inquiry-fg'
          }`}
        >
          {r.depositPaid ? '입금 완료' : '미입금'}
        </span>
      </div>

      {/* 상태 */}
      <div
        className="flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <select
            value={r.status}
            onChange={(e) => onStatusChange(e.target.value as ReservationStatus)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          >
            {(Object.keys(STATUS_CONFIG) as ReservationStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <StatusBadge status={r.status} />
        </div>
      </div>

      {/* 더보기 */}
      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClick}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-ink-muted transition-colors"
          aria-label="상세보기"
        >
          <svg viewBox="0 0 16 16" width="14" height="14">
            <circle cx="3"  cy="8" r="1.3" fill="currentColor" />
            <circle cx="8"  cy="8" r="1.3" fill="currentColor" />
            <circle cx="13" cy="8" r="1.3" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  const pages = buildPageRange(page, totalPages);

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t-[0.5px] border-border">
      <span className="text-caption text-ink-muted">
        {page} / {totalPages} 페이지
      </span>
      <div className="flex items-center gap-1">
        <PageBtn disabled={page === 1} onClick={() => onChange(page - 1)}>‹</PageBtn>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="w-8 text-center text-ink-muted text-[13px]">…</span>
            : (
              <PageBtn
                key={p}
                active={p === page}
                onClick={() => onChange(p as number)}
              >
                {p}
              </PageBtn>
            )
        )}
        <PageBtn disabled={page === totalPages} onClick={() => onChange(page + 1)}>›</PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded-md text-[13px] font-medium transition-colors ${
        active
          ? 'bg-primary text-bg'
          : disabled
          ? 'text-ink-muted/40 cursor-not-allowed'
          : 'text-ink-sub hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton h-[72px] rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState({ tab, search }: { tab: string; search: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <svg viewBox="0 0 64 64" width="56" height="56" className="text-ink-muted opacity-30">
        <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" fill="none" strokeWidth="2" />
        <path d="M8 22h48M20 12v10M44 12v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 34h24M20 42h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-body text-ink-muted">
        {search
          ? `"${search}"에 해당하는 예약이 없어요.`
          : tab === 'all'
          ? '예약이 없어요.'
          : `${STATUS_CONFIG[tab as ReservationStatus]?.label} 상태 예약이 없어요.`}
      </p>
    </div>
  );
}
