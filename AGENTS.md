# AGENTS.md

이 저장소에서 작업하는 모든 AI 에이전트(Codex, Claude Code 등)를 위한 진입점 문서입니다.
이 파일 자체는 거의 바뀌지 않습니다 — 실제 규칙과 상태는 아래 문서들이 source of truth입니다.

## 먼저 읽을 것
1. **[CLAUDE.md](./CLAUDE.md)** — 프로젝트 규칙 (기술 스택, 코딩 규칙, 디자인 시스템, 절대 하지 말 것)
2. **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** — 제품 철학과 우선순위
3. **[GLOBAL.md](./GLOBAL.md)** — 지금 이 프로젝트의 상태 (최근 작업 / 현재 스프린트 / 다음 우선순위)
4. **[skills/](./skills/)** — 이 프로젝트에서 축적된 작업 노하우
   - `skills/project.md` — 전체 프로젝트 결정, 반복된 실수, 규칙 변경
   - `skills/frontend.md` — 프론트엔드 패턴 (컴포넌트, 라우트, UI)
   - `skills/backend.md` — 백엔드/DB 패턴 (API, 모델, 마이그레이션)

## 작업 종료 시 규칙 (AI Workspace 컨벤션)
작업을 마칠 때마다 다음을 직접 수행합니다. 별도의 자동화 스크립트가 대신 써주지 않습니다 — git diff를 이해하고 있는 에이전트가 직접 요약해서 씁니다.

1. `GLOBAL.md`의 AUTO 영역(`Recent Work`, `Current Sprint`, `Next Priorities`, `Last Updated`)을 이번 작업 내용으로 갱신한다.
2. 이번 작업이 프론트/백엔드/전체 결정 중 어디에 해당하는지에 따라, 관련 `skills/*.md`의 AUTO 영역에 배운 패턴이나 결정을 짧게 추가한다.
3. `<!-- AUTO-START:... -->` ~ `<!-- AUTO-END:... -->` 마커 **바깥**의, 사람이 직접 쓴 내용은 절대 수정하지 않는다.
4. `python3 scripts/validate_workspace.py`를 실행해 마커 형식이 깨지지 않았는지 확인한다.
5. 커밋은 사람이 리뷰한 뒤 진행한다 — 자동 커밋하지 않는다.

## 하지 말 것
- 이 컨벤션을 위한 새로운 판단/자동화 스크립트를 추가하지 않는다 (Validator 하나로 충분). 문서 내용 작성은 에이전트가 직접 판단해서 쓴다.
- README, CLAUDE.md, PROJECT_CONTEXT.md를 자동으로 수정하지 않는다.
- CI, GitHub Action, 문서 자동 생성 도구를 추가하지 않는다.
