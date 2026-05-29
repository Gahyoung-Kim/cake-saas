import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Expense, ExpenseFormData } from '../../api/revenue';
import { revenueApi } from '../../api/revenue';
import ExpenseFormModal from './ExpenseFormModal';

const CATEGORY_COLOR: Record<string, string> = {
  '임대료': 'bg-blue-50 text-blue-700',
  '전기세': 'bg-yellow-50 text-yellow-700',
  '재료비': 'bg-green-50 text-green-700',
  '포장재': 'bg-purple-50 text-purple-700',
  '기타':   'bg-surface text-ink-sub',
};

interface Props {
  expenses:     Expense[];
  expenseTotal: number;
  year:         number;
  month:        number;
}

export default function ExpenseTab({ expenses, expenseTotal, year, month }: Props) {
  const qc = useQueryClient();
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const defaultDate = `${year}-${String(month).padStart(2, '0')}-01`;

  const saveMutation = useMutation({
    mutationFn: (data: ExpenseFormData) =>
      editTarget ? revenueApi.updateExpense(editTarget.id, data) : revenueApi.createExpense(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', year, month] });
      qc.invalidateQueries({ queryKey: ['revenue', year, month] });
      toast.success(editTarget ? '수정됐습니다.' : '지출이 추가됐습니다.');
      setModalOpen(false);
      setEditTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => revenueApi.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', year, month] });
      qc.invalidateQueries({ queryKey: ['revenue', year, month] });
      toast.success('삭제됐습니다.');
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleEdit(e: Expense) { setEditTarget(e); setModalOpen(true); }
  function handleAdd()            { setEditTarget(null); setModalOpen(true); }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b-[0.5px] border-border">
        <span className="text-[13px] text-ink-sub">
          총 지출 <span className="font-semibold text-ink font-num">₩{expenseTotal.toLocaleString()}</span>
        </span>
        <button onClick={handleAdd} className="h-8 px-3 rounded-md text-[12px] font-medium bg-primary text-bg hover:bg-primary-dark transition-colors flex items-center gap-1.5">
          <svg viewBox="0 0 14 14" width="12" height="12"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          지출 추가
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
          <p className="text-[13px]">이번 달 지출 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {expenses.map((e) => {
            const [, m, d] = e.expenseDate.split('-');
            return (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b-[0.5px] border-border hover:bg-surface/50 transition-colors">
                <span className="text-[12px] text-ink-muted font-num w-10 shrink-0">{m}/{d}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${CATEGORY_COLOR[e.category] ?? 'bg-surface text-ink-sub'}`}>
                  {e.category}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-ink font-num">₩{e.amount.toLocaleString()}</span>
                  {e.memo && <span className="text-[11px] text-ink-muted ml-2">{e.memo}</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(e)} className="w-7 h-7 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-muted transition-colors">
                    <svg viewBox="0 0 14 14" width="12" height="12"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                  </button>
                  {deleteTarget === e.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => setDeleteTarget(null)} className="h-7 px-2 text-[11px] rounded-md border-[0.5px] border-border text-ink-sub hover:bg-muted">취소</button>
                      <button onClick={() => deleteMutation.mutate(e.id)} disabled={deleteMutation.isPending} className="h-7 px-2 text-[11px] rounded-md bg-danger text-bg disabled:opacity-40">삭제</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteTarget(e.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-ink-muted hover:text-danger hover:bg-status-cancel-bg transition-colors">
                      <svg viewBox="0 0 14 14" width="12" height="12"><path d="M2.5 3.5h9M5 3.5V2h4v1.5M4 3.5v8h6v-8" stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ExpenseFormModal
        open={modalOpen}
        expense={editTarget}
        defaultDate={defaultDate}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={(data) => saveMutation.mutate(data)}
        isPending={saveMutation.isPending}
      />
    </>
  );
}
