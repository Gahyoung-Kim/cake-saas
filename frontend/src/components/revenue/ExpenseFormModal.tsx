import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Expense, ExpenseFormData, ExpenseCategory } from '../../api/revenue';
import { EXPENSE_CATEGORIES } from '../../api/revenue';

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const INPUT_CLS = 'w-full bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px] text-[13px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted';

interface Props {
  open:       boolean;
  expense?:   Expense | null;
  defaultDate: string;
  onClose:    () => void;
  onSave:     (data: ExpenseFormData) => void;
  isPending:  boolean;
}

export default function ExpenseFormModal({ open, expense, defaultDate, onClose, onSave, isPending }: Props) {
  const [form, setForm] = useState<ExpenseFormData>({
    category:    '재료비',
    amount:      0,
    memo:        '',
    expenseDate: defaultDate,
  });

  useEffect(() => {
    if (!open) return;
    setForm(expense ? {
      category:    expense.category as ExpenseCategory,
      amount:      expense.amount,
      memo:        expense.memo ?? '',
      expenseDate: expense.expenseDate,
    } : {
      category:    '재료비',
      amount:      0,
      memo:        '',
      expenseDate: defaultDate,
    });
  }, [open, expense, defaultDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) return;
    onSave(form);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="expense-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[1px] overflow-y-auto py-8 px-4"
          onClick={onClose}
        >
          <motion.div
            key="expense-panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="relative bg-bg shadow-lg rounded-xl mx-auto w-full max-w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b-[0.5px] border-border">
              <h2 className="text-[15px] font-semibold text-ink">{expense ? '지출 수정' : '지출 추가'}</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-ink-muted">
                <svg viewBox="0 0 16 16" width="14" height="14"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-ink-sub">날짜</span>
                  <input type="date" value={form.expenseDate} onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))} className={INPUT_CLS} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-ink-sub">카테고리</span>
                  <div className="relative">
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))} className={INPUT_CLS + ' appearance-none pr-8'}>
                      {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" viewBox="0 0 12 12" width="11" height="11">
                      <path d="M3 5l3 3 3-3" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-ink-sub">금액 (₩) <span className="text-danger">*</span></span>
                <input type="number" min="0" value={form.amount || ''} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} placeholder="0" className={INPUT_CLS} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-ink-sub">메모</span>
                <input type="text" value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} placeholder="선택 입력" className={INPUT_CLS} />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="flex-1 h-10 rounded-md text-[13px] font-medium text-ink-sub border-[0.5px] border-border hover:bg-muted transition-colors">취소</button>
                <button type="submit" disabled={isPending} className="flex-1 h-10 rounded-md text-[13px] font-medium bg-primary text-bg hover:bg-primary-dark disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                  {isPending && <span className="spinner" />}
                  저장
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
