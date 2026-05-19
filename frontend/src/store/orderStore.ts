import { create } from 'zustand';

export type OrderStatus = 'inquiry' | 'confirmed' | 'making' | 'done' | 'cancelled';

export interface Order {
  id: number;
  shopId: number;
  customerName: string;
  customerPhone: string | null;
  pickupDate: string;
  pickupTime: string | null;
  cakeSize: string | null;
  cakeFlavor: string | null;
  lettering: string | null;
  designNote: string | null;
  designImage: string | null;
  price: number;
  deposit: number;
  depositPaid: boolean;
  status: OrderStatus;
  rawChat: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderState {
  selectedDate: string | null;
  filterStatus: OrderStatus | 'all';
  setSelectedDate: (date: string | null) => void;
  setFilterStatus: (status: OrderStatus | 'all') => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  selectedDate: null,
  filterStatus: 'all',
  setSelectedDate: (date) => set({ selectedDate: date }),
  setFilterStatus: (status) => set({ filterStatus: status }),
}));
