import { apiFetch } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  shopName: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
}

export interface MeResponse {
  id: number;
  email: string;
  shopId: number;
  shopName: string;
}

export const authApi = {
  login: (body: LoginRequest) =>
    apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  register: (body: RegisterRequest) =>
    apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => apiFetch<MeResponse>('/api/auth/me'),
};
