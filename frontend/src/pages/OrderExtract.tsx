import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { reservationApi } from '../api/reservation';
import type { ExtractResponse } from '../api/reservation';
import AppLayout from '../components/AppLayout';
import ChatPasteBox from '../components/ChatPasteBox';

type Source = 'kakao' | 'insta' | 'naver' | 'manual';

const SOURCE_CHIPS: { key: Source; label: string; color: string }[] = [
  { key: 'kakao',  label: '카카오톡',     color: 'bg-[#FEE500] text-[#3C1E1E]' },
  { key: 'insta',  label: '인스타그램 DM', color: 'bg-[#E1306C] text-white'       },
  { key: 'naver',  label: '네이버폼',      color: 'bg-[#03C75A] text-white'       },
  { key: 'manual', label: '직접 입력',     color: 'bg-muted text-ink-sub'         },
];

const EXTRACT_STEPS = [
  '대화 분리 및 노이즈 제거',
  '주문 항목과 옵션 식별',
  '날짜·시간 정규화',
  '금액 추정 및 신뢰도 계산',
];

export default function OrderExtract() {
  const navigate = useNavigate();

  const [chatText, setChatText]     = useState('');
  const [source, setSource]         = useState<Source>('kakao');
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [doneSteps, setDoneSteps]   = useState<number[]>([]);
  const [result, setResult]         = useState<ExtractResponse | null>(null);
  const [form, setForm]             = useState<Partial<ExtractResponse>>({});

  async function handleExtract() {
    if (!chatText.trim()) {
      toast.error('채팅 내용을 붙여넣어 주세요.');
      return;
    }
    setLoading(true);
    setResult(null);
    setDoneSteps([]);

    // 로딩 스텝 애니메이션
    EXTRACT_STEPS.forEach((_, i) => {
      setTimeout(() => setDoneSteps((prev) => [...prev, i]), 300 + i * 350);
    });

    try {
      const res = await reservationApi.extract(chatText);
      setResult(res);
      setForm(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '추출에 실패했습니다.');
    } finally {
      setLoading(false);
      setDoneSteps([]);
    }
  }

  async function handleSave() {
    if (!form.pickupDate) { toast.error('픽업 날짜를 입력해 주세요.'); return; }
    setSaving(true);
    try {
      await reservationApi.create({
        customerName: form.customerName ?? '',
        pickupDate:   form.pickupDate,
        pickupTime:   form.pickupTime   ?? undefined,
        cakeSize:     form.cakeSize     ?? undefined,
        cakeFlavor:   form.cakeFlavor   ?? undefined,
        lettering:    form.lettering    ?? undefined,
        designNote:   form.designNote   ?? undefined,
        price:        form.price        ?? 0,
        deposit:      form.deposit      ?? 0,
        rawChat:      chatText,
        status:       'inquiry',
      });
      toast.success('예약이 저장되었습니다.');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const confidence = result?.confidence ?? 0;
  const lowConf = result !== null && confidence < 0.7;
  const confPct = Math.round(confidence * 100);

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-14 xl:pb-0">
        <div className="max-w-[1280px] mx-auto px-5 xl:px-10 py-9">

          {/* Breadcrumb + header */}
          <div className="text-caption text-ink-muted mb-1 flex items-center gap-1">
            <Link to="/" className="hover:text-ink transition-colors">대시보드</Link>
            <span>›</span>
            <span>예약 추출</span>
          </div>
          <header className="mb-8">
            <h1 className="text-h1 font-semibold text-ink flex items-center gap-2 font-ko">
              <svg viewBox="0 0 16 16" width="20" height="20">
                <path d="M8 1.5l1.4 3.6L13 6.5l-3.6 1.4L8 11.5 6.6 7.9 3 6.5l3.6-1.4L8 1.5zM12.5 11l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8L10 13.5l1.8-.7.7-1.8z"
                  fill="var(--color-primary)" />
              </svg>
              AI 주문 추출
            </h1>
            <p className="text-body text-ink-sub mt-1">
              고객 메시지를 붙여넣으면 주문 정보를 자동으로 정리해드려요.
            </p>
          </header>

          {/* Split workspace */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

            {/* ─── Left: paste panel ─── */}
            <div className="flex flex-col gap-4">
              <div className="bg-surface rounded-xl border-[0.5px] border-border p-5 flex flex-col gap-4">
                <div>
                  <h2 className="text-[14px] font-medium text-ink">원본 메시지</h2>
                  <p className="text-caption text-ink-muted mt-0.5">대화 내용을 그대로 복사해 붙여넣어 주세요</p>
                </div>

                {/* Source chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-caption text-ink-muted shrink-0">출처</span>
                  {SOURCE_CHIPS.map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setSource(key)}
                      className={`h-7 px-3 rounded-full text-[11px] font-medium transition-all duration-150 border-[0.5px] ${
                        source === key
                          ? `${color} border-transparent shadow-sm`
                          : 'bg-bg border-border text-ink-sub hover:border-border-strong'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <ChatPasteBox value={chatText} onChange={setChatText} />
              </div>

              <button
                onClick={handleExtract}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 text-[14px] rounded-[10px] font-medium font-ko bg-primary text-bg hover:bg-primary-dark active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed transition-[background,transform] duration-200"
              >
                {loading
                  ? <span className="spinner" />
                  : <SparkleIcon />
                }
                {loading ? '추출 중…' : '주문 정보 추출하기'}
              </button>
            </div>

            {/* ─── Right: result panel ─── */}
            <div className="bg-surface rounded-xl border-[0.5px] border-border min-h-[400px] flex flex-col">

              {/* Panel header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b-[0.5px] border-border">
                <div>
                  <h2 className="text-[14px] font-medium text-ink">추출 결과</h2>
                  <p className="text-caption text-ink-muted mt-0.5">
                    {result ? '필드를 직접 수정할 수 있어요' : '왼쪽에 메시지를 붙여넣고 추출을 시작해주세요'}
                  </p>
                </div>
                {result && (
                  <ConfidenceMeter pct={confPct} low={lowConf} />
                )}
              </div>

              <div className="flex-1 p-5">
                {/* Empty state */}
                {!loading && !result && <EmptyResultState />}

                {/* Loading state */}
                {loading && (
                  <div className="flex flex-col items-center gap-6 py-8">
                    <div className="w-10 h-10 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
                    <div>
                      <p className="text-[13px] font-medium text-ink text-center mb-4">메시지를 읽고 있어요…</p>
                      <div className="flex flex-col gap-2">
                        {EXTRACT_STEPS.map((step, i) => (
                          <div key={i} className={`flex items-center gap-2 text-[12px] transition-colors duration-300 ${
                            doneSteps.includes(i) ? 'text-success' : 'text-ink-muted'
                          }`}>
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                              doneSteps.includes(i)
                                ? 'border-success bg-success text-bg'
                                : 'border-border'
                            }`}>
                              {doneSteps.includes(i) && (
                                <svg viewBox="0 0 10 10" width="8" height="8">
                                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                </svg>
                              )}
                            </span>
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Result state */}
                {!loading && result && (
                  <div className="flex flex-col gap-4">
                    {/* Low confidence banner */}
                    {lowConf && (
                      <div className="flex items-start gap-3 bg-status-inquiry-bg rounded-lg p-3 text-[12px] text-status-inquiry-fg border-[0.5px] border-status-inquiry-fg/20">
                        <svg viewBox="0 0 16 16" width="14" height="14" className="shrink-0 mt-0.5">
                          <path d="M8 2l6.5 11.5h-13L8 2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                          <path d="M8 6.5v3.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        <span>일부 정보를 확인해 주세요. 신뢰도 {confPct}% — 노란 표시 항목을 직접 확인해 주세요.</span>
                      </div>
                    )}

                    {/* Fields grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <ExField label="고객명"
                        value={form.customerName ?? ''}
                        onChange={(v) => setForm((f) => ({ ...f, customerName: v }))} />
                      <ExField label="픽업 날짜" type="date"
                        value={form.pickupDate ?? ''}
                        onChange={(v) => setForm((f) => ({ ...f, pickupDate: v }))} />
                      <ExField label="픽업 시간" placeholder="15:00"
                        value={form.pickupTime ?? ''}
                        onChange={(v) => setForm((f) => ({ ...f, pickupTime: v }))} />
                      <ExField label="케이크 사이즈" placeholder="6호"
                        value={form.cakeSize ?? ''}
                        onChange={(v) => setForm((f) => ({ ...f, cakeSize: v }))} />
                      <ExField label="맛" placeholder="딸기 생크림"
                        value={form.cakeFlavor ?? ''}
                        onChange={(v) => setForm((f) => ({ ...f, cakeFlavor: v }))} />
                      <ExField label="레터링"
                        value={form.lettering ?? ''}
                        onChange={(v) => setForm((f) => ({ ...f, lettering: v }))} />
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-caption font-medium text-ink-sub">디자인 · 요청사항</span>
                      <textarea
                        rows={3}
                        value={form.designNote ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, designNote: e.target.value }))}
                        className="bg-bg border-[0.5px] border-border rounded-md px-3 py-2 text-[13px] text-ink outline-none resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <ExField label="주문 금액 (₩)" type="number" placeholder="0"
                        value={form.price != null ? String(form.price) : ''}
                        onChange={(v) => setForm((f) => ({ ...f, price: v ? Number(v) : undefined }))} />
                      <ExField label="예약금 (₩)" type="number" placeholder="0"
                        value={form.deposit != null ? String(form.deposit) : ''}
                        onChange={(v) => setForm((f) => ({ ...f, deposit: v ? Number(v) : undefined }))} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t-[0.5px] border-border">
                      <button
                        onClick={() => { setResult(null); setForm({}); }}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] rounded-md font-medium text-ink-sub hover:bg-muted transition-colors"
                      >
                        <svg viewBox="0 0 16 16" width="13" height="13">
                          <path d="M3 8a5 5 0 1 1 1.3 3.4M3 12V8h4" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        다시 추출
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] rounded-md font-medium bg-primary text-bg hover:bg-primary-dark disabled:opacity-45 transition-colors"
                        >
                          {saving && <span className="spinner" />}
                          예약으로 저장
                          {!saving && (
                            <svg viewBox="0 0 16 16" width="12" height="12">
                              <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

/* ── Sub-components ── */

function SparkleIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path d="M8 1.5l1.4 3.6L13 6.5l-3.6 1.4L8 11.5 6.6 7.9 3 6.5l3.6-1.4L8 1.5zM12.5 11l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8L10 13.5l1.8-.7.7-1.8z"
        fill="currentColor" />
    </svg>
  );
}

function ConfidenceMeter({ pct, low }: { pct: number; low: boolean }) {
  const circumference = 2 * Math.PI * 15.9;
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="flex items-center gap-2 shrink-0">
      <svg viewBox="0 0 36 36" width="40" height="40">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-muted)" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none"
          stroke={low ? 'var(--color-warning)' : 'var(--color-primary)'}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90 18 18)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div>
        <div className={`text-[14px] font-semibold font-num tabular-nums leading-none ${low ? 'text-warning' : 'text-ink'}`}>
          {pct}%
        </div>
        <div className="text-[10px] text-ink-muted leading-none mt-0.5">신뢰도</div>
      </div>
    </div>
  );
}

function EmptyResultState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px] gap-3 text-center">
      <svg viewBox="0 0 120 120" width="90" height="90">
        <rect x="22" y="34" width="76" height="58" rx="6" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="1" />
        <rect x="32" y="46" width="34" height="3" rx="1.5" fill="var(--color-muted)" />
        <rect x="32" y="54" width="56" height="3" rx="1.5" fill="var(--color-muted)" />
        <rect x="32" y="62" width="40" height="3" rx="1.5" fill="var(--color-muted)" />
        <rect x="32" y="74" width="48" height="3" rx="1.5" fill="var(--color-muted)" />
        <rect x="32" y="82" width="28" height="3" rx="1.5" fill="var(--color-muted)" />
        <path d="M88 22l1.6-4 1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6z" fill="var(--color-primary)" opacity=".8" />
      </svg>
      <h3 className="text-[14px] font-medium text-ink">결과가 여기에 표시됩니다</h3>
      <p className="text-caption text-ink-muted">
        고객명, 픽업 일시, 케이크 옵션, 금액까지<br />한 번에 정리해드릴게요.
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 mt-1">
        {['고객명', '픽업 일시', '케이크 옵션', '레터링', '금액'].map((tag) => (
          <span key={tag} className="text-[11px] px-2 py-0.5 rounded-sm bg-muted text-ink-sub">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExField({ label, value, onChange, type = 'text', placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px] text-[13px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted"
      />
    </label>
  );
}
