import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import type { Reservation, ReservationStatus } from '../../api/reservation';
import StatusBadge from './StatusBadge';

dayjs.locale('ko');

// ── 상태 플로우 정의 ───────────────────────────────────────────────────────

const NEXT_STATUS: Partial<Record<ReservationStatus, { status: ReservationStatus; label: string }>> = {
  inquiry:   { status: 'confirmed', label: '예약 확정' },
  confirmed: { status: 'making',    label: '제작 시작' },
  making:    { status: 'done',      label: '픽업 완료' },
};

// ── 애니메이션 상수 ────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: ReservationStatus) => void;
  onDepositChange: (id: number, paid: boolean) => void;
  onEdit?: () => void;
  onDelete?: (id: number) => void;
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ReservationDetailModal({
  reservation: r, open, onClose, onStatusChange, onDepositChange, onEdit, onDelete, isLoading,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!r) return null;

  const next      = NEXT_STATUS[r.status];
  const canCancel = r.status !== 'done' && r.status !== 'cancelled';
  const pickup    = dayjs(r.pickupDate);

  return (
    <AnimatePresence>
      {open && (
        /* ── 오버레이 (스크롤 담당) ── */
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[1px] overflow-y-auto py-8 px-4"
          onClick={onClose}
        >
          {/* ── 패널 (높이 제한 없음) ── */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative bg-bg shadow-lg rounded-xl mx-auto w-full max-w-[560px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── 헤더 ── */}
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b-[0.5px] border-border">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-h3 font-semibold text-ink">예약 상세</h2>
                <StatusBadge status={r.status} />
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-ink-muted transition-colors"
                aria-label="닫기"
              >
                <svg viewBox="0 0 16 16" width="14" height="14">
                  <path d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* ── 본문 ── */}
            <div className="px-5 py-4 flex flex-col gap-5">

              {/* 픽업 일시 */}
              <InfoSection label="픽업 일시">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 16 16" width="14" height="14" className="text-ink-muted shrink-0">
                    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.4" />
                    <path d="M2 6h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <span className="text-[14px] font-semibold text-ink font-num">
                    {pickup.format('YYYY년 M월 D일 (ddd)')}
                  </span>
                  {r.pickupTime && (
                    <span className="text-[14px] text-ink font-num">· {r.pickupTime}</span>
                  )}
                  {pickup.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') && (
                    <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-full bg-primary text-bg leading-none">오늘</span>
                  )}
                </div>
              </InfoSection>

              {/* 고객 정보 */}
              <InfoSection label="고객 정보">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface border-[0.5px] border-border flex items-center justify-center text-[13px] font-semibold text-ink-sub shrink-0">
                    {r.customerName?.[0] ?? '?'}
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-ink">{r.customerName}</div>
                    {r.customerPhone
                      ? <div className="text-[12px] text-ink-muted font-num mt-0.5">{r.customerPhone}</div>
                      : <div className="text-[12px] text-ink-muted mt-0.5">연락처 없음</div>
                    }
                  </div>
                </div>
              </InfoSection>

              {/* 케이크 정보 */}
              <InfoSection label="케이크">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {r.cakeFlavor && <Tag>{r.cakeFlavor}</Tag>}
                    {r.cakeSize   && <Tag>{r.cakeSize}</Tag>}
                  </div>
                  {r.lettering && (
                    <div className="flex items-start gap-1.5 text-[13px]">
                      <span className="text-ink-muted shrink-0">레터링</span>
                      <span className="text-ink font-medium">"{r.lettering}"</span>
                    </div>
                  )}
                  {r.designNote && (
                    <div className="bg-status-inquiry-bg rounded-lg p-3 text-[12px] text-status-inquiry-fg leading-relaxed whitespace-pre-wrap">
                      {r.designNote}
                    </div>
                  )}
                  {r.designImage && (
                    <div>
                      <div className="text-[11px] font-medium text-ink-muted mb-1.5">디자인 참고 이미지</div>
                      <a href={r.designImage} target="_blank" rel="noopener noreferrer">
                        <img
                          src={r.designImage}
                          alt="디자인 참고"
                          className="w-full max-h-56 object-contain rounded-lg border-[0.5px] border-border bg-surface hover:opacity-90 transition-opacity cursor-zoom-in"
                        />
                      </a>
                    </div>
                  )}
                  {!r.cakeFlavor && !r.cakeSize && !r.lettering && !r.designNote && !r.designImage && (
                    <span className="text-[13px] text-ink-muted">케이크 정보 없음</span>
                  )}
                </div>
              </InfoSection>

              {/* 금액 / 입금 */}
              <InfoSection label="금액 · 입금">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[20px] font-semibold text-ink font-num">
                      {r.price > 0 ? `₩${r.price.toLocaleString()}` : '금액 미정'}
                    </div>
                    {r.deposit > 0 && (
                      <div className="text-[12px] text-ink-muted mt-0.5 font-num">
                        예약금 ₩{r.deposit.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDepositChange(r.id, !r.depositPaid)}
                    disabled={isLoading}
                    className={`
                      h-8 px-3 rounded-full text-[12px] font-medium transition-colors duration-150
                      disabled:opacity-50
                      ${r.depositPaid
                        ? 'bg-status-confirmed-bg text-status-confirmed-fg hover:opacity-80'
                        : 'bg-status-inquiry-bg text-status-inquiry-fg hover:opacity-80'}
                    `}
                  >
                    {r.depositPaid ? '입금 완료' : '미입금 · 클릭해서 변경'}
                  </button>
                </div>
              </InfoSection>

              {/* 메모 */}
              {r.memo && (
                <InfoSection label="메모">
                  <p className="text-[13px] text-ink-sub leading-relaxed whitespace-pre-wrap">{r.memo}</p>
                </InfoSection>
              )}

              {/* 등록일 */}
              <div className="text-[11px] text-ink-muted text-right pt-1">
                등록 {dayjs(r.createdAt).format('YYYY.MM.DD HH:mm')}
                {r.createdAt !== r.updatedAt && ` · 수정 ${dayjs(r.updatedAt).format('MM.DD HH:mm')}`}
              </div>

            </div>

            {/* ── 삭제 확인 배너 ── */}
            {confirmDelete && (
              <div className="px-5 py-3 bg-status-cancel-bg border-t-[0.5px] border-status-cancel-fg/20">
                <p className="text-[13px] text-status-cancel-fg font-medium mb-2">
                  예약을 삭제하면 복구할 수 없어요. 정말 삭제할까요?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 h-9 rounded-md text-[13px] font-medium border-[0.5px] border-border text-ink-sub hover:bg-muted transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => { onDelete?.(r.id); setConfirmDelete(false); }}
                    disabled={isLoading}
                    className="flex-1 h-9 rounded-md text-[13px] font-medium bg-danger text-bg hover:brightness-95 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isLoading && <span className="spinner" />}
                    삭제
                  </button>
                </div>
              </div>
            )}

            {/* ── 액션 버튼 영역 ── */}
            <div className="px-5 py-4 border-t-[0.5px] border-border bg-surface/60 rounded-b-xl">
              <div className="flex items-center gap-2">

                {/* 수정 버튼 — 항상 표시 (onEdit 있을 때) */}
                {onEdit && (
                  <button
                    onClick={onEdit}
                    disabled={isLoading}
                    className="h-10 px-3 rounded-md text-[13px] font-medium text-ink-sub border-[0.5px] border-border hover:bg-muted hover:text-ink disabled:opacity-40 transition-colors flex items-center gap-1.5"
                  >
                    <svg viewBox="0 0 14 14" width="12" height="12">
                      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                    수정
                  </button>
                )}

                {/* 예약 취소 버튼 */}
                {canCancel && (
                  <button
                    onClick={() => onStatusChange(r.id, 'cancelled')}
                    disabled={isLoading}
                    className="h-10 px-4 rounded-md text-[13px] font-medium text-ink-sub border-[0.5px] border-border hover:bg-muted hover:text-ink disabled:opacity-40 transition-colors"
                  >
                    주문취소
                  </button>
                )}

                {/* 다음 상태 버튼 */}
                {next && (
                  <button
                    onClick={() => onStatusChange(r.id, next.status)}
                    disabled={isLoading}
                    className="flex-1 h-10 px-4 rounded-md text-[13px] font-medium font-ko bg-primary text-bg hover:bg-primary-dark active:translate-y-px disabled:opacity-40 transition-[background,transform] duration-200 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <span className="spinner" /> : <NextArrow />}
                    {next.label}
                  </button>
                )}

                {/* 완료/취소 상태 — 닫기만 */}
                {!next && !canCancel && (
                  <button
                    onClick={onClose}
                    className="flex-1 h-10 px-4 rounded-md text-[13px] font-medium border-[0.5px] border-border text-ink-sub hover:bg-muted transition-colors"
                  >
                    닫기
                  </button>
                )}

                {/* 삭제 버튼 — 우측 끝 (onDelete 있을 때) */}
                {onDelete && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={isLoading || confirmDelete}
                    className="ml-auto w-9 h-10 flex items-center justify-center rounded-md text-ink-muted hover:text-danger hover:bg-status-cancel-bg disabled:opacity-40 transition-colors shrink-0"
                    aria-label="예약 삭제"
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14">
                      <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────

function InfoSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-[12px] font-medium px-2.5 py-1 rounded-md bg-muted text-ink-sub">
      {children}
    </span>
  );
}

function NextArrow() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13">
      <path d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
