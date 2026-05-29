import { apiFetch } from './client';

export interface RevenueDay {
  date: string;
  revenue: number;
  cost: number;
  orderCount: number;
}

export interface RevenueSummary {
  revenueTotal:   number;
  costTotal:      number;
  expenseTotal:   number;
  netProfit:      number;
  confirmedCount: number;
  unpaidCount:    number;
  daily:          RevenueDay[];
}

export interface Expense {
  id:          number;
  category:    string;
  amount:      number;
  memo:        string | null;
  expenseDate: string;
  createdAt:   string;
}

export type ExpenseCategory = '임대료' | '전기세' | '재료비' | '포장재' | '기타';
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['임대료', '전기세', '재료비', '포장재', '기타'];

export interface ExpenseFormData {
  category:    ExpenseCategory;
  amount:      number;
  memo:        string;
  expenseDate: string;
}

export const revenueApi = {
  getSummary(year: number, month: number): Promise<RevenueSummary> {
    return apiFetch<RevenueSummary>(`/api/revenue?year=${year}&month=${month}`);
  },

  listExpenses(year: number, month: number): Promise<Expense[]> {
    return apiFetch<Expense[]>(`/api/expenses?year=${year}&month=${month}`);
  },

  createExpense(data: ExpenseFormData): Promise<Expense> {
    return apiFetch<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateExpense(id: number, data: Partial<ExpenseFormData>): Promise<Expense> {
    return apiFetch<Expense>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteExpense(id: number): Promise<void> {
    return apiFetch<void>(`/api/expenses/${id}`, { method: 'DELETE' });
  },
};
