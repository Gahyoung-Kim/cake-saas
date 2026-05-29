import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import toast from 'react-hot-toast';
import { reservationApi } from '../api/reservation';
import type { Reservation, ReservationStatus } from '../api/reservation';
import AppLayout from '../components/AppLayout';
import CalendarGrid from '../components/calendar/CalendarGrid';
import ReservationDetailModal from '../components/reservation/ReservationDetailModal';
import ReservationFormModal from '../components/reservation/ReservationFormModal';

dayjs.locale('ko');

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

// ── 범례 도트 색상 정의 ─────────────────────────────────────────────────────

const LEGEND = [
  { label: '확정',   color: '#3F7A52' },
  { label: '제작중', color: '#46668C' },
  { label: '문의',   color: '#8A6A1F' },
  { label: '완료',   color: '#C9A227' },
  { label: '취소',   color: '#9F4A44' },
];

// ── Component ─────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const qc = useQueryClient();

  const [current,      setCurrent]      = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailModal,  setDetailModal]  = useState<Reservation | null>(null);
  const [formModal,    setFormModal]    = useState<{ pickupDate: string } | null>(null);

  // ── 캘린더 데이터 ──
  const { data: calData, isLoading: calLoading } = useQuery({
    queryKey: ['calendar-v2', current.year(), current.month() + 1],
    queryFn: () => reservationApi.calendar(current.year(), current.month() + 1),
  });

  // ── 선택 날짜의 예약 목록 ──
  const { data: dayOrders, isLoading: dayLoading } = useQuery({
    queryKey: ['reservations-by-date', selectedDate],
    queryFn: () => reservationApi.list({ date: selectedDate! }),
    enabled: !!selectedDate,
  });

  // ── 상태 변경 ──
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) =>
      reservationApi.updateStatus(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['calendar-v2'] });
      qc.invalidateQueries({ queryKey: ['reservations-by-date', selectedDate] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
      if (detailModal?.id === updated.id) setDetailModal(updated);
      toast.success('상태가 변경되었습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── 입금 변경 ──
  const depositMutation = useMutation({
    mutationFn: ({ id, paid }: { id: number; paid: boolean }) =>
      reservationApi.updateDeposit(id, paid),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['reservations-by-date', selectedDate] });
      if (detailModal?.id === updated.id) setDetailModal(updated);
      toast.success(updated.depositPaid ? '입금 완료로 변경됐습니다.' : '미입금으로 변경됐습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDateClick(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  const selectedDayjs  = selectedDate ? dayjs(selectedDate) : null;
  const selectedDayInfo = calData?.find((d) => d.date === selectedDate);
  const panelOpen = !!selectedDate;

  return (
    <AppLayout>
      <div className="flex flex-1 overflow-hidden">

        {/* ── 캘린더 메인 ── */}
        <main className="flex-1 overflow-y-auto pb-14 xl:pb-0">
          <div className="max-w-[960px] mx-auto px-4 xl:px-10 py-8">

            {/* 헤더 */}
            <header className="mb-6">
              <h1 className="text-h1 font-semibold text-ink font-ko">픽업 캘린더</h1>
              <p className="text-body text-ink-sub mt-1">
                날짜를 클릭하면 해당 날의 예약을 확인할 수 있어요.
              </p>
            </header>

            {/* 월 이동 */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2 font-semibold text-ink font-ko">
                {current.format('YYYY년 M월')}
              </h2>
              <div className="flex items-center gap-1.5">
                <NavBtn onClick={() => setCurrent((c) => c.subtract(1, 'month'))}>‹</NavBtn>
                <button
                  onClick={() => { setCurrent(dayjs()); setSelectedDate(null); }}
                  className="h-8 px-3 text-[12px] font-medium rounded-md border-[0.5px] border-border hover:bg-muted text-ink-sub transition-colors"
                >
                  오늘
                </button>
                <NavBtn onClick={() => setCurrent((c) => c.add(1, 'month'))}>›</NavBtn>
              </div>
            </div>

            {/* 캘린더 그리드 */}
            {calLoading ? (
              <div className="skeleton h-[360px] md:h-[540px] rounded-xl" />
            ) : (
              <CalendarGrid
                year={current.year()}
                month={current.month() + 1}
                days={calData ?? []}
                selectedDate={selectedDate}
                onSelectDate={handleDateClick}
              />
            )}

            {/* 범례 */}
            <div className="flex items-center gap-3 mt-4 text-caption text-ink-muted flex-wrap">
              {LEGEND.map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
              <span className="flex items-center gap-1">
                <span className="w-[14px] h-[14px] rounded-full bg-primary text-bg flex items-center justify-center text-[8px] font-bold">•</span>
                오늘
              </span>
            </div>
          </div>
        </main>

        {/* ── 사이드 패널 ── */}
        <AnimatePresence>
          {panelOpen && (
            <>
              {/* 모바일 백드롭 */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="xl:hidden fixed inset-0 bg-ink/20 z-10"
                onClick={() => setSelectedDate(null)}
              />

              {/* 패널 */}
              <motion.aside
                key="panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.32, ease: EASE }}
                className="fixed xl:relative right-0 top-0 bottom-0 z-20 w-[88vw] max-w-[380px] xl:w-[380px] xl:max-w-none bg-bg border-l-[0.5px] border-border flex flex-col shadow-lg xl:shadow-none overflow-hidden"
              >
                {/* 패널 헤더 */}
                <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b-[0.5px] border-border sticky top-0 bg-bg z-10 shrink-0">
                  <div>
                    <h3 className="text-h3 font-semibold text-ink">
                      {selectedDayjs?.format('M월 D일 (ddd)')}
                    </h3>
                    <p className="text-caption text-ink-sub mt-0.5">
                      {selectedDayInfo
                        ? selectedDayInfo.count > 0
                          ? `픽업 예약 ${selectedDayInfo.count}건${selectedDayInfo.isOverLimit ? ' · ⚠️ 한도 초과' : ''}`
                          : '예약 없음'
                        : '로딩 중…'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* 예약 추가 단축 버튼 */}
                    {selectedDate && (
                      <button
                        onClick={() => setFormModal({ pickupDate: selectedDate })}
                        className="inline-flex items-center gap-1 h-8 px-2.5 text-[12px] font-medium rounded-md bg-primary text-bg hover:bg-primary-dark transition-colors"
                      >
                        <svg viewBox="0 0 12 12" width="10" height="10">
                          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        예약
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-ink-muted transition-colors"
                      aria-label="닫기"
                    >
                      <svg viewBox="0 0 16 16" width="14" height="14">
                        <path d="M4 4l8 8M12 4l-8 8"
                          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 패널 본문 */}
                <div className="flex-1 overflow-y-auto p-5">
                  {dayLoading ? (
                    <div className="flex flex-col gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-[90px] rounded-lg" />
                      ))}
                    </div>
                  ) : !dayOrders?.items.length ? (
                    <EmptyDay />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {dayOrders.items.map((r) => (
                        <DayReservationRow
                          key={r.id}
                          reservation={r}
                          onClick={() => setDetailModal(r)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── 예약 상세 모달 ── */}
        <ReservationDetailModal
          reservation={detailModal}
          open={!!detailModal}
          onClose={() => setDetailModal(null)}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          onDepositChange={(id, paid) => depositMutation.mutate({ id, paid })}
          isLoading={statusMutation.isPending || depositMutation.isPending}
        />

        {/* ── 날짜 클릭 → 예약 등록 단축 ── */}
        <ReservationFormModal
          mode="create"
          initialPickupDate={formModal?.pickupDate}
          open={!!formModal}
          onClose={() => setFormModal(null)}
          onSuccess={(saved) => {
            qc.invalidateQueries({ queryKey: ['calendar-v2'] });
            qc.invalidateQueries({ queryKey: ['reservations-by-date', formModal?.pickupDate] });
            toast.success(`${saved.customerName} 예약이 등록됐습니다.`);
            setFormModal(null);
          }}
        />
      </div>
    </AppLayout>
  );
}

// ── 패널 내 예약 행 ────────────────────────────────────────────────────────

import StatusBadge from '../components/reservation/StatusBadge';
import type { ReservationStatus as RS } from '../api/reservation';

function DayReservationRow({ reservation: r, onClick }: { reservation: Reservation; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-bg border-[0.5px] border-border rounded-lg p-3 hover:shadow-sm hover:border-border-strong transition-[box-shadow,border-color] duration-150 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {r.pickupTime && (
              <span className="text-[12px] font-semibold text-ink font-num shrink-0">
                {r.pickupTime}
              </span>
            )}
            <span className="text-[13px] font-medium text-ink truncate">{r.customerName}</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-0.5 truncate">
            {[r.cakeFlavor, r.cakeSize].filter(Boolean).join(' · ') || '케이크 정보 없음'}
          </div>
        </div>
        <StatusBadge status={r.status as RS} size="sm" />
      </div>

      {r.lettering && (
        <div className="text-[11px] text-ink-sub truncate">
          레터링: "{r.lettering}"
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink font-num">
          {r.price > 0 ? `₩${r.price.toLocaleString()}` : '금액 미정'}
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          r.depositPaid
            ? 'bg-status-confirmed-bg text-status-confirmed-fg'
            : 'bg-status-inquiry-bg text-status-inquiry-fg'
        }`}>
          {r.depositPaid ? '입금 완료' : '미입금'}
        </span>
      </div>
    </button>
  );
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="h-8 w-8 flex items-center justify-center rounded-md border-[0.5px] border-border hover:bg-muted text-ink-sub transition-colors text-lg leading-none"
    >
      {children}
    </button>
  );
}

function EmptyDay() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <svg viewBox="0 0 48 48" width="44" height="44" className="opacity-25">
        <rect x="8" y="10" width="32" height="30" rx="3" stroke="currentColor" fill="none" strokeWidth="2" />
        <path d="M8 18h32M16 6v8M32 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-body text-ink-muted">이 날은 예약이 없어요.</p>
    </div>
  );
}
