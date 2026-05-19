import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { reservationApi } from '../../api/reservation';
import type { Reservation, ReservationFormData, ReservationStatus } from '../../api/reservation';

dayjs.locale('ko');

// ── 상수 ─────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const MIN_DATE = dayjs().format('YYYY-MM-DD');

const STATUS_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: 'inquiry',   label: '문의'   },
  { value: 'confirmed', label: '확정'   },
  { value: 'making',    label: '제작중' },
  { value: 'done',      label: '완료'   },
  { value: 'cancelled', label: '취소'   },
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
    price: undefined,
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
    price:         r.price || undefined,
    deposit:       r.deposit || undefined,
    depositPaid:   r.depositPaid,
    status:        r.status,
    memo:          r.memo ?? '',
  };
}

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  mode: 'create' | 'edit';
  reservation?: Reservation;  // edit 모드에서 pre-fill용
  open: boolean;
  onClose: () => void;
  onSuccess: (saved: Reservation) => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ReservationFormModal({ mode, reservation, open, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ReservationFormData>(emptyForm);

  // open 될 때마다 폼 초기화
  useEffect(() => {
    if (!open) return;
    setForm(mode === 'edit' && reservation ? reservationToForm(reservation) : emptyForm());
  }, [open, mode, reservation]);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pickupDate) { toast.error('픽업 날짜를 입력해 주세요.'); return; }
    if (!form.customerName.trim()) { toast.error('고객명을 입력해 주세요.'); return; }
    mutation.mutate();
  }

  const title = mode === 'create' ? '예약 등록' : '예약 수정';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/25 z-50 backdrop-blur-[1px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="form-panel"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ duration: 0.32, ease: EASE }}
            className={[
              'fixed z-50 bg-bg shadow-lg flex flex-col overflow-hidden',
              'bottom-0 left-0 right-0 max-h-[94vh] rounded-t-2xl',
              'md:inset-auto md:rounded-xl',
              'md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
              'md:w-[600px] md:max-h-[92vh]',
            ].join(' ')}
          >
            {/* 모바일 핸들 */}
            <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-border" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b-[0.5px] border-border shrink-0">
              <h2 className="text-h3 font-semibold text-ink">{title}</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-ink-muted transition-colors" aria-label="닫기">
                <svg viewBox="0 0 16 16" width="14" height="14">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 폼 본문 */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-5">

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
                  </Field>
                  <Field label="맛">
                    <Input value={form.cakeFlavor ?? ''} onChange={(v) => set('cakeFlavor', v)} placeholder="예) 딸기 생크림" />
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
                  <Field label="예약금 (₩)">
                    <Input
                      type="number"
                      value={form.deposit != null ? String(form.deposit) : ''}
                      onChange={(v) => set('deposit', v ? Number(v) : undefined)}
                      placeholder="0"
                    />
                  </Field>
                </div>
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
            <div className="px-5 py-4 border-t-[0.5px] border-border bg-surface/60 flex items-center justify-end gap-2 shrink-0">
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
        </>
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
    memo:          form.memo?.trim() || undefined,
  };
}
