import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { apiFetch } from '../api/client';

dayjs.locale('ko');

interface PublicShop {
  shopName: string;
  cancellationPolicy: string | null;
  sizeOptions:   { label: string; price: number }[];
  flavorOptions: { label: string }[];
}

interface FormState {
  customerName:  string;
  customerPhone: string;
  pickupDate:    string;
  pickupTime:    string;
  cakeSize:      string;
  cakeFlavor:    string;
  lettering:     string;
  designNote:    string;
}

const INPUT_CLS = 'w-full bg-white border-[0.5px] border-border rounded-md px-3 h-[44px] text-[14px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted';

const TODAY = dayjs().format('YYYY-MM-DD');
const MIN_DATE = dayjs().add(1, 'day').format('YYYY-MM-DD');

export default function PublicOrderForm() {
  const { slug } = useParams<{ slug: string }>();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({
    customerName: '', customerPhone: '', pickupDate: '',
    pickupTime: '', cakeSize: '', cakeFlavor: '',
    lettering: '', designNote: '',
  });

  const { data, isLoading, isError } = useQuery<PublicShop>({
    queryKey: ['public-shop', slug],
    queryFn:  () => apiFetch<PublicShop>(`/api/public/order/${slug}`),
    enabled:  !!slug,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/public/order/${slug}`, {
        method: 'POST',
        body: JSON.stringify(form),
      }),
    onSuccess: () => setSubmitted(true),
    onError:   (err: Error) => toast.error(err.message),
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cakeSize && data?.sizeOptions.length) {
      toast.error('케이크 사이즈를 선택해 주세요.');
      return;
    }
    if (form.pickupDate < TODAY) {
      toast.error('픽업 날짜를 오늘 이후로 선택해 주세요.');
      return;
    }
    submitMutation.mutate();
  }

  /* ── 로딩 ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-caption text-ink-muted">주문서를 불러오는 중…</p>
      </div>
    );
  }

  /* ── 에러 ── */
  if (isError || !data) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 text-center px-4">
        <svg viewBox="0 0 64 64" width="64" height="64" className="opacity-30">
          <circle cx="32" cy="32" r="28" stroke="currentColor" fill="none" strokeWidth="2" />
          <path d="M32 20v16M32 42v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <h1 className="text-h2 font-semibold text-ink">주문서를 찾을 수 없어요</h1>
        <p className="text-body text-ink-muted">링크가 만료됐거나 주소가 잘못됐을 수 있어요.</p>
      </div>
    );
  }

  /* ── 제출 완료 ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-5 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-status-confirmed-bg flex items-center justify-center">
          <svg viewBox="0 0 32 32" width="32" height="32">
            <path d="M6 16l7 7 13-13" stroke="var(--color-success)" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-h2 font-semibold text-ink">주문이 접수되었어요!</h1>
          <p className="text-body text-ink-sub mt-2">
            {data.shopName}에서 확인 후 연락드릴게요.
          </p>
        </div>
        <div className="bg-surface rounded-xl border-[0.5px] border-border p-4 text-left w-full max-w-sm">
          <div className="text-caption text-ink-muted mb-3">접수 내용</div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            <Row label="이름"   value={form.customerName} />
            <Row label="픽업"   value={`${form.pickupDate} ${form.pickupTime}`} />
            {form.cakeSize   && <Row label="사이즈" value={form.cakeSize} />}
            {form.cakeFlavor && <Row label="맛"     value={form.cakeFlavor} />}
            {form.lettering  && <Row label="레터링" value={form.lettering} />}
          </div>
        </div>
        <p className="text-caption text-ink-muted">화면을 닫으셔도 됩니다.</p>
      </div>
    );
  }

  /* ── 폼 ── */
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 bg-bg/90 backdrop-blur border-b-[0.5px] border-border z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true">
            <path d="M6 22 C6 19, 9 18, 16 18 C23 18, 26 19, 26 22 L26 26 L6 26 Z" fill="var(--color-primary)" />
            <rect x="8" y="14" width="16" height="6" rx="1" fill="var(--color-primary-light)" />
            <circle cx="16" cy="11" r="2" fill="var(--color-primary-dark)" />
          </svg>
          <div>
            <div className="text-[13px] font-semibold text-ink leading-tight">{data.shopName}</div>
            <div className="text-[11px] text-ink-muted leading-tight">케이크 주문서</div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6 pb-16">

        {/* 고객 정보 */}
        <Fieldset legend="고객 정보">
          <Field label="이름" required>
            <input type="text" required placeholder="예) 김지은" value={form.customerName}
              onChange={(e) => update('customerName', e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="연락처">
            <input type="tel" placeholder="010-0000-0000" value={form.customerPhone}
              onChange={(e) => update('customerPhone', e.target.value)} className={INPUT_CLS} />
          </Field>
        </Fieldset>

        {/* 픽업 일정 */}
        <Fieldset legend="픽업 일정">
          <Field label="픽업 날짜" required>
            <input type="date" required min={MIN_DATE} value={form.pickupDate}
              onChange={(e) => update('pickupDate', e.target.value)} className={INPUT_CLS} />
            <p className="text-[11px] text-ink-muted mt-1">오늘 이후 날짜를 선택해 주세요.</p>
          </Field>
          <Field label="픽업 시간">
            <input type="time" value={form.pickupTime}
              onChange={(e) => update('pickupTime', e.target.value)} className={INPUT_CLS} />
          </Field>
        </Fieldset>

        {/* 케이크 옵션 */}
        <Fieldset legend="케이크 옵션">
          {data.sizeOptions.length > 0 && (
            <Field label="사이즈" required>
              <div className="flex flex-wrap gap-2">
                {data.sizeOptions.map((s) => (
                  <button key={s.label} type="button" onClick={() => update('cakeSize', s.label)}
                    className={`h-11 px-4 rounded-full text-[13px] border-[0.5px] transition-colors ${
                      form.cakeSize === s.label
                        ? 'border-primary bg-primary-light text-primary-dark font-medium'
                        : 'border-border text-ink-sub hover:border-border-strong bg-bg'
                    }`}
                  >
                    {s.label}
                    {s.price > 0 && <span className={`ml-1.5 ${form.cakeSize === s.label ? 'opacity-70' : 'text-ink-muted'}`}>
                      ₩{s.price.toLocaleString()}
                    </span>}
                  </button>
                ))}
              </div>
            </Field>
          )}
          {data.flavorOptions.length > 0 && (
            <Field label="맛">
              <div className="flex flex-wrap gap-2">
                {data.flavorOptions.map((f) => (
                  <button key={f.label} type="button" onClick={() => update('cakeFlavor', f.label)}
                    className={`h-11 px-4 rounded-full text-[13px] border-[0.5px] transition-colors ${
                      form.cakeFlavor === f.label
                        ? 'border-primary bg-primary-light text-primary-dark font-medium'
                        : 'border-border text-ink-sub hover:border-border-strong bg-bg'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </Fieldset>

        {/* 레터링 & 요청 */}
        <Fieldset legend="레터링 & 요청사항">
          <Field label="레터링 문구">
            <input type="text" placeholder='예) Happy Birthday Sora' value={form.lettering}
              onChange={(e) => update('lettering', e.target.value)} className={INPUT_CLS} />
            <p className="text-[11px] text-ink-muted mt-1">없으면 비워두세요.</p>
          </Field>
          <Field label="디자인 요청사항">
            <textarea rows={4} value={form.designNote}
              onChange={(e) => update('designNote', e.target.value)}
              placeholder="알러지, 색상, 장식 등 자유롭게 적어주세요."
              className={`${INPUT_CLS} h-auto py-3 resize-y leading-relaxed`}
            />
          </Field>
        </Fieldset>

        {/* 취소·환불 규정 */}
        {data.cancellationPolicy && (
          <div className="bg-surface rounded-xl border-[0.5px] border-border p-4">
            <div className="text-[12px] font-medium text-ink-sub mb-2">취소·환불 규정</div>
            <p className="text-[12px] text-ink-muted whitespace-pre-wrap leading-relaxed">
              {data.cancellationPolicy}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="h-14 rounded-xl font-semibold text-[15px] bg-primary text-bg hover:bg-primary-dark active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed transition-[background,transform] duration-200 flex items-center justify-center gap-2"
        >
          {submitMutation.isPending
            ? <><span className="spinner" /> 접수 중…</>
            : '주문 접수하기'}
        </button>

      </form>
    </div>
  );
}

/* ── Sub-components ── */

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-none p-0 m-0">
      <legend className="text-[12px] font-semibold text-ink-muted uppercase tracking-widest mb-3 w-full border-b-[0.5px] border-border pb-2">
        {legend}
      </legend>
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-sub">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </span>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-ink-muted w-12 shrink-0">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
