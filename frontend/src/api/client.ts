import { useAuthStore } from '../store/authStore';

export const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

const BASE = API_BASE;

/**
 * 업로드 이미지 경로를 표시용 절대 URL로 변환한다.
 * DB에는 환경에 종속되지 않도록 `/uploads/xxx.png` 상대경로로 저장하고,
 * 화면에 그릴 때만 현재 API 오리진을 붙인다.
 * (과거에 절대 URL로 저장된 값은 그대로 통과시킨다)
 */
export function resolveUploadUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

/**
 * 인증 자체를 수행하는 엔드포인트 — 여기서 나오는 401은 "토큰 만료"가 아니라
 * "이메일/비밀번호가 틀림"이므로 자동 로그아웃·리다이렉트 대상에서 제외한다.
 */
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register'];

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

  // 토큰 만료 → 자동 로그아웃 (로그인/회원가입 요청은 제외)
  if (res.status === 401 && !AUTH_PATHS.includes(path)) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.');
  }

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }

  // 204 No Content — body 없음
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/**
 * FastAPI 에러 응답에서 사용자에게 보여줄 메시지를 뽑는다.
 * HTTPException은 detail이 문자열이지만, Pydantic 검증 실패(422)는
 * detail이 배열이라 그대로 쓰면 "[object Object]"가 노출된다.
 */
async function extractErrorMessage(res: Response): Promise<string> {
  const fallback = '요청에 실패했습니다.';
  const body = await res.json().catch(() => null);
  if (!body || typeof body !== 'object') return fallback;

  const { detail } = body as { detail?: unknown };
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((d) => (d && typeof d === 'object' ? (d as { msg?: unknown }).msg : null))
      .filter((m): m is string => typeof m === 'string')
      .map((m) => m.replace(/^Value error,\s*/, ''));
    if (messages.length) return messages.join('\n');
  }

  return fallback;
}
