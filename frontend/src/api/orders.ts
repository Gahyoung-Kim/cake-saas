import { apiFetch } from './client';
import type { Order, OrderStatus } from '../store/orderStore';

export interface OrdersQuery {
  date?: string;
  status?: OrderStatus;
  page?: number;
  perPage?: number;
}

export interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  perPage: number;
}

export interface ExtractRequest {
  chatText: string;
}

export interface ExtractResponse {
  customerName: string | null;
  pickupDate: string | null;
  pickupTime: string | null;
  cakeSize: string | null;
  cakeFlavor: string | null;
  lettering: string | null;
  designNote: string | null;
  price: number | null;
  deposit: number | null;
  confidence: number;
}

export interface CalendarDay {
  date: string;
  count: number;
  isOverLimit: boolean;
}

export const ordersApi = {
  list: (q: OrdersQuery = {}) => {
    const params = new URLSearchParams();
    if (q.date) params.set('date', q.date);
    if (q.status) params.set('status', q.status);
    if (q.page) params.set('page', String(q.page));
    if (q.perPage) params.set('per_page', String(q.perPage));
    return apiFetch<OrdersResponse>(`/api/orders?${params}`);
  },

  get: (id: number) => apiFetch<Order>(`/api/orders/${id}`),

  create: (body: Partial<Order>) =>
    apiFetch<Order>('/api/orders', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: number, body: Partial<Order>) =>
    apiFetch<Order>(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  updateStatus: (id: number, status: OrderStatus) =>
    apiFetch<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateDeposit: (id: number, depositPaid: boolean) =>
    apiFetch<Order>(`/api/orders/${id}/deposit`, {
      method: 'PATCH',
      body: JSON.stringify({ depositPaid }),
    }),

  remove: (id: number) =>
    apiFetch<void>(`/api/orders/${id}`, { method: 'DELETE' }),

  extract: (body: ExtractRequest) =>
    apiFetch<ExtractResponse>('/api/extract', {
      method: 'POST',
      body: JSON.stringify({ chatText: body.chatText }),
    }),

  calendar: (year: number, month: number) =>
    apiFetch<CalendarDay[]>(`/api/calendar?year=${year}&month=${month}`),
};
