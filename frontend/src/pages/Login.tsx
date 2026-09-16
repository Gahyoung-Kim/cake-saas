import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

// 백엔드 schemas/auth.py의 PASSWORD_MIN과 맞춘다
const PASSWORD_MIN = 8;

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [shopName, setShopName] = useState('');

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (mode === 'register' && password.length < PASSWORD_MIN) {
      toast.error(`비밀번호는 ${PASSWORD_MIN}자 이상이어야 합니다.`);
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await authApi.login({ email, password });
        setToken(res.accessToken);
        const me = await authApi.me();
        setUser(me);
        navigate('/');
      } else {
        const res = await authApi.register({ email, password, shopName });
        setToken(res.accessToken);
        const me = await authApi.me();
        setUser(me);
        navigate('/');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <svg viewBox="0 0 32 32" width="32" height="32">
            <path d="M6 22 C6 19, 9 18, 16 18 C23 18, 26 19, 26 22 L26 26 L6 26 Z" fill="var(--color-primary)" />
            <rect x="8" y="14" width="16" height="6" rx="1" fill="var(--color-primary-light)" />
            <circle cx="16" cy="11" r="2" fill="var(--color-primary-dark)" />
            <rect x="15.4" y="6" width="1.2" height="5" rx="0.6" fill="var(--color-primary-dark)" />
          </svg>
          <div>
            <div className="text-h2 font-semibold text-ink font-ko">caker</div>
            <div className="text-caption text-ink-sub">수제케이크 예약 운영</div>
          </div>
        </div>

        <div className="bg-surface rounded-xl p-6 border-[0.5px] border-border shadow-sm">
          <h1 className="text-h3 font-medium text-ink mb-5">
            {mode === 'login' ? '로그인' : '새 계정 만들기'}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <label className="flex flex-col gap-1">
                <span className="text-caption font-medium text-ink-sub">매장명</span>
                <input
                  className="bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px] text-[13px] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted hover:border-border-strong focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)]"
                  placeholder="예) 소라의 디저트"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-caption font-medium text-ink-sub">이메일</span>
              <input
                type="email"
                autoComplete="email"
                className="bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px] text-[13px] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted hover:border-border-strong focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)]"
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption font-medium text-ink-sub">비밀번호</span>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px] text-[13px] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted hover:border-border-strong focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === 'register' ? PASSWORD_MIN : undefined}
                required
              />
              {mode === 'register' && (
                <span className="text-caption text-ink-muted">{PASSWORD_MIN}자 이상 입력해 주세요.</span>
              )}
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-[6px] h-9 px-4 text-[13px] rounded-md font-medium font-ko whitespace-nowrap border border-transparent bg-primary text-bg hover:bg-primary-dark transition-[background,color] duration-200 ease-out active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed mt-1"
            >
              {loading && <span className="spinner" />}
              {mode === 'login' ? '로그인' : '계정 만들기'}
            </button>
          </form>

          <p className="text-caption text-ink-muted text-center mt-4">
            {mode === 'login' ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-primary hover:text-primary-dark underline"
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
