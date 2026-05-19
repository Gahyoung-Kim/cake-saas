import { useAuthStore } from '../store/authStore';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // 토큰 만료 → 자동 로그아웃
  if (res.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? '요청에 실패했습니다.');
  }

  // 204 No Content — body 없음
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
