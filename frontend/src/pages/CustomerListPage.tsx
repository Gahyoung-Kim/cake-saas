import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { customerApi } from '../api/customer';
import type { CustomerSummary } from '../api/customer';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/reservation/StatusBadge';
import type { Reservation, ReservationStatus } from '../api/reservation';

dayjs.locale('ko');

export default function CustomerListPage() {
  const [search,     setSearch]     = useState('');
  const [query,      setQuery]      = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', query],
    queryFn:  () => customerApi.list(query || undefined),
    staleTime: 1000 * 30,
  });

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const customers = data ?? [];

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-14 xl:pb-0">
        <div className="max-w-[960px] mx-auto px-5 xl:px-10 py-8">

          {/* 헤더 */}
          <header className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-h1 font-semibold text-ink font-ko">고객 목록</h1>
              <p className="text-body text-ink-sub mt-1">
                {isLoading ? '불러오는 중…' : `총 ${customers.length.toLocaleString()}명`}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }} className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
                  viewBox="0 0 16 16" width="13" height="13">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" fill="none" strokeWidth="1.4"/>
                  <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="이름 또는 연락처"
                  className="pl-8 pr-3 h-9 w-48 bg-bg border-[0.5px] border-border rounded-md text-[13px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] placeholder:text-ink-muted transition-[border-color,box-shadow] duration-200"
                />
              </div>
              <button type="submit"
                className="h-9 px-3 text-[13px] font-medium rounded-md border-[0.5px] border-border-strong text-ink-sub hover:bg-muted transition-colors">
                검색
              </button>
              {query && (
                <button type="button" onClick={() => { setSearch(''); setQuery(''); }}
                  className="h-9 px-3 text-[13px] text-ink-muted hover:text-ink transition-colors">
                  초기화
                </button>
              )}
            </form>
          </header>

          {/* 목록 */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-[76px] rounded-xl"/>)}
            </div>
          ) : customers.length === 0 ? (
            <EmptyState hasQuery={!!query} />
          ) : (
            <div className="flex flex-col gap-2">
              {customers.map((c) => (
                <CustomerCard
                  key={c.customerId}
                  customer={c}
                  expanded={expandedId === c.customerId}
                  onToggle={() => toggleExpand(c.customerId)}
                />
              ))}
            </div>
          )}

        </div>
      </main>
    </AppLayout>
  );
}

// ── CustomerCard ──────────────────────────────────────────────────────────

function CustomerCard({ customer: c, expanded, onToggle }: {
  customer:  CustomerSummary;
  expanded:  boolean;
  onToggle:  () => void;
}) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['customer-orders', c.customerId],
    queryFn:  () => customerApi.getOrders(c.customerId),
    enabled:  expanded,
    staleTime: 1000 * 60,
  });

  return (
    <article className="bg-bg border-[0.5px] border-border rounded-xl overflow-hidden hover:border-border-strong transition-[border-color] duration-200">

      {/* 고객 행 */}
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-surface border-[0.5px] border-border flex items-center justify-center text-[14px] font-semibold text-ink-sub shrink-0">
          {c.customerName[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-ink">{c.customerName}</span>
            {c.customerPhone && (
              <span className="text-[12px] text-ink-muted font-num">{c.customerPhone}</span>
            )}
            {c.lastStatus && (
              <StatusBadge status={c.lastStatus as ReservationStatus} size="sm" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[12px] text-ink-sub">
              총 <span className="font-semibold text-ink font-num">{c.orderCount}</span>건
            </span>
            {c.totalRevenue > 0 && (
              <span className="text-[12px] text-ink-sub font-num">₩{c.totalRevenue.toLocaleString()}</span>
            )}
            {c.lastPickupDate && (
              <span className="text-[12px] text-ink-muted">
                최근 픽업 {dayjs(c.lastPickupDate).format('YYYY.MM.DD')}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onToggle}
          className="shrink-0 h-8 px-3 text-[12px] font-medium rounded-md border-[0.5px] border-border text-ink-sub hover:bg-muted hover:text-ink transition-colors flex items-center gap-1.5"
        >
          예약 내역
          <svg
            viewBox="0 0 12 12" width="10" height="10"
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* 예약 히스토리 패널 */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="history"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t-[0.5px] border-border bg-surface/40 px-5 py-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
                </div>
              ) : !orders || orders.length === 0 ? (
                <p className="text-[13px] text-ink-muted text-center py-4">예약 내역이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {orders.map((o: Reservation) => (
                    <OrderHistoryRow key={o.id} order={o} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

// ── OrderHistoryRow ───────────────────────────────────────────────────────

function OrderHistoryRow({ order: o }: { order: Reservation }) {
  const isCancelled = o.status === 'cancelled';
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isCancelled ? 'opacity-40' : 'bg-bg'}`}>
      <div className="shrink-0">
        <StatusBadge status={o.status} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-ink font-num">
            {dayjs(o.pickupDate).format('YYYY.MM.DD')}
          </span>
          {o.pickupTime && (
            <span className="text-[12px] text-ink-muted font-num">{o.pickupTime}</span>
          )}
          {(o.cakeFlavor || o.cakeSize) && (
            <span className="text-[12px] text-ink-sub">
              {[o.cakeFlavor, o.cakeSize].filter(Boolean).join(' · ')}
            </span>
          )}
          {o.lettering && (
            <span className="text-[12px] text-ink-muted">"{o.lettering}"</span>
          )}
        </div>
      </div>
      {o.price > 0 && (
        <span className="text-[13px] font-semibold text-ink font-num shrink-0">
          ₩{o.price.toLocaleString()}
        </span>
      )}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <svg viewBox="0 0 64 64" width="52" height="52" className="opacity-25">
        <circle cx="26" cy="22" r="10" stroke="currentColor" fill="none" strokeWidth="2"/>
        <path d="M4 52c0-11 10-18 22-18s22 7 22 18" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"/>
        <path d="M44 28l10 10M44 38l10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="text-body text-ink-muted">
        {hasQuery ? '검색 결과가 없어요.' : '등록된 고객이 없어요.'}
      </p>
    </div>
  );
}
