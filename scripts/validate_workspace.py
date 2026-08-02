#!/usr/bin/env python3
"""GLOBAL.md / skills/*.md의 AUTO-START/AUTO-END 마커 형식을 검사한다.

내용을 판단하거나 수정하지 않는다 — 마커가 짝이 맞는지, 중복/중첩이 없는지만 기계적으로 검사한다.
"""
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TARGET_FILES = [REPO_ROOT / "GLOBAL.md", *sorted((REPO_ROOT / "skills").glob("*.md"))]

MARKER_RE = re.compile(r"<!--\s*AUTO-(START|END):([a-zA-Z0-9_-]+)\s*-->")


def validate_file(path: Path) -> list[str]:
    errors = []
    open_ids: dict[str, int] = {}
    seen_ids: set[str] = set()

    for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        match = MARKER_RE.search(line)
        if not match:
            continue
        kind, marker_id = match.groups()

        if kind == "START":
            if marker_id in open_ids:
                errors.append(f"{lineno}행: '{marker_id}' AUTO-START가 이미 열려있는 상태에서 다시 열림")
            elif marker_id in seen_ids:
                errors.append(f"{lineno}행: '{marker_id}' id가 중복 사용됨")
            else:
                open_ids[marker_id] = lineno
                seen_ids.add(marker_id)
        else:  # END
            if marker_id not in open_ids:
                errors.append(f"{lineno}행: 짝이 없는 AUTO-END:'{marker_id}'")
            else:
                del open_ids[marker_id]

    for marker_id, lineno in open_ids.items():
        errors.append(f"{lineno}행: '{marker_id}' AUTO-START가 닫히지 않음 (AUTO-END 없음)")

    return errors


def main() -> int:
    had_error = False

    for path in TARGET_FILES:
        if not path.exists():
            print(f"⚠️  {path.relative_to(REPO_ROOT)} 없음 — 건너뜀")
            continue

        errors = validate_file(path)
        rel = path.relative_to(REPO_ROOT)
        if errors:
            had_error = True
            print(f"❌ {rel}")
            for err in errors:
                print(f"   - {err}")
        else:
            print(f"✅ {rel}")

    if had_error:
        print("\n검증 실패 — AUTO 마커를 고친 뒤 다시 실행하세요.")
        return 1

    print("\n모든 문서의 AUTO 마커 형식이 정상입니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
