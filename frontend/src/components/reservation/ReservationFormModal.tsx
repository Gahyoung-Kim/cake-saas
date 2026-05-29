import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { reservationApi } from '../../api/reservation';
import type { Reservation, ReservationFormData, ReservationStatus } from '../../api/reservation';
import { apiFetch } from '../../api/client';

dayjs.locale('ko');

// ── 상수 ─────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const MIN_DATE = dayjs().format('YYYY-MM-DD');

const STATUS_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: 'inquiry',   label: '문의'   },
  { value: 'confirmed', label: '확정'   },
  { value: 'making',    label: '제작중' },
  { value: 'done',      label: '완료'   },
  { value: 'cancelled', label: '주문취소' },
];

// ── 빈 폼 기본값 ─────────────────────────────────────────────────────────

function emptyForm(): ReservationFormData {
  return {
    customerName: '',
    customerPhone: '',
    pickupDate: '',
    pickupTime: '',
    cakeSize: '',
    cakeFlavor: '',
    lettering: '',
    designNote: '',
    designImage: '',
    price: undefined,
    costPrice: undefined,
    deposit: undefined,
    depositPaid: false,
    status: 'inquiry',
    memo: '',
  };
}

function reservationToForm(r: Reservation): ReservationFormData {
  return {
    customerName:  r.customerName,
    customerPhone: r.customerPhone ?? '',
    pickupDate:    r.pickupDate,
    pickupTime:    r.pickupTime ?? '',
    cakeSize:      r.cakeSize ?? '',
    cakeFlavor:    r.cakeFlavor ?? '',
    lettering:     r.lettering ?? '',
    designNote:    r.designNote ?? '',
    designImage:   r.designImage ?? '',
    price:         r.price || undefined,
    costPrice:     r.costPrice || undefined,
    deposit:       r.deposit || undefined,
    depositPaid:   r.depositPaid,
    status:        r.status,
    memo:          r.memo ?? '',
  };
}

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

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  mode: 'create' | 'edit';
  reservation?: Reservation;     // edit 모드에서 pre-fill용
  initialPickupDate?: string;    // create 모드에서 날짜 미리 채우기
  open: boolean;
  onClose: () => void;
  onSuccess: (saved: Reservation) => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ReservationFormModal({ mode, reservation, initialPickupDate, open, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const [form,         setForm]         = useState<ReservationFormData>(emptyForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading,    setUploading]    = useState(false);

  // 샵 사이즈·맛 옵션 (힌트 칩용)
  const { data: shopData } = useQuery({
    queryKey: ['shop'],
    queryFn: () => apiFetch<{ sizeOptions: { label: string; price: number }[]; flavorOptions: { label: string }[] }>('/api/shop'),
    staleTime: 1000 * 60 * 5,
  });
  const sizeHints   = shopData?.sizeOptions   ?? [];
  const flavorHints = shopData?.flavorOptions ?? [];

  // open 될 때마다 폼 초기화
  useEffect(() => {
    if (!open) return;
    const next = mode === 'edit' && reservation
      ? reservationToForm(reservation)
      : { ...emptyForm(), pickupDate: initialPickupDate ?? '' };
    setForm(next);
    setImagePreview(next.designImage || null);
  }, [open, mode, reservation, initialPickupDate]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = buildPayload(form);
      return mode === 'create'
        ? reservationApi.create(payload)
        : reservationApi.update(reservation!.id, payload);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard-recent'] });
      qc.invalidateQueries({ queryKey: ['calendar-v2'] });
      toast.success(mode === 'create' ? '예약이 등록됐습니다.' : '예약이 수정됐습니다.');
      onSuccess(saved);
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function set<K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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
      set('designImage', url);
      toast.success('이미지가 업로드됐습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
      setImagePreview(null);
      set('designImage', '');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeImage() {
    setImagePreview(null);
    set('designImage', '');
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.pickupDate) { toast.error('픽업 날짜를 입력해 주세요.'); return; }
    if (!form.customerName.trim()) { toast.error('고객명을 입력해 주세요.'); return; }
    mutation.mutate();
  }

  const title = mode === 'create' ? '예약 등록' : '예약 수정';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[1px] overflow-y-auto py-8 px-4"
          onClick={onClose}
        >
          {/* 패널 (높이 제한 없음) */}
          <motion.div
            key="form-panel"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative bg-bg shadow-lg rounded-xl mx-auto w-full max-w-[600px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b-[0.5px] border-border">
              <h2 className="text-h3 font-semibold text-ink">{title}</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-ink-muted transition-colors" aria-label="닫기">
                <svg viewBox="0 0 16 16" width="14" height="14">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 폼 본문 */}
            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-5">

              {/* ── 고객 정보 ── */}
              <Fieldset legend="고객 정보">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="고객명" required>
                    <Input
                      value={form.customerName}
                      onChange={(v) => set('customerName', v)}
                      placeholder="예) 김지은"
                      required
                    />
                  </Field>
                  <Field label="연락처">
                    <Input
                      value={form.customerPhone ?? ''}
                      onChange={(v) => set('customerPhone', v)}
                      placeholder="010-0000-0000"
                      type="tel"
                    />
                  </Field>
                </div>
              </Fieldset>

              {/* ── 픽업 일정 ── */}
              <Fieldset legend="픽업 일정">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="픽업 날짜" required>
                    <Input
                      value={form.pickupDate}
                      onChange={(v) => set('pickupDate', v)}
                      type="date"
                      min={mode === 'create' ? MIN_DATE : undefined}
                      required
                    />
                  </Field>
                  <Field label="픽업 시간">
                    <Input
                      value={form.pickupTime ?? ''}
                      onChange={(v) => set('pickupTime', v)}
                      type="time"
                    />
                  </Field>
                </div>
              </Fieldset>

              {/* ── 케이크 ── */}
              <Fieldset legend="케이크">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="사이즈">
                    <Input value={form.cakeSize ?? ''} onChange={(v) => set('cakeSize', v)} placeholder="예) 6호" />
                    {sizeHints.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {sizeHints.map((s) => (
                          <button
                            key={s.label} type="button"
                            onClick={() => set('cakeSize', s.label)}
                            className={`text-[11px] px-2 py-0.5 rounded-full border-[0.5px] transition-colors ${
                              form.cakeSize === s.label
                                ? 'border-primary bg-primary-light text-primary-dark'
                                : 'border-border text-ink-muted hover:border-border-strong'
                            }`}
                          >
                            {s.label}{s.price > 0 && ` ₩${s.price.toLocaleString()}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label="맛">
                    <Input value={form.cakeFlavor ?? ''} onChange={(v) => set('cakeFlavor', v)} placeholder="예) 딸기 생크림" />
                    {flavorHints.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {flavorHints.map((f) => (
                          <button
                            key={f.label} type="button"
                            onClick={() => set('cakeFlavor', f.label)}
                            className={`text-[11px] px-2 py-0.5 rounded-full border-[0.5px] transition-colors ${
                              form.cakeFlavor === f.label
                                ? 'border-primary bg-primary-light text-primary-dark'
                                : 'border-border text-ink-muted hover:border-border-strong'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </Field>
                </div>
                <Field label="레터링 문구">
                  <Input value={form.lettering ?? ''} onChange={(v) => set('lettering', v)} placeholder='예) Happy Birthday Sora' />
                </Field>
                <Field label="디자인 요청사항">
                  <textarea
                    rows={3}
                    value={form.designNote ?? ''}
                    onChange={(e) => set('designNote', e.target.value)}
                    placeholder="알러지, 색상, 장식 등"
                    className={INPUT_CLS + ' h-auto py-2 resize-y leading-relaxed'}
                  />
                </Field>

                {/* ── 디자인 참고 이미지 ── */}
                <Field label="디자인 참고 이미지">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="디자인 참고"
                        className="w-full max-h-48 object-contain rounded-lg border-[0.5px] border-border bg-surface"
                      />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/10 rounded-lg">
                          <div className="w-7 h-7 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
                        </div>
                      )}
                      {!uploading && (
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-ink/50 text-bg hover:bg-ink/70 transition-colors"
                          aria-label="이미지 삭제"
                        >
                          <svg viewBox="0 0 14 14" width="12" height="12">
                            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-lg border-[1.5px] border-dashed border-border hover:border-primary hover:bg-primary-light/10 transition-colors cursor-pointer">
                      <svg viewBox="0 0 20 20" width="22" height="22" className="text-ink-muted">
                        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" fill="none" strokeWidth="1.4"/>
                        <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/>
                        <path d="M3 13l4-4 3 3 2.5-2.5 4 4" stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[12px] text-ink-muted">클릭해서 이미지 선택</span>
                      <span className="text-[10px] text-ink-muted">JPG · PNG · WEBP · 최대 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </Field>
              </Fieldset>

              {/* ── 금액 ── */}
              <Fieldset legend="금액 · 입금">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="주문 금액 (₩)">
                    <Input
                      type="number"
                      value={form.price != null ? String(form.price) : ''}
                      onChange={(v) => set('price', v ? Number(v) : undefined)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="원가 (₩)">
                    <Input
                      type="number"
                      value={form.costPrice != null ? String(form.costPrice) : ''}
                      onChange={(v) => set('costPrice', v ? Number(v) : undefined)}
                      placeholder="0"
                    />
                  </Field>
                </div>
                <Field label="예약금 (₩)">
                  <Input
                    type="number"
                    value={form.deposit != null ? String(form.deposit) : ''}
                    onChange={(v) => set('deposit', v ? Number(v) : undefined)}
                    placeholder="0"
                  />
                </Field>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => set('depositPaid', !form.depositPaid)}
                    className={`w-10 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${
                      form.depositPaid ? 'bg-success' : 'bg-muted'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-bg shadow transition-transform duration-200 ${
                      form.depositPaid ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className="text-[13px] text-ink-sub">입금 완료</span>
                </label>
              </Fieldset>

              {/* ── 상태 / 메모 ── */}
              <Fieldset legend="상태 · 메모">
                <Field label="예약 상태">
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={(e) => set('status', e.target.value as ReservationStatus)}
                      className={INPUT_CLS + ' appearance-none pr-8'}
                    >
                      {STATUS_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" viewBox="0 0 12 12" width="11" height="11">
                      <path d="M3 5l3 3 3-3" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                </Field>
                <Field label="메모">
                  <textarea
                    rows={2}
                    value={form.memo ?? ''}
                    onChange={(e) => set('memo', e.target.value)}
                    placeholder="내부 메모 (고객에게 미표시)"
                    className={INPUT_CLS + ' h-auto py-2 resize-none leading-relaxed'}
                  />
                </Field>
              </Fieldset>

            </form>

            {/* 하단 버튼 */}
            <div className="px-5 py-4 border-t-[0.5px] border-border bg-surface/60 rounded-b-xl flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-md text-[13px] font-medium text-ink-sub border-[0.5px] border-border hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="h-10 px-5 rounded-md text-[13px] font-medium font-ko bg-primary text-bg hover:bg-primary-dark active:translate-y-px disabled:opacity-40 transition-[background,transform] duration-200 flex items-center gap-2"
              >
                {mutation.isPending && <span className="spinner" />}
                {mode === 'create' ? '등록하기' : '저장하기'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────

const INPUT_CLS = 'w-full bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px] text-[13px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted';

function Input({ value, onChange, type = 'text', placeholder, required, min }: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      className={INPUT_CLS}
    />
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="m-0 p-0 border-none">
      <legend className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-2.5 w-full border-b-[0.5px] border-border pb-1.5">
        {legend}
      </legend>
      <div className="flex flex-col gap-3">{children}</div>
    </fieldset>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-ink-sub">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </span>
      {children}
    </div>
  );
}

function buildPayload(form: ReservationFormData): ReservationFormData {
  return {
    ...form,
    customerPhone: form.customerPhone?.trim() || undefined,
    pickupTime:    form.pickupTime?.trim() || undefined,
    cakeSize:      form.cakeSize?.trim() || undefined,
    cakeFlavor:    form.cakeFlavor?.trim() || undefined,
    lettering:     form.lettering?.trim() || undefined,
    designNote:    form.designNote?.trim() || undefined,
    designImage:   form.designImage?.trim() || undefined,
    memo:          form.memo?.trim() || undefined,
  };
}
