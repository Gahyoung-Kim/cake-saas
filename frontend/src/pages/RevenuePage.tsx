import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import AppLayout from '../components/AppLayout';
import RevenueTab from '../components/revenue/RevenueTab';
import ExpenseTab from '../components/revenue/ExpenseTab';
import { revenueApi } from '../api/revenue';

dayjs.locale('ko');

type TabKey = 'revenue' | 'expense';

export default function RevenuePage() {
  const today        = dayjs();
  const [year,  setYear]  = useState(today.year());
  const [month, setMonth] = useState(today.month() + 1);
  const [tab,   setTab]   = useState<TabKey>('revenue');

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else              setMonth((m) => m - 1);
  }
  function nextMonth() {
    const now = dayjs();
    if (year > now.year() || (year === now.year() && month >= now.month() + 1)) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else               setMonth((m) => m + 1);
  }

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['revenue', year, month],
    queryFn:  () => revenueApi.getSummary(year, month),
    staleTime: 1000 * 60,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', year, month],
    queryFn:  () => revenueApi.listExpenses(year, month),
    staleTime: 1000 * 60,
  });

  const isCurrentMonth = year === today.year() && month === today.month() + 1;

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen pb-safe">

        {/* ── 헤더 ── */}
        <div className="sticky top-0 z-10 bg-bg border-b-[0.5px] border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-[16px] font-semibold text-ink">매출 · 지출</h1>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-ink-muted transition-colors">
              <svg viewBox="0 0 16 16" width="14" height="14"><path d="M10 4l-4 4 4 4" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="text-[14px] font-semibold text-ink font-num w-24 text-center">
              {year}년 {month}월
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-ink-muted disabled:opacity-30 transition-colors">
              <svg viewBox="0 0 16 16" width="14" height="14"><path d="M6 4l4 4-4 4" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* ── 요약 카드 ── */}
        <div className="grid grid-cols-3 gap-3 p-4">
          <SummaryCard
            label="이번달 매출"
            value={summary?.revenueTotal ?? 0}
            color="text-primary"
            loading={summaryLoading}
          />
          <SummaryCard
            label="지출 합계"
            value={(summary?.expenseTotal ?? 0) + (summary?.costTotal ?? 0)}
            color="text-ink"
            loading={summaryLoading}
          />
          <SummaryCard
            label="순수익"
            value={summary?.netProfit ?? 0}
            color={(summary?.netProfit ?? 0) >= 0 ? 'text-green-600' : 'text-danger'}
            loading={summaryLoading}
          />
        </div>

        {/* ── 부가 정보 ── */}
        {summary && (
          <div className="flex gap-4 px-4 pb-3 text-[12px] text-ink-muted">
            <span>확정 주문 <span className="text-ink font-medium font-num">{summary.confirmedCount}건</span></span>
            {summary.unpaidCount > 0 && (
              <span className="text-status-inquiry-fg">미입금 <span className="font-medium font-num">{summary.unpaidCount}건</span></span>
            )}
          </div>
        )}

        {/* ── 탭 ── */}
        <div className="flex border-b-[0.5px] border-border px-4">
          {([['revenue', '매출 내역'], ['expense', '지출 내역']] as [TabKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 탭 콘텐츠 ── */}
        <div className="flex-1 bg-bg">
          {(summaryLoading || expensesLoading) ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : tab === 'revenue' ? (
            <RevenueTab
              daily={summary?.daily ?? []}
              revenueTotal={summary?.revenueTotal ?? 0}
              costTotal={summary?.costTotal ?? 0}
            />
          ) : (
            <ExpenseTab
              expenses={expenses}
              expenseTotal={summary?.expenseTotal ?? 0}
              year={year}
              month={month}
            />
          )}
        </div>

      </div>
    </AppLayout>
  );
}

// ── 요약 카드 컴포넌트 ────────────────────────────────────────────────────

function SummaryCard({ label, value, color, loading }: {
  label:   string;
  value:   number;
  color:   string;
  loading: boolean;
}) {
  return (
    <div className="bg-surface rounded-xl p-3 flex flex-col gap-1">
      <span className="text-[10px] font-medium text-ink-muted leading-tight">{label}</span>
      {loading ? (
        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
      ) : (
        <span className={`text-[15px] font-bold font-num leading-tight ${color}`}>
          ₩{value.toLocaleString()}
        </span>
      )}
    </div>
  );
}
