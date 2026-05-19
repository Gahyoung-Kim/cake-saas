import { apiFetch } from './client';

// ── 타입 ──────────────────────────────────────────────────────────────────

export type ReservationStatus =
  | 'inquiry'
  | 'confirmed'
  | 'making'
  | 'done'
  | 'cancelled';

export interface Reservation {
  id: number;
  shopId: number;
  customerName: string;
  customerPhone: string | null;
  pickupDate: string;         // "YYYY-MM-DD"
  pickupTime: string | null;  // "HH:MM"
  cakeSize: string | null;
  cakeFlavor: string | null;
  lettering: string | null;
  designNote: string | null;
  designImage: string | null;
  price: number;
  deposit: number;
  depositPaid: boolean;
  status: ReservationStatus;
  rawChat: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationQuery {
  status?: ReservationStatus;
  date?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ReservationListResponse {
  items: Reservation[];
  total: number;
  page: number;
  perPage: number;
}

// AI 추출 요청/응답
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

export interface DashboardStats {
  monthlyCount: number;
  monthlyCountPrev: number;
  monthlyRevenue: number;
  monthlyRevenuePrev: number;
  pendingCount: number;
  todayCount: number;
  todayPickupTimes: string[];
}

export interface CalendarDay {
  date: string;
  count: number;
  isOverLimit: boolean;
  // 상태별 건수 (도트 표시용)
  inquiry: number;
  confirmed: number;
  making: number;
  done: number;
  cancelled: number;
}

// create / update 에서 쓰는 폼 데이터 타입
export interface ReservationFormData {
  customerName: string;
  customerPhone?: string;
  pickupDate: string;       // "YYYY-MM-DD"
  pickupTime?: string;      // "HH:MM"
  cakeSize?: string;
  cakeFlavor?: string;
  lettering?: string;
  designNote?: string;
  price?: number;
  deposit?: number;
  depositPaid?: boolean;
  status?: ReservationStatus;
  designImage?: string;
  rawChat?: string;
  memo?: string;
}

// ── API ──────────────────────────────────────────────────────────────────

export const reservationApi = {
  list(q: ReservationQuery = {}): Promise<ReservationListResponse> {
    const p = new URLSearchParams();
    if (q.status)  p.set('status',   q.status);
    if (q.date)    p.set('date',     q.date);
    if (q.search)  p.set('search',   q.search);
    if (q.page)    p.set('page',     String(q.page));
    if (q.perPage) p.set('per_page', String(q.perPage));
    return apiFetch<ReservationListResponse>(`/api/orders?${p}`);
  },

  get(id: number): Promise<Reservation> {
    return apiFetch<Reservation>(`/api/orders/${id}`);
  },

  create(data: ReservationFormData): Promise<Reservation> {
    return apiFetch<Reservation>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: Partial<ReservationFormData>): Promise<Reservation> {
    return apiFetch<Reservation>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus(id: number, status: ReservationStatus): Promise<Reservation> {
    return apiFetch<Reservation>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  updateDeposit(id: number, depositPaid: boolean): Promise<Reservation> {
    return apiFetch<Reservation>(`/api/orders/${id}/deposit`, {
      method: 'PATCH',
      body: JSON.stringify({ depositPaid }),
    });
  },

  remove(id: number): Promise<void> {
    return apiFetch<void>(`/api/orders/${id}`, { method: 'DELETE' });
  },

  calendar(year: number, month: number): Promise<CalendarDay[]> {
    return apiFetch<CalendarDay[]>(`/api/calendar?year=${year}&month=${month}`);
  },

  dashboardStats(): Promise<DashboardStats> {
    return apiFetch<DashboardStats>('/api/dashboard/stats');
  },

  extract(chatText: string): Promise<ExtractResponse> {
    return apiFetch<ExtractResponse>('/api/extract', {
      method: 'POST',
      body: JSON.stringify({ chatText }),
    });
  },
};
