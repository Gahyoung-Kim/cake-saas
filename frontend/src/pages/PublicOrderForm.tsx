import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { apiFetch } from '../api/client';

dayjs.locale('ko');

// ── 타입 ─────────────────────────────────────────────────────────────────

interface FormSize        { label: string; price: number; }
interface FormFlavor      { label: string; extraPrice: number; }
interface FormDesignTier  { name: string; description: string; extraPrice: number; }
interface FormExtraOpt    { label: string; price: number; }
interface FormPickup      { type: string; deliveryFee: number | null; deliveryArea: string | null; storeNotes: string | null; }
interface OperatingHours  { start: string; end: string; }

interface FormConfig {
  sizes: FormSize[];
  flavors: FormFlavor[];
  designTiers: FormDesignTier[];
  extraOptions: FormExtraOpt[];
  pickup: FormPickup;
  cancellationPolicy: string;
  operatingHours: OperatingHours | null;
  kakaoChannelUrl: string | null;
}

interface PublicShop {
  shopName: string;
  cancellationPolicy: string | null;
  sizeOptions:   { label: string; price: number }[];
  flavorOptions: { label: string }[];
  formConfig:    FormConfig | null;
}

interface AvailabilityDay {
  date:   string;
  count:  number;
  limit:  number;
  status: 'available' | 'almost' | 'full';
}

interface FormState {
  customerName:  string;
  customerPhone: string;
  pickupDate:    string;
  pickupTime:    string;
  cakeSize:      string;
  cakeFlavor:    string;
  designTier:    string;
  selectedExtras: string[];
  lettering:     string;
  designNote:    string;
  designImage:   string;
}

// ── 유틸 ─────────────────────────────────────────────────────────────────

const INPUT_CLS = 'w-full bg-white border-[0.5px] border-border rounded-md px-3 h-[44px] text-[14px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted';
const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const MIN_DATE = dayjs().add(1, 'day').format('YYYY-MM-DD');

function generateTimeSlots(hours: OperatingHours): string[] {
  const slots: string[] = [];
  let [h, m] = hours.start.split(':').map(Number);
  const [endH, endM] = hours.end.split(':').map(Number);
  while (h * 60 + m <= endH * 60 + endM) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 10;
    if (m >= 60) { h++; m -= 60; }
  }
  return slots;
}

function fmt(n: number) { return n > 0 ? `+₩${n.toLocaleString()}` : '기본 포함'; }

function parseUploadResponse(text: string): { url?: string; detail?: string } {
  if (!text) return {};
  try {
    return JSON.parse(text) as { url?: string; detail?: string };
  } catch {
    return {};
  }
}

function toAbsoluteUploadUrl(url: string): string {
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

// ── 메인 ─────────────────────────────────────────────────────────────────

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function DatePicker({ value, onChange, availability }: {
  value: string;
  onChange: (date: string) => void;
  availability: AvailabilityDay[] | undefined;
}) {
  const avMap = Object.fromEntries((availability ?? []).map(a => [a.date, a]));
  const today = dayjs();
  const days  = Array.from({ length: 14 }, (_, i) => today.add(i, 'day'));
  const emptyBefore = today.day();

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map((d, i) => (
          <div key={d} className={`text-[10px] font-medium text-center ${
            i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-ink-muted'
          }`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: emptyBefore }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(d => {
          const dateStr = d.format('YYYY-MM-DD');
          const isPast  = dateStr < MIN_DATE;
          const av      = avMap[dateStr];
          const status  = isPast ? 'past' : (av?.status ?? (av ? 'available' : 'loading'));
          const isSel   = value === dateStr;
          const disabled = isPast || status === 'full';

          const cellCls = isSel
            ? 'bg-primary text-white'
            : status === 'past'   ? 'bg-surface text-ink-muted opacity-50 cursor-not-allowed'
            : status === 'full'   ? 'bg-surface text-ink-muted cursor-not-allowed'
            : status === 'almost' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            :                       'bg-green-50 text-green-700 hover:bg-green-100';

          const label = isSel         ? '선택됨'
            : status === 'past'       ? ''
            : status === 'full'       ? '마감'
            : status === 'almost'     ? '마감 임박'
            : status === 'available'  ? '예약 가능'
            :                           '';

          const dow = d.day();
          const numColor = isSel || status === 'past' || status === 'full' ? ''
            : dow === 0 ? 'text-red-500'
            : dow === 6 ? 'text-blue-500'
            : '';

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onChange(dateStr)}
              className={`flex flex-col items-center justify-center rounded-lg py-2 gap-0.5 transition-colors ${cellCls}`}
            >
              <span className={`text-[12px] leading-none font-semibold ${numColor}`}>{d.format('D')}</span>
              <span className="text-[10px] leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MINUTES = ['00', '10', '20', '30', '40', '50'];
const HALF_CLS = INPUT_CLS.replace('w-full', 'flex-1 min-w-0');

function TimePicker({ value, onChange, slots }: {
  value: string;
  onChange: (time: string) => void;
  slots?: string[];
}) {
  const [hour,   setHour]   = useState(value ? value.split(':')[0] : '');
  const [minute, setMinute] = useState(value ? value.split(':')[1] : '');

  // 폼 외부 리셋(처음부터 버튼) 대응 — value가 바뀔 때만 반응
  useEffect(() => {
    if (!value) { setHour(''); setMinute(''); }
  }, [value]);

  const hourOpts = slots
    ? Array.from(new Set(slots.map(s => s.split(':')[0]))).sort()
    : Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  const minuteOpts = slots
    ? slots.filter(s => s.startsWith(`${hour}:`)).map(s => s.split(':')[1])
    : MINUTES;

  function handleHour(h: string) {
    setHour(h);
    setMinute(''); // 시 변경 시 분만 초기화, onChange 호출 안 함
  }

  function handleMinute(m: string) {
    if (!hour) return;
    setMinute(m);
    onChange(`${hour}:${m}`);
  }

  return (
    <div className="flex gap-2">
      <select value={hour} onChange={e => handleHour(e.target.value)} className={HALF_CLS}>
        <option value="">시</option>
        {hourOpts.map(h => <option key={h} value={h}>{h}시</option>)}
      </select>
      <select
        value={minute}
        onChange={e => handleMinute(e.target.value)}
        disabled={!hour}
        className={`${HALF_CLS} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <option value="">분</option>
        {minuteOpts.map(m => <option key={m} value={m}>{m}분</option>)}
      </select>
    </div>
  );
}

const EMPTY_FORM: FormState = {
  customerName: '', customerPhone: '', pickupDate: '', pickupTime: '',
  cakeSize: '', cakeFlavor: '', designTier: '', selectedExtras: [],
  lettering: '', designNote: '', designImage: '',
};

export default function PublicOrderForm() {
  const { slug } = useParams<{ slug: string }>();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading]       = useState(false);

  const { data, isLoading, isError } = useQuery<PublicShop>({
    queryKey: ['public-shop', slug],
    queryFn:  () => apiFetch<PublicShop>(`/api/public/order/${slug}`),
    enabled: !!slug, retry: false,
  });

  const { data: availability } = useQuery<AvailabilityDay[]>({
    queryKey: ['public-availability', slug],
    queryFn:  () => apiFetch<AvailabilityDay[]>(
      `/api/public/order/${slug}/availability?from=${dayjs().format('YYYY-MM-DD')}&days=14`
    ),
    enabled: !!slug,
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      // 디자인 티어·추가 옵션 정보를 designNote에 합산
      const extras = [
        form.designTier  ? `[디자인 티어] ${form.designTier}` : '',
        form.selectedExtras.length ? `[추가 옵션] ${form.selectedExtras.join(', ')}` : '',
        form.designNote  ? `[요청사항] ${form.designNote}` : '',
      ].filter(Boolean).join('\n');

      return apiFetch(`/api/public/order/${slug}`, {
        method: 'POST',
        body: JSON.stringify({
          customerName:  form.customerName,
          customerPhone: form.customerPhone,
          pickupDate:    form.pickupDate,
          pickupTime:    form.pickupTime,
          cakeSize:      form.cakeSize,
          cakeFlavor:    form.cakeFlavor,
          lettering:     form.lettering,
          designNote:    extras,
          designImage:   form.designImage || undefined,
          price:         totalEstimate,
        }),
      });
    },
    onSuccess: () => setSubmitted(true),
    onError:   (err: Error) => toast.error(err.message),
  });

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/api/public/upload`, { method: 'POST', body: fd });
      const text = await res.text();
      const data = parseUploadResponse(text);
      if (!res.ok) throw new Error(data.detail ?? '이미지 업로드에 실패했습니다.');
      if (!data.url) throw new Error('업로드된 이미지 URL을 받지 못했습니다.');
      const url = toAbsoluteUploadUrl(data.url);
      setForm(f => ({ ...f, designImage: url }));
      toast.success('이미지가 업로드됐습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
      setImagePreview(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.customerName.trim()) { toast.error('이름을 입력해 주세요.'); return; }
    if (!form.pickupDate)          { toast.error('픽업 날짜를 선택해 주세요.'); return; }
    if (cfg?.sizes.length && !form.cakeSize) { toast.error('케이크 사이즈를 선택해 주세요.'); return; }
    submitMutation.mutate();
  }

  // formConfig 우선, 없으면 구버전 sizeOptions 폴백
  const cfg = data?.formConfig;
  const sizes   = cfg?.sizes.length   ? cfg.sizes   : (data?.sizeOptions ?? []).map(s => ({ label: s.label, price: s.price }));
  const flavors = cfg?.flavors.length ? cfg.flavors : (data?.flavorOptions ?? []).map(f => ({ label: f.label, extraPrice: 0 }));
  const tiers   = cfg?.designTiers   ?? [];
  const extras  = cfg?.extraOptions  ?? [];
  const timeSlots = cfg?.operatingHours ? generateTimeSlots(cfg.operatingHours) : null;

  // 가격 합산
  const selectedSize   = sizes.find(s => s.label === form.cakeSize);
  const selectedFlavor = flavors.find(f => f.label === form.cakeFlavor);
  const selectedTier   = tiers.find(t => t.name === form.designTier);
  const selectedExtOpts = extras.filter(o => form.selectedExtras.includes(o.label));
  const totalEstimate  =
    (selectedSize?.price   ?? 0) +
    (selectedFlavor?.extraPrice ?? 0) +
    (selectedTier?.extraPrice   ?? 0) +
    selectedExtOpts.reduce((s, o) => s + o.price, 0);

  // ── 로딩 / 에러 / 완료 ────────────────────────────────────────────────

  if (isLoading) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
      <p className="text-caption text-ink-muted">주문서를 불러오는 중…</p>
    </div>
  );

  if (isError || !data) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-h2 font-semibold text-ink">주문서를 찾을 수 없어요</h1>
      <p className="text-body text-ink-muted">링크가 만료됐거나 주소가 잘못됐을 수 있어요.</p>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-5 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-status-confirmed-bg flex items-center justify-center">
        <svg viewBox="0 0 32 32" width="32" height="32">
          <path d="M6 16l7 7 13-13" stroke="var(--color-success)" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-h2 font-semibold text-ink">예약 신청이 완료되었습니다.</h1>
        <p className="text-body text-ink-sub">1시간 이내 예약금 입금 확인 후 확정됩니다.</p>
        <p className="text-body text-ink-muted">미입금 시 예약이 자동으로 취소됩니다.</p>
      </div>
      {cfg?.kakaoChannelUrl && (
        <a href={cfg.kakaoChannelUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[14px] font-medium bg-[#FEE500] text-[#3C1E1E] hover:brightness-95 transition-[filter]">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3C6.477 3 2 6.597 2 11c0 2.862 1.674 5.373 4.207 6.907L5.1 21.5l4.3-2.3A11.5 11.5 0 0012 19c5.523 0 10-3.597 10-8S17.523 3 12 3z"/></svg>
          카카오톡으로 추가 문의
        </a>
      )}
      <p className="text-caption text-ink-muted">화면을 닫으셔도 됩니다.</p>
    </div>
  );

  // ── 폼 ───────────────────────────────────────────────────────────────

  const isDirty = Object.values({ ...form, selectedExtras: undefined }).some(v => v !== '');

  return (
    <div className="min-h-screen bg-bg">
      {/* 헤더 */}
      <header className="sticky top-0 bg-bg/90 backdrop-blur border-b-[0.5px] border-border z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <svg viewBox="0 0 32 32" width="20" height="20">
            <path d="M6 22 C6 19, 9 18, 16 18 C23 18, 26 19, 26 22 L26 26 L6 26 Z" fill="var(--color-primary)"/>
            <rect x="8" y="14" width="16" height="6" rx="1" fill="var(--color-primary-light)"/>
            <circle cx="16" cy="11" r="2" fill="var(--color-primary-dark)"/>
          </svg>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink leading-tight truncate">{data.shopName}</div>
            <div className="text-[11px] text-ink-muted leading-tight">케이크 주문서</div>
          </div>
          {isDirty && (
            <button type="button"
              onClick={() => { setForm(EMPTY_FORM); setImagePreview(null); }}
              className="shrink-0 text-[12px] text-ink-muted hover:text-ink border-[0.5px] border-border rounded-md px-2.5 h-8 transition-colors">
              처음부터
            </button>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6 pb-16">

        {/* 고객 정보 */}
        <Fieldset legend="고객 정보">
          <Field label="이름" required>
            <input type="text" required placeholder="예) 김지은" value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className={INPUT_CLS}/>
          </Field>
          <Field label="연락처">
            <input type="tel" placeholder="010-0000-0000" value={form.customerPhone}
              onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} className={INPUT_CLS}/>
          </Field>
        </Fieldset>

        {/* 픽업 일정 */}
        <Fieldset legend="픽업 일정">
          <Field label="픽업 날짜" required>
            <DatePicker
              value={form.pickupDate}
              onChange={date => setForm(f => ({ ...f, pickupDate: date }))}
              availability={availability}
            />
          </Field>
          <Field label="픽업 시간">
            <TimePicker
              value={form.pickupTime}
              onChange={t => setForm(f => ({ ...f, pickupTime: t }))}
              slots={timeSlots ?? undefined}
            />
            {cfg?.operatingHours && (
              <p className="text-[11px] text-ink-muted mt-1">
                픽업 가능 시간: {cfg.operatingHours.start} ~ {cfg.operatingHours.end}
              </p>
            )}
          </Field>
        </Fieldset>

        {/* 사이즈 */}
        {sizes.length > 0 && (
          <Fieldset legend="케이크 사이즈">
            <Field label="사이즈 선택" required>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => (
                  <button key={s.label} type="button" onClick={() => setForm(f => ({ ...f, cakeSize: s.label }))}
                    className={`flex flex-col items-start px-4 py-2.5 rounded-xl border-[0.5px] text-left transition-colors ${
                      form.cakeSize === s.label
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-bg hover:border-border-strong'}`}>
                    <span className={`text-[13px] font-semibold ${form.cakeSize === s.label ? 'text-primary-dark' : 'text-ink'}`}>
                      {s.label}
                    </span>
                    {s.price > 0 && (
                      <span className={`text-[12px] ${form.cakeSize === s.label ? 'text-primary' : 'text-ink-muted'}`}>
                        ₩{s.price.toLocaleString()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Field>
          </Fieldset>
        )}

        {/* 맛 */}
        {flavors.length > 0 && (
          <Fieldset legend="케이크 맛">
            <Field label="맛 선택">
              <div className="flex flex-wrap gap-2">
                {flavors.map(f => (
                  <button key={f.label} type="button" onClick={() => setForm(s => ({ ...s, cakeFlavor: f.label }))}
                    className={`flex flex-col items-start px-4 py-2.5 rounded-xl border-[0.5px] text-left transition-colors ${
                      form.cakeFlavor === f.label
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-bg hover:border-border-strong'}`}>
                    <span className={`text-[13px] font-semibold ${form.cakeFlavor === f.label ? 'text-primary-dark' : 'text-ink'}`}>
                      {f.label}
                    </span>
                    <span className={`text-[11px] ${form.cakeFlavor === f.label ? 'text-primary' : 'text-ink-muted'}`}>
                      {f.extraPrice > 0 ? `+₩${f.extraPrice.toLocaleString()}` : '기본 포함'}
                    </span>
                  </button>
                ))}
              </div>
            </Field>
          </Fieldset>
        )}

        {/* 디자인 난이도 */}
        {tiers.length > 0 && (
          <Fieldset legend="디자인 난이도">
            <Field label="티어 선택">
              <div className="flex flex-col gap-2">
                {tiers.map(t => (
                  <button key={t.name} type="button" onClick={() => setForm(f => ({ ...f, designTier: t.name }))}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-[0.5px] text-left transition-colors ${
                      form.designTier === t.name
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-bg hover:border-border-strong'}`}>
                    <div>
                      <div className={`text-[13px] font-semibold ${form.designTier === t.name ? 'text-primary-dark' : 'text-ink'}`}>
                        {t.name}
                      </div>
                      <div className="text-[12px] text-ink-muted mt-0.5">{t.description}</div>
                    </div>
                    <span className={`text-[12px] font-medium shrink-0 ml-3 ${form.designTier === t.name ? 'text-primary' : 'text-ink-muted'}`}>
                      {fmt(t.extraPrice)}
                    </span>
                  </button>
                ))}
              </div>
            </Field>
          </Fieldset>
        )}

        {/* 추가 옵션 */}
        {extras.length > 0 && (
          <Fieldset legend="추가 옵션">
            <Field label="원하는 옵션을 선택하세요 (복수 선택 가능)">
              <div className="flex flex-col gap-2">
                {extras.map(o => {
                  const checked = form.selectedExtras.includes(o.label);
                  return (
                    <button key={o.label} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        selectedExtras: checked
                          ? f.selectedExtras.filter(l => l !== o.label)
                          : [...f.selectedExtras, o.label],
                      }))}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-[0.5px] text-left transition-colors ${
                        checked ? 'border-primary bg-primary-light' : 'border-border bg-bg hover:border-border-strong'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${
                          checked ? 'border-primary bg-primary' : 'border-border'}`}>
                          {checked && <svg viewBox="0 0 10 10" width="8" height="8"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                        </div>
                        <span className={`text-[13px] font-medium ${checked ? 'text-primary-dark' : 'text-ink'}`}>{o.label}</span>
                      </div>
                      <span className={`text-[12px] font-medium ${checked ? 'text-primary' : 'text-ink-muted'}`}>
                        +₩{o.price.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>
          </Fieldset>
        )}

        {/* 가격 합산 */}
        {totalEstimate > 0 && (
          <div className="flex items-center justify-between bg-surface rounded-xl border-[0.5px] border-border px-4 py-3">
            <span className="text-[13px] font-medium text-ink-sub">예상 금액</span>
            <span className="text-[18px] font-bold text-ink font-num">₩{totalEstimate.toLocaleString()}</span>
          </div>
        )}

        {/* 레터링 & 요청사항 */}
        <Fieldset legend="레터링 & 요청사항">
          <Field label="레터링 문구">
            <input type="text" value={form.lettering}
              onChange={e => setForm(f => ({ ...f, lettering: e.target.value }))}
              placeholder='예) Happy Birthday Sora ✨' className={INPUT_CLS}/>
            <p className="text-[11px] text-ink-muted mt-1">없으면 비워두세요.</p>
          </Field>
          <Field label="디자인 요청사항">
            <textarea rows={4} value={form.designNote}
              onChange={e => setForm(f => ({ ...f, designNote: e.target.value }))}
              placeholder="알러지, 색상, 장식 등 자유롭게 적어주세요."
              className={`${INPUT_CLS} h-auto py-3 resize-y leading-relaxed`}/>
          </Field>
          <Field label="디자인 참고 이미지">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="디자인 참고"
                  className="w-full max-h-64 object-contain rounded-xl border-[0.5px] border-border bg-surface"/>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/10 rounded-xl">
                    <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin"/>
                  </div>
                )}
                {!uploading && (
                  <button type="button" onClick={() => { setImagePreview(null); setForm(f => ({ ...f, designImage: '' })); }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-ink/50 text-bg hover:bg-ink/70 transition-colors">
                    <svg viewBox="0 0 16 16" width="14" height="14">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-[1.5px] border-dashed border-border hover:border-primary hover:bg-primary-light/10 transition-colors cursor-pointer">
                <svg viewBox="0 0 24 24" width="28" height="28" className="text-ink-muted">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" strokeWidth="1.5"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M3 15l5-5 4 4 3-3 5 5" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[13px] text-ink-muted">탭해서 사진 선택</span>
                <span className="text-[11px] text-ink-muted">JPG · PNG · WEBP · 최대 5MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageChange}/>
              </label>
            )}
            <p className="text-[11px] text-ink-muted mt-1">원하는 디자인 참고 사진을 첨부하면 제작에 도움이 됩니다.</p>
          </Field>
        </Fieldset>

        {/* 매장 픽업 준수사항 */}
        {cfg?.pickup?.storeNotes && (
          <div className="bg-surface rounded-xl border-[0.5px] border-border p-4">
            <div className="text-[12px] font-medium text-ink-sub mb-2">픽업 안내</div>
            <p className="text-[12px] text-ink-muted whitespace-pre-wrap leading-relaxed">{cfg.pickup.storeNotes}</p>
          </div>
        )}

        {/* 취소·환불 규정 */}
        {(cfg?.cancellationPolicy || data.cancellationPolicy) && (
          <div className="bg-surface rounded-xl border-[0.5px] border-border p-4">
            <div className="text-[12px] font-medium text-ink-sub mb-2">취소·환불 규정</div>
            <p className="text-[12px] text-ink-muted whitespace-pre-wrap leading-relaxed">
              {cfg?.cancellationPolicy || data.cancellationPolicy}
            </p>
          </div>
        )}

        {/* 제출 버튼 */}
        <button type="submit" disabled={submitMutation.isPending}
          className="h-14 rounded-xl font-semibold text-[15px] bg-primary text-bg hover:bg-primary-dark active:translate-y-px disabled:opacity-45 transition-[background,transform] duration-200 flex items-center justify-center gap-2">
          {submitMutation.isPending ? <><span className="spinner"/> 접수 중…</> : '주문 접수하기'}
        </button>

        {/* 카카오톡 상담 */}
        {cfg?.kakaoChannelUrl && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-[13px] text-ink-muted">더 상담이 필요하신가요?</p>
            <a href={cfg.kakaoChannelUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[14px] font-semibold bg-[#FEE500] text-[#3C1E1E] hover:brightness-95 transition-[filter]">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.597 2 11c0 2.862 1.674 5.373 4.207 6.907L5.1 21.5l4.3-2.3A11.5 11.5 0 0012 19c5.523 0 10-3.597 10-8S17.523 3 12 3z"/>
              </svg>
              카카오톡으로 상담하기
            </a>
          </div>
        )}

      </form>
    </div>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="m-0 p-0 border-none">
      <legend className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3 w-full border-b-[0.5px] border-border pb-1.5">
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
