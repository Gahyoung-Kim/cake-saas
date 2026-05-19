import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiFetch } from '../api/client';
import AppLayout from '../components/AppLayout';

interface SizeOption   { label: string; price: number; }
interface FlavorOption { label: string; }

interface ShopResponse {
  id: number;
  name: string;         // camelCase: 'name' (단일 단어)
  ownerName: string | null;
  phone: string | null;
  dailyLimit: number;
  slug: string | null;
  sizeOptions: SizeOption[];
  flavorOptions: FlavorOption[];
  cancellationPolicy: string | null;
}

const INPUT_CLS = 'flex-1 bg-bg border-[0.5px] border-border rounded-md px-3 h-[38px] text-[13px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted';

export default function OrderForm() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<ShopResponse>({
    queryKey: ['shop'],
    queryFn:  () => apiFetch<ShopResponse>('/api/shop'),
  });

  const [sizes,   setSizes]   = useState<SizeOption[]>([]);
  const [flavors, setFlavors] = useState<FlavorOption[]>([]);
  const [policy,  setPolicy]  = useState('');

  useEffect(() => {
    if (data) {
      setSizes(data.sizeOptions   ?? []);
      setFlavors(data.flavorOptions ?? []);
      setPolicy(data.cancellationPolicy ?? '');
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch<ShopResponse>('/api/shop', {
        method: 'PUT',
        body: JSON.stringify({ sizeOptions: sizes, flavorOptions: flavors, cancellationPolicy: policy }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop'] });
      toast.success('주문서 설정이 저장되었습니다.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publicUrl = `${window.location.origin}/order/${data?.slug ?? ''}`;
  const hasSlug   = !!data?.slug;

  // ── size helpers ──
  function addSize()    { setSizes((s) => [...s, { label: '', price: 0 }]); }
  function removeSize(i: number) { setSizes((s) => s.filter((_, j) => j !== i)); }
  function moveSize(i: number, dir: -1 | 1) {
    setSizes((s) => {
      const next = [...s];
      const j = i + dir;
      if (j < 0 || j >= next.length) return s;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  // ── flavor helpers ──
  function addFlavor()    { setFlavors((f) => [...f, { label: '' }]); }
  function removeFlavor(i: number) { setFlavors((f) => f.filter((_, j) => j !== i)); }
  function moveFlavor(i: number, dir: -1 | 1) {
    setFlavors((f) => {
      const next = [...f];
      const j = i + dir;
      if (j < 0 || j >= next.length) return f;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-14 xl:pb-0">
        <div className="max-w-[760px] mx-auto px-5 xl:px-10 py-9">

          <header className="mb-8">
            <h1 className="text-h1 font-semibold text-ink font-ko">주문서 설정</h1>
            <p className="text-body text-ink-sub mt-1">
              고객에게 공유할 주문서 옵션을 구성하세요.
            </p>
          </header>

          {/* ── 공개 URL ── */}
          <section className="bg-surface rounded-xl border-[0.5px] border-border p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[13px] font-medium text-ink">공개 주문서 URL</span>
            </div>
            {isLoading ? (
              <div className="skeleton h-9 rounded-md" />
            ) : (
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[12px] bg-bg border-[0.5px] border-border rounded-md px-3 py-2.5 text-ink-sub truncate font-mono">
                  {hasSlug ? publicUrl : '저장 후 생성됩니다'}
                </code>
                {hasSlug && (
                  <>
                    <button
                      onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('URL이 복사되었습니다.'); }}
                      className="shrink-0 h-9 px-3 text-[12px] rounded-md border-[0.5px] border-border-strong text-ink hover:bg-muted transition-colors"
                    >
                      복사
                    </button>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 h-9 px-3 text-[12px] rounded-md border-[0.5px] border-border-strong text-ink hover:bg-muted transition-colors flex items-center gap-1"
                    >
                      미리보기
                      <svg viewBox="0 0 12 12" width="10" height="10">
                        <path d="M7 1h4v4M11 1L5 7M2 3H1v8h8v-1" stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </a>
                  </>
                )}
              </div>
            )}
          </section>

          {/* ── 사이즈 옵션 ── */}
          <Section
            title="사이즈 옵션"
            desc="고객이 선택할 케이크 크기를 추가하세요."
            onAdd={addSize}
          >
            {isLoading ? (
              <SkeletonRows n={3} />
            ) : sizes.length === 0 ? (
              <EmptyOption label="사이즈 옵션이 없어요. + 추가를 눌러 시작하세요." />
            ) : (
              sizes.map((s, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div className="flex flex-col gap-0.5">
                    <MoveBtn disabled={i === 0}            onClick={() => moveSize(i, -1)}>↑</MoveBtn>
                    <MoveBtn disabled={i === sizes.length - 1} onClick={() => moveSize(i,  1)}>↓</MoveBtn>
                  </div>
                  <input
                    className={INPUT_CLS}
                    placeholder="예) 4호"
                    value={s.label}
                    onChange={(e) => setSizes((arr) => arr.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  />
                  <div className="relative flex-shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-muted">₩</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="가격"
                      value={s.price || ''}
                      onChange={(e) => setSizes((arr) => arr.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))}
                      className="w-32 bg-bg border-[0.5px] border-border rounded-md pl-7 pr-3 h-[38px] text-[13px] text-ink outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200"
                    />
                  </div>
                  <DelBtn onClick={() => removeSize(i)} />
                </div>
              ))
            )}
          </Section>

          {/* ── 맛 옵션 ── */}
          <Section
            title="맛 옵션"
            desc="고객이 선택할 케이크 맛을 추가하세요."
            onAdd={addFlavor}
          >
            {isLoading ? (
              <SkeletonRows n={3} />
            ) : flavors.length === 0 ? (
              <EmptyOption label="맛 옵션이 없어요. + 추가를 눌러 시작하세요." />
            ) : (
              flavors.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <MoveBtn disabled={i === 0}               onClick={() => moveFlavor(i, -1)}>↑</MoveBtn>
                    <MoveBtn disabled={i === flavors.length - 1} onClick={() => moveFlavor(i,  1)}>↓</MoveBtn>
                  </div>
                  <input
                    className={INPUT_CLS}
                    placeholder="예) 딸기 생크림"
                    value={f.label}
                    onChange={(e) => setFlavors((arr) => arr.map((x, j) => j === i ? { label: e.target.value } : x))}
                  />
                  <DelBtn onClick={() => removeFlavor(i)} />
                </div>
              ))
            )}
          </Section>

          {/* ── 취소·환불 규정 ── */}
          <section className="mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-h3 font-medium text-ink">취소·환불 규정</h2>
              <span className="text-caption text-ink-muted">공개 주문서 하단에 표시됩니다</span>
            </div>
            {isLoading ? (
              <div className="skeleton h-28 rounded-lg" />
            ) : (
              <textarea
                rows={5}
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
                placeholder={`예) 픽업 3일 전까지 취소 가능합니다.\n전날·당일 취소 시 예약금 환불이 어렵습니다.`}
                className="w-full bg-bg border-[0.5px] border-border rounded-lg px-4 py-3 text-[13px] text-ink outline-none resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 placeholder:text-ink-muted leading-relaxed"
              />
            )}
          </section>

          {/* ── 저장 버튼 ── */}
          <div className="flex items-center justify-between">
            <p className="text-caption text-ink-muted">
              저장하면 공개 주문서에 즉시 반영됩니다.
            </p>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || isLoading}
              className="inline-flex items-center gap-2 h-11 px-6 text-[14px] rounded-[10px] font-medium font-ko bg-primary text-bg hover:bg-primary-dark active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed transition-[background,transform] duration-200"
            >
              {saveMutation.isPending && <span className="spinner" />}
              {saveMutation.isPending ? '저장 중…' : '설정 저장하기'}
            </button>
          </div>

        </div>
      </main>
    </AppLayout>
  );
}

/* ── Helper components ── */

function Section({ title, desc, onAdd, children }: {
  title: string; desc: string; onAdd: () => void; children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-start justify-between mb-3 gap-4">
        <div>
          <h2 className="text-h3 font-medium text-ink">{title}</h2>
          <p className="text-caption text-ink-muted mt-0.5">{desc}</p>
        </div>
        <button
          onClick={onAdd}
          className="shrink-0 inline-flex items-center gap-1 h-8 px-3 text-[12px] rounded-md border-[0.5px] border-border-strong text-ink-sub hover:bg-muted transition-colors"
        >
          <svg viewBox="0 0 12 12" width="10" height="10">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          추가
        </button>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function MoveBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-5 h-[17px] flex items-center justify-center rounded text-[10px] text-ink-muted hover:text-ink hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors leading-none"
    >
      {children}
    </button>
  );
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-md text-ink-muted hover:text-danger hover:bg-status-cancel-bg transition-colors shrink-0"
      aria-label="삭제"
    >
      <svg viewBox="0 0 16 16" width="13" height="13">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function EmptyOption({ label }: { label: string }) {
  return (
    <div className="text-caption text-ink-muted py-4 text-center bg-surface rounded-lg border-[0.5px] border-dashed border-border">
      {label}
    </div>
  );
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton h-[38px] rounded-md" />
      ))}
    </>
  );
}
