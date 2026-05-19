import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import toast from 'react-hot-toast';
import { reservationApi } from '../api/reservation';
import type { Reservation, ReservationStatus } from '../api/reservation';
import AppLayout from '../components/AppLayout';
import StatCard, { calcDelta } from '../components/dashboard/StatCard';
import ReservationCard from '../components/reservation/ReservationCard';
import ReservationDetailModal from '../components/reservation/ReservationDetailModal';
import ReservationFormModal from '../components/reservation/ReservationFormModal';

dayjs.locale('ko');

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [detailModal, setDetailModal] = useState<Reservation | null>(null);
  const [formModal, setFormModal]     = useState<{ mode: 'create' | 'edit'; reservation?: Reservation } | null>(null);

  // ── 통계 ──
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => reservationApi.dashboardStats(),
    staleTime: 1000 * 60,  // 1분 캐시
  });

  // ── 최근 예약 5건 ──
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => reservationApi.list({ perPage: 5 }),
    staleTime: 1000 * 30,
  });

  // ── 상태 변경 ──
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) =>
      reservationApi.updateStatus(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard-recent'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
      if (detailModal?.id === updated.id) setDetailModal(updated);
      toast.success('상태가 변경되었습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── 예약 삭제 ──
  const deleteMutation = useMutation({
    mutationFn: (id: number) => reservationApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard-recent'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
      setDetailModal(null);
      toast.success('예약이 삭제됐습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── 입금 변경 ──
  const depositMutation = useMutation({
    mutationFn: ({ id, paid }: { id: number; paid: boolean }) =>
      reservationApi.updateDeposit(id, paid),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['dashboard-recent'] });
      if (detailModal?.id === updated.id) setDetailModal(updated);
      toast.success(updated.depositPaid ? '입금 완료로 변경됐습니다.' : '미입금으로 변경됐습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const recentItems = recentData?.items ?? [];

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-14 xl:pb-0">
        <div className="max-w-[1280px] mx-auto px-5 xl:px-10 py-8">

          {/* ── 헤더 ── */}
          <header className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="text-caption text-ink-muted mb-1">
                {dayjs().format('YYYY년 MM월 DD일 · dddd')}
              </div>
              <h1 className="text-h1 font-semibold text-ink font-ko">대시보드</h1>
              {stats?.todayCount != null && (
                <p className="text-body text-ink-sub mt-1">
                  오늘 픽업 <strong className="text-ink">{stats.todayCount}</strong>건
                  {stats.todayPickupTimes.length > 0 && ` · ${stats.todayPickupTimes.slice(0, 3).join(' · ')}`}
                </p>
              )}
            </div>

            {/* 빠른 액션 */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setFormModal({ mode: 'create' })}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 text-[13px] rounded-md font-medium border-[0.5px] border-border-strong text-ink-sub hover:bg-muted transition-colors"
              >
                <svg viewBox="0 0 16 16" width="13" height="13">
                  <path d="M8 1.5v13M1.5 8h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                예약 등록
              </button>
              <button
                onClick={() => navigate('/extract')}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] rounded-md font-medium font-ko bg-primary text-bg hover:bg-primary-dark transition-colors"
              >
                <svg viewBox="0 0 16 16" width="13" height="13">
                  <path d="M8 1.5l1.4 3.6L13 6.5l-3.6 1.4L8 11.5 6.6 7.9 3 6.5l3.6-1.4L8 1.5zM12.5 11l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8L10 13.5l1.8-.7.7-1.8z"
                    fill="currentColor" />
                </svg>
                AI 추출
              </button>
            </div>
          </header>

          {/* ── 통계 카드 4개 ── */}
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="이번 달 예약"
              value={stats?.monthlyCount ?? 0}
              unit="건"
              icon={<CalendarIcon />}
              delta={stats ? calcDelta(stats.monthlyCount, stats.monthlyCountPrev) : undefined}
              loading={statsLoading}
            />
            <StatCard
              label="이번 달 매출"
              value={stats ? `₩${stats.monthlyRevenue.toLocaleString()}` : '—'}
              icon={<RevenueIcon />}
              delta={stats ? calcDelta(stats.monthlyRevenue, stats.monthlyRevenuePrev) : undefined}
              deltaLabel="전월 대비"
              loading={statsLoading}
            />
            <StatCard
              label="대기중인 예약"
              value={stats?.pendingCount ?? 0}
              unit="건"
              sub="문의 + 확정"
              icon={<PendingIcon />}
              accent={stats && stats.pendingCount > 0 ? 'warning' : undefined}
              loading={statsLoading}
            />
            <StatCard
              label="오늘 픽업"
              value={stats?.todayCount ?? 0}
              unit="건"
              sub={
                stats?.todayPickupTimes.length
                  ? stats.todayPickupTimes.slice(0, 3).join(' · ')
                  : '픽업 없음'
              }
              icon={<TodayIcon />}
              accent={stats && stats.todayCount > 0 ? 'success' : undefined}
              loading={statsLoading}
            />
          </section>

          {/* ── 최근 예약 5건 ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h3 font-semibold text-ink">최근 예약</h2>
              <button
                onClick={() => navigate('/reservations')}
                className="text-[13px] text-primary hover:text-primary-dark transition-colors"
              >
                전체 보기 →
              </button>
            </div>

            {recentLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-[110px] rounded-lg" />)}
              </div>
            ) : recentItems.length === 0 ? (
              <EmptyRecent onExtract={() => navigate('/extract')} />
            ) : (
              <div className="flex flex-col gap-3">
                {recentItems.map((r) => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    onStatusChange={(s) => statusMutation.mutate({ id: r.id, status: s })}
                    onClick={() => setDetailModal(r)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── 모바일 전용 빠른 액션 ── */}
          <div className="sm:hidden mt-6 grid grid-cols-2 gap-3">
            <QuickAction
              label="예약 등록"
              desc="직접 예약 추가"
              icon={<svg viewBox="0 0 20 20" width="18" height="18"><path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
              onClick={() => setFormModal({ mode: 'create' })}
            />
            <QuickAction
              label="AI 주문 추출"
              desc="채팅에서 자동 파싱"
              icon={<svg viewBox="0 0 20 20" width="18" height="18"><path d="M10 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="currentColor"/></svg>}
              onClick={() => navigate('/extract')}
              primary
            />
          </div>

        </div>
      </main>

      {/* ── 예약 상세 모달 ── */}
      <ReservationDetailModal
        reservation={detailModal}
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        onDepositChange={(id, paid) => depositMutation.mutate({ id, paid })}
        onEdit={() => {
          if (!detailModal) return;
          setFormModal({ mode: 'edit', reservation: detailModal });
          setDetailModal(null);
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
          if (formModal?.mode === 'edit') setDetailModal(saved);
        }}
      />
    </AppLayout>
  );
}

// ── 아이콘 ────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.4" />
      <path d="M2 6h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16">
      <path d="M2 11l3-3 3 3 5-6" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16">
      <circle cx="8" cy="8" r="6" stroke="currentColor" fill="none" strokeWidth="1.4" />
      <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TodayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16">
      <rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.4" />
      <path d="M5 2v4M11 2v4M2 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="5" y="9" width="2" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────

function QuickAction({ label, desc, icon, onClick, primary }: {
  label: string; desc: string; icon: React.ReactNode;
  onClick: () => void; primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border-[0.5px] text-left transition-colors ${
        primary
          ? 'bg-primary text-bg border-primary hover:bg-primary-dark'
          : 'bg-bg border-border text-ink hover:bg-surface'
      }`}
    >
      <span className={primary ? 'text-bg/80' : 'text-ink-muted'}>{icon}</span>
      <div>
        <div className="text-[13px] font-semibold">{label}</div>
        <div className={`text-[11px] mt-0.5 ${primary ? 'text-bg/70' : 'text-ink-muted'}`}>{desc}</div>
      </div>
    </button>
  );
}

function EmptyRecent({ onExtract }: { onExtract: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center bg-surface rounded-xl border-[0.5px] border-border">
      <svg viewBox="0 0 120 80" width="100" height="66">
        <ellipse cx="60" cy="68" rx="36" ry="4" fill="#F2C4B0" opacity=".4" />
        <ellipse cx="60" cy="64" rx="38" ry="5" fill="#E8D5CC" />
        <path d="M22 60 C22 52, 30 48, 60 48 C90 48, 98 52, 98 60 L98 64 L22 64 Z" fill="#F2C4B0" />
        <rect x="32" y="36" width="56" height="16" rx="2" fill="#C8917A" />
        <path d="M32 38 Q37 34 42 38 Q47 34 52 38 Q57 34 62 38 Q67 34 72 38 Q77 34 82 38 Q87 34 88 38 L88 42 L32 42 Z" fill="#F2C4B0" />
      </svg>
      <div>
        <p className="text-[14px] font-medium text-ink">아직 예약이 없어요</p>
        <p className="text-caption text-ink-muted mt-1">AI로 채팅을 분석해 첫 예약을 만들어보세요.</p>
      </div>
      <button
        onClick={onExtract}
        className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] rounded-md font-medium bg-primary text-bg hover:bg-primary-dark transition-colors"
      >
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path d="M8 1.5l1.4 3.6L13 6.5l-3.6 1.4L8 11.5 6.6 7.9 3 6.5l3.6-1.4L8 1.5z" fill="currentColor" />
        </svg>
        AI로 주문 추출
      </button>
    </div>
  );
}
