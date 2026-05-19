import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import AppLayout from '../components/AppLayout';

interface ShopSettings {
  name: string;
  ownerName: string | null;
  phone: string | null;
  dailyLimit: number;
}

const INPUT_CLS = 'bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px] text-[13px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted';

export default function Settings() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<ShopSettings>({
    queryKey: ['shop-settings'],
    queryFn:  () => apiFetch<ShopSettings>('/api/shop'),
  });

  const [form, setForm] = useState<ShopSettings>({
    name: '', ownerName: '', phone: '', dailyLimit: 5,
  });

  useEffect(() => {
    if (data) setForm({ name: data.name, ownerName: data.ownerName ?? '', phone: data.phone ?? '', dailyLimit: data.dailyLimit });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/shop', { method: 'PUT', body: JSON.stringify(form) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-settings'] });
      qc.invalidateQueries({ queryKey: ['shop'] });
      toast.success('설정이 저장되었습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function field(label: string, key: keyof ShopSettings, opts?: { type?: string; placeholder?: string; min?: number; max?: number }) {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-caption font-medium text-ink-sub">{label}</span>
        {isLoading
          ? <div className="skeleton h-[38px] rounded-md" />
          : <input
              type={opts?.type ?? 'text'}
              min={opts?.min}
              max={opts?.max}
              placeholder={opts?.placeholder}
              value={String(form[key] ?? '')}
              onChange={(e) => setForm((f) => ({
                ...f,
                [key]: opts?.type === 'number' ? Number(e.target.value) : e.target.value,
              }))}
              className={INPUT_CLS}
            />
        }
      </label>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-14 xl:pb-0">
        <div className="max-w-[600px] mx-auto px-5 xl:px-10 py-9">

          <header className="mb-8">
            <h1 className="text-h1 font-semibold text-ink font-ko">설정</h1>
            <p className="text-body text-ink-sub mt-1">매장 정보와 운영 설정을 관리하세요.</p>
          </header>

          {/* 계정 정보 */}
          <section className="bg-surface rounded-xl border-[0.5px] border-border p-6 mb-5">
            <h2 className="text-h3 font-medium text-ink mb-4">계정</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-[14px] font-semibold text-bg shrink-0">
                {user?.shopName?.[0] ?? '?'}
              </div>
              <div>
                <div className="text-[13px] font-medium text-ink">{user?.shopName}</div>
                <div className="text-caption text-ink-muted">{user?.email}</div>
              </div>
            </div>
          </section>

          {/* 매장 정보 */}
          <section className="bg-surface rounded-xl border-[0.5px] border-border p-6 mb-5 flex flex-col gap-4">
            <h2 className="text-h3 font-medium text-ink">매장 정보</h2>
            {field('매장명', 'name', { placeholder: '소라의 디저트' })}
            {field('오너 이름', 'ownerName', { placeholder: '김소라' })}
            {field('전화번호', 'phone', { placeholder: '010-0000-0000' })}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || isLoading}
              className="inline-flex items-center gap-2 h-9 px-4 self-end text-[13px] rounded-md font-medium bg-primary text-bg hover:bg-primary-dark disabled:opacity-45 transition-colors"
            >
              {saveMutation.isPending && <span className="spinner" />}
              저장
            </button>
          </section>

          {/* 운영 설정 */}
          <section className="bg-surface rounded-xl border-[0.5px] border-border p-6 mb-8 flex flex-col gap-4">
            <div>
              <h2 className="text-h3 font-medium text-ink">운영 설정</h2>
              <p className="text-caption text-ink-muted mt-0.5">캘린더 한도 초과 표시 기준입니다.</p>
            </div>
            {field('하루 최대 제작 수량', 'dailyLimit', { type: 'number', min: 1, max: 50 })}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || isLoading}
              className="inline-flex items-center gap-2 h-9 px-4 self-end text-[13px] rounded-md font-medium bg-primary text-bg hover:bg-primary-dark disabled:opacity-45 transition-colors"
            >
              {saveMutation.isPending && <span className="spinner" />}
              저장
            </button>
          </section>

          {/* 로그아웃 */}
          <div className="border-t-[0.5px] border-border pt-6">
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-[13px] text-danger hover:text-danger/80 transition-colors"
            >
              로그아웃
            </button>
          </div>

        </div>
      </main>
    </AppLayout>
  );
}
