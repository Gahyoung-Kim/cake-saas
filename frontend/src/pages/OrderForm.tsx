import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiFetch } from '../api/client';
import AppLayout from '../components/AppLayout';

// ── 타입 ─────────────────────────────────────────────────────────────────

interface FormSize        { label: string; price: number; }
interface FormFlavor      { label: string; extraPrice: number; }
interface FormDesignTier  { name: string; description: string; extraPrice: number; }
interface FormExtraOption { label: string; price: number; }
interface FormPickup      { type: 'store' | 'quick' | 'both'; deliveryFee: number | null; deliveryArea: string | null; }

interface FormConfig {
  sizes:               FormSize[];
  flavors:             FormFlavor[];
  designTiers:         FormDesignTier[];
  extraOptions:        FormExtraOption[];
  pickup:              FormPickup;
  cancellationPolicy:  string;
}

interface ShopData { slug: string | null; formConfig: FormConfig | null; }

// ── 기본값 ────────────────────────────────────────────────────────────────

const DEFAULT: FormConfig = {
  sizes: [
    { label: '1호 (15cm)', price: 35000 },
    { label: '2호 (18cm)', price: 45000 },
    { label: '4호 (24cm)', price: 65000 },
  ],
  flavors: [
    { label: '바닐라 생크림', extraPrice: 0 },
    { label: '초코 생크림',   extraPrice: 0 },
    { label: '딸기 생크림',   extraPrice: 3000 },
  ],
  designTiers: [
    { name: '베이직',    description: '단색 크림, 레터링만',             extraPrice: 0 },
    { name: '스탠다드',  description: '간단한 꽃 장식, 2가지 색상',      extraPrice: 10000 },
    { name: '프리미엄',  description: '복잡한 조형물, 포토 인쇄',        extraPrice: 20000 },
  ],
  extraOptions: [
    { label: '숫자 초 꽂기',     price: 3000 },
    { label: '포토 이미지 인쇄', price: 5000 },
  ],
  pickup: { type: 'store', deliveryFee: null, deliveryArea: null },
  cancellationPolicy:
    '픽업 7일 전 취소: 전액 환불\n픽업 3~6일 전 취소: 예약금 50% 환불\n픽업 1~2일 전 취소: 환불 불가\n제작 착수 후 취소: 환불 불가\n※ 단순 변심으로 인한 변경은 픽업 5일 전까지 가능합니다.',
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────

export default function OrderForm() {
  const qc = useQueryClient();
  const [cfg, setCfg] = useState<FormConfig>(DEFAULT);

  const { data: shopData, isLoading } = useQuery<ShopData>({
    queryKey: ['shop'],
    queryFn:  () => apiFetch<ShopData>('/api/shop'),
  });

  useEffect(() => {
    if (shopData?.formConfig) setCfg(shopData.formConfig);
  }, [shopData]);

  const saveMutation = useMutation({
    mutationFn: () => apiFetch('/api/shop', {
      method: 'PUT',
      body: JSON.stringify({ formConfig: cfg }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop'] });
      toast.success('저장되었습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publicUrl = `${window.location.origin}/order/${shopData?.slug ?? ''}`;

  function set<K extends keyof FormConfig>(key: K, val: FormConfig[K]) {
    setCfg(c => ({ ...c, [key]: val }));
  }

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-14 xl:pb-0">
        <div className="max-w-[760px] mx-auto px-5 xl:px-10 py-8 flex flex-col gap-8">

          {/* 헤더 */}
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-h1 font-semibold text-ink font-ko">주문서 설정</h1>
              <p className="text-body text-ink-sub mt-1">고객에게 보여줄 주문서를 구성하세요.</p>
            </div>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || isLoading}
              className="shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-md text-[13px] font-semibold bg-primary text-bg hover:bg-primary-dark disabled:opacity-40 transition-colors"
            >
              {saveMutation.isPending && <span className="spinner" />}
              저장
            </button>
          </header>

          {/* 공개 URL */}
          {shopData?.slug && (
            <div className="flex items-center gap-2 bg-surface rounded-xl border-[0.5px] border-border px-4 py-3">
              <span className="text-[12px] text-ink-muted shrink-0">공개 주문서</span>
              <code className="flex-1 text-[12px] text-ink-sub truncate font-mono">{publicUrl}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('복사됐습니다.'); }}
                className="shrink-0 h-7 px-2.5 text-[11px] font-medium rounded-md border-[0.5px] border-border text-ink-sub hover:bg-muted transition-colors"
              >복사</button>
            </div>
          )}

          {isLoading ? <LoadingSkeleton /> : (
            <>
              <SizeSection    sizes={cfg.sizes}            onChange={v => set('sizes', v)} />
              <FlavorSection  flavors={cfg.flavors}         onChange={v => set('flavors', v)} />
              <TierSection    tiers={cfg.designTiers}       onChange={v => set('designTiers', v)} />
              <ExtraSection   options={cfg.extraOptions}    onChange={v => set('extraOptions', v)} />
              <PickupSection  pickup={cfg.pickup}           onChange={v => set('pickup', v)} />
              <PolicySection  policy={cfg.cancellationPolicy} onChange={v => set('cancellationPolicy', v)} />
            </>
          )}

          <div className="flex justify-end pb-4">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || isLoading}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-[10px] text-[14px] font-semibold bg-primary text-bg hover:bg-primary-dark disabled:opacity-40 transition-colors"
            >
              {saveMutation.isPending && <span className="spinner" />}
              저장하기
            </button>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

// ── 섹션 1: 사이즈 & 기본 가격 ────────────────────────────────────────────

function SizeSection({ sizes, onChange }: { sizes: FormSize[]; onChange: (v: FormSize[]) => void }) {
  const add = () => onChange([...sizes, { label: '', price: 0 }]);
  const del = (i: number) => onChange(sizes.filter((_, j) => j !== i));
  const upd = (i: number, patch: Partial<FormSize>) =>
    onChange(sizes.map((s, j) => j === i ? { ...s, ...patch } : s));

  return (
    <Section title="사이즈 & 기본 가격" desc="케이크 호수별 기본 가격을 설정하세요." onAdd={add}>
      {sizes.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <FInput value={s.label} onChange={v => upd(i, { label: v })} placeholder="예) 4호 (24cm)" className="flex-1" />
          <PriceInput value={s.price} onChange={v => upd(i, { price: v })} />
          <MinusBtn onClick={() => del(i)} />
        </div>
      ))}
    </Section>
  );
}

// ── 섹션 2: 맛 선택 ────────────────────────────────────────────────────────

function FlavorSection({ flavors, onChange }: { flavors: FormFlavor[]; onChange: (v: FormFlavor[]) => void }) {
  const add = () => onChange([...flavors, { label: '', extraPrice: 0 }]);
  const del = (i: number) => onChange(flavors.filter((_, j) => j !== i));
  const upd = (i: number, patch: Partial<FormFlavor>) =>
    onChange(flavors.map((f, j) => j === i ? { ...f, ...patch } : f));

  return (
    <Section title="맛 선택" desc="추가금 없는 맛은 '기본 포함'으로 표시됩니다." onAdd={add}>
      {flavors.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <FInput value={f.label} onChange={v => upd(i, { label: v })} placeholder="예) 딸기 생크림" className="flex-1" />
          {f.extraPrice === 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-ink-muted bg-muted px-2.5 py-1.5 rounded-md h-[38px] flex items-center">기본 포함</span>
              <button
                type="button"
                onClick={() => upd(i, { extraPrice: 1000 })}
                className="text-[11px] text-primary hover:underline whitespace-nowrap"
              >+ 추가금 설정</button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <PriceInput value={f.extraPrice} onChange={v => upd(i, { extraPrice: v })} prefix="+₩" />
              <button
                type="button"
                onClick={() => upd(i, { extraPrice: 0 })}
                className="text-[11px] text-ink-muted hover:text-ink whitespace-nowrap"
              >기본포함으로</button>
            </div>
          )}
          <MinusBtn onClick={() => del(i)} />
        </div>
      ))}
    </Section>
  );
}

// ── 섹션 3: 디자인 난이도 티어 ─────────────────────────────────────────────

function TierSection({ tiers, onChange }: { tiers: FormDesignTier[]; onChange: (v: FormDesignTier[]) => void }) {
  const add = () => onChange([...tiers, { name: '', description: '', extraPrice: 0 }]);
  const del = (i: number) => onChange(tiers.filter((_, j) => j !== i));
  const upd = (i: number, patch: Partial<FormDesignTier>) =>
    onChange(tiers.map((t, j) => j === i ? { ...t, ...patch } : t));

  return (
    <Section title="디자인 난이도 티어" desc="난이도에 따른 추가금을 설정하세요." onAdd={add}>
      {tiers.map((t, i) => (
        <div key={i} className="flex items-start gap-2">
          <FInput value={t.name} onChange={v => upd(i, { name: v })} placeholder="예) 베이직" className="w-24 shrink-0" />
          <FInput value={t.description} onChange={v => upd(i, { description: v })} placeholder="포함 내용 설명" className="flex-1" />
          <PriceInput value={t.extraPrice} onChange={v => upd(i, { extraPrice: v })} prefix="+₩" />
          <MinusBtn onClick={() => del(i)} />
        </div>
      ))}
    </Section>
  );
}

// ── 섹션 4: 레터링 & 요청사항 ─────────────────────────────────────────────

function ExtraSection({ options, onChange }: { options: FormExtraOption[]; onChange: (v: FormExtraOption[]) => void }) {
  const add = () => onChange([...options, { label: '', price: 0 }]);
  const del = (i: number) => onChange(options.filter((_, j) => j !== i));
  const upd = (i: number, patch: Partial<FormExtraOption>) =>
    onChange(options.map((o, j) => j === i ? { ...o, ...patch } : o));

  return (
    <Section title="추가 옵션" desc="초, 포토 인쇄 등 선택 가능한 옵션을 추가하세요." onAdd={add}>
      {options.map((o, i) => (
        <div key={i} className="flex items-center gap-2">
          <FInput value={o.label} onChange={v => upd(i, { label: v })} placeholder="예) 숫자 초 꽂기" className="flex-1" />
          <PriceInput value={o.price} onChange={v => upd(i, { price: v })} prefix="+₩" />
          <MinusBtn onClick={() => del(i)} />
        </div>
      ))}
    </Section>
  );
}

// ── 섹션 5: 픽업 방법 ─────────────────────────────────────────────────────

const PICKUP_TABS: { value: FormPickup['type']; label: string }[] = [
  { value: 'store', label: '매장 픽업' },
  { value: 'quick', label: '퀵 배송'  },
  { value: 'both',  label: '둘 다 가능' },
];

function PickupSection({ pickup, onChange }: { pickup: FormPickup; onChange: (v: FormPickup) => void }) {
  const showDelivery = pickup.type !== 'store';
  return (
    <SectionShell title="픽업 방법" desc="고객 주문서에 표시될 픽업 방식을 선택하세요.">
      <div className="inline-flex p-[3px] bg-muted rounded-lg gap-[2px]">
        {PICKUP_TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ ...pickup, type: value })}
            className={`h-9 px-4 rounded-md text-[13px] font-medium transition-all duration-150 ${
              pickup.type === value ? 'bg-bg text-ink shadow-sm' : 'text-ink-sub hover:text-ink'
            }`}
          >{label}</button>
        ))}
      </div>
      {showDelivery && (
        <div className="mt-4 flex flex-col gap-3 bg-surface rounded-xl border-[0.5px] border-border p-4">
          <p className="text-[12px] text-ink-muted">퀵 배송 선택 시 고객 주문서에 자동 표시됩니다.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink-sub">기본 배송비 (₩)</span>
              <input
                type="number"
                value={pickup.deliveryFee ?? ''}
                onChange={e => onChange({ ...pickup, deliveryFee: e.target.value ? Number(e.target.value) : null })}
                placeholder="예) 5000"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink-sub">배송 가능 지역</span>
              <input
                value={pickup.deliveryArea ?? ''}
                onChange={e => onChange({ ...pickup, deliveryArea: e.target.value || null })}
                placeholder="예) 서울 전 지역"
                className={INPUT_CLS}
              />
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}

// ── 섹션 6: 취소·환불 규정 ────────────────────────────────────────────────

function PolicySection({ policy, onChange }: { policy: string; onChange: (v: string) => void }) {
  return (
    <SectionShell title="취소 · 환불 규정" desc="고객 주문서 하단에 표시됩니다.">
      <textarea
        rows={6}
        value={policy}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-bg border-[0.5px] border-border rounded-lg px-4 py-3 text-[13px] text-ink outline-none resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 leading-relaxed"
      />
    </SectionShell>
  );
}

// ── 공통 프리미티브 ────────────────────────────────────────────────────────

const INPUT_CLS = 'w-full bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px] text-[13px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted';

function FInput({ value, onChange, placeholder, className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${INPUT_CLS} ${className}`}
    />
  );
}

function PriceInput({ value, onChange, prefix = '₩' }: {
  value: number; onChange: (v: number) => void; prefix?: string;
}) {
  return (
    <div className="relative shrink-0 w-32">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-muted pointer-events-none">{prefix}</span>
      <input
        type="number"
        min={0}
        value={value || ''}
        onChange={e => onChange(Number(e.target.value) || 0)}
        placeholder="0"
        className={`${INPUT_CLS} pl-8`}
      />
    </div>
  );
}

function MinusBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
      aria-label="삭제"
    >
      <svg viewBox="0 0 14 14" width="13" height="13">
        <path d="M2 7h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

function Section({ title, desc, onAdd, children }: {
  title: string; desc: string; onAdd: () => void; children: React.ReactNode;
}) {
  return (
    <SectionShell title={title} desc={desc}>
      <div className="flex flex-col gap-2">
        {children}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 h-9 px-3 self-start text-[12px] font-medium text-ink-sub border-[0.5px] border-dashed border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
        >
          <svg viewBox="0 0 12 12" width="10" height="10">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          항목 추가
        </button>
      </div>
    </SectionShell>
  );
}

function SectionShell({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-h3 font-semibold text-ink">{title}</h2>
        <p className="text-[12px] text-ink-muted mt-0.5">{desc}</p>
      </div>
      <div className="bg-surface rounded-xl border-[0.5px] border-border p-4">
        {children}
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
    </div>
  );
}
