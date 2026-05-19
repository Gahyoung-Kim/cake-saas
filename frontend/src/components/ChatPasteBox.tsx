interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function ChatPasteBox({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink-sub">원본 메시지</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-caption text-ink-muted hover:text-ink transition-colors"
          >
            비우기
          </button>
        )}
      </div>
      <textarea
        rows={12}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`카카오톡, 인스타그램 DM 채팅 내용을 여기에 붙여넣으세요\n\n예시) 안녕하세요! 다음 주 토요일 오후 2시 픽업으로 딸기 생크림 케이크 6호 부탁드려요 :)`}
        className="bg-bg border-[0.5px] border-border rounded-lg px-4 py-3 text-[13px] text-ink outline-none resize-y leading-relaxed placeholder:text-ink-muted focus:border-primary focus:shadow-[0_0_0_3px_rgba(200,145,122,0.18)] transition-[border-color,box-shadow] duration-200 font-ko"
      />
      <div className="text-caption text-ink-muted text-right">
        {value.length.toLocaleString('ko-KR')}자 · 개인정보는 추출 직후 자동 마스킹됩니다.
      </div>
    </div>
  );
}
