# Task: T02 시각 개선 릴리스 검증

## Status: done

## Goal

전체 테스트와 실제 브라우저 확인으로 일시정지 초기 상태, 한국어 문구, 에셋 프리로드/폴백, 고양이 포즈와 배경 구역 전환이 함께 동작함을 확인하고 재현 가능한 실행·점검 안내를 갱신한다.

## Decision Summary

- 이미지 파일이 없어도 플레이는 가능해야 한다.
- 이번 범위에는 규칙/조작 변경, 사운드 변경, 신규 스테이지, 모바일 전용 조작이 포함되지 않는다.

## Implementation

### I01. 통합 회귀 보강과 실행 안내

- Related Files:
  - `test/audio-pause.test.js` :: initial visibility regression coverage; modify only if gaps remain
  - `test/app-flow.test.js` :: preload/Korean UI/screen transition coverage; modify only if gaps remain
  - `test/render.test.js` :: loaded/fallback scene coverage; modify only if gaps remain
  - `README.md` :: local run and visual acceptance checklist; modify if present, otherwise new

#### Details

- **Execution Flow / Logic**:
  1. Run full tests before adding assertions; add only coverage still missing after P01–P03, avoiding duplicates.
  2. Document exact commands: `npm.cmd install`, `npm.cmd start`, `npm.cmd test`, plus browser URL `http://localhost:3000`.
  3. Include manual checklist: no visible pause modal at fresh run; P toggles it; all UI Korean; each cat has preview; W jump/S slide pose; all three zones differ; blocked image remains playable via fallback.
  4. Do not alter auth/database schemas, game constants, collision/scoring rules or control mappings while verifying.

## Acceptance Criteria

- [x] `npm.cmd test` passes across pause, flow, renderer, game, auth, score and security tests in a clean authentication process.
- [x] Local run documentation/checklist accurately states UI, controls and fallback behavior.
- [x] Server smoke test launches at `http://localhost:3000`; the repeatable browser checklist covers normal and unavailable-image paths.

## Validation

- `npm.cmd test` — complete serial Node test suite passes.
- `npm.cmd start` — server launches for browser smoke test at `http://localhost:3000`.

## Commit Message

```text
docs(test): verify cat runner visual refresh

Plan: 2026-09-22-cat-runner-visual-korean-refresh
Phase: P03-screen-polish-verification
Task: T02-release-verification

- Document local visual acceptance checks and asset fallback behavior
- Close remaining end-to-end regression coverage gaps
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
