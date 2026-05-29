import { apiFetch } from './client';
import type { Reservation, ReservationStatus } from './reservation';

export interface CustomerSummary {
  customerId:      number;
  customerName:    string;
  customerPhone:   string | null;
  orderCount:      number;
  totalRevenue:    number;
  lastPickupDate:  string | null;
  lastStatus:      ReservationStatus | null;
}

export const customerApi = {
  list(search?: string): Promise<CustomerSummary[]> {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    return apiFetch<CustomerSummary[]>(`/api/customers?${p}`);
  },

  getOrders(customerId: number): Promise<Reservation[]> {
    return apiFetch<Reservation[]>(`/api/customers/${customerId}/orders`);
  },
};
