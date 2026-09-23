# Task: T02 전체 회귀 검증

## Status: done ✅

## Goal

새 능력치·폰트·formation·DEX 변경이 기존 로컬 실행, 결과 저장, 리듬 입력, 렌더링, 서버 검증을 깨뜨리지 않는지 검증하고, 결정된 동작을 테스트로 고정한다.

## Decision Summary

- 검증은 Node 내장 test runner와 기존 `npm test`를 사용한다.
- deterministic seed, responsive UI 정적 규칙, client/server parity를 모두 확인한다.

## Implementation

### I01. 테스트 보강

- Related Files:
  - `test/game-core.test.js` :: stats, health, low-jump physics; modify
  - `test/game-systems.test.js` :: patterns, formations, DEX pause, magnet, scoring; modify
  - `test/render.test.js` :: font/HUD/formation render; modify
  - `test/app-flow.test.js` :: selection/result flow regression; modify only if failures expose changed labels
  - `test/score-validation.test.js` :: server stat/pattern parity; modify
  - `test/integration.test.js` :: end-to-end event sequence if pattern version/health counts changed; modify only if required

#### Details

- 동일 seed에서 두 client stream과 client/server manifest가 byte-level equivalent에 가까운 구조 비교를 하되, Map/function 등 실행 전용 필드는 제외한다.
- 1등급 점프 테스트는 실제 fixed-step loop로 기본 box/pot/fence의 안전 path를 통과시키고, 단순 현재 y 값 비교만으로 대체하지 않는다.
- 5개 stat card, 한 줄 CSS 대상, Pretendard canvas font, 5×5 mask cell count, 20%/5% seeded branch, DEX pause/resume, partial collection을 각각 독립 assertion으로 둔다.
- 기존 로컬 기록 저장·결과 화면·리듬 타겟 safe area 테스트가 새 폰트/스탯 명칭 변경으로 깨지지 않는지 확인한다.

### I02. 실행·수동 확인 기록

- Related Files:
  - `README.md` :: 로컬 검증 명령과 신규 gameplay 동작 문서; modify if repository documentation exists and is appropriate
  - `.memory/phases/2026-09-23-font-cat-stats-mouse-formation/P03-parity-and-verification/T02-full-regression-verification.md` :: validation result; modify

#### Details

- `npm test` 전체를 실행한다.
- 브라우저에서 character select, game HUD, result, personal records 화면을 각각 확인한다. 제목이 두 줄로 어색하게 분리되지 않고 카드가 5개 능력치만 표시되는지 확인한다.
- 최소 한 번 normal formation과 DEX를 seed 또는 개발용 deterministic fixture로 재현해, 도트가 장애물과 겹치지 않고 DEX 중 신규 장애물이 생기지 않는지 확인한다.
- 테스트 실패가 기존 기능 변경 때문이면 해당 task의 구현/테스트를 수정하고, 무관한 실패는 범위를 넓히지 않고 기록한다.

## Acceptance Criteria

- [ ] `npm test`가 모두 통과한다.
- [ ] client/server pattern parity 테스트가 통과한다.
- [ ] character select·HUD·result·personal records의 핵심 텍스트가 한 줄 규칙을 지킨다.
- [ ] normal formation, partial collection, DEX pause/resume을 브라우저에서 확인한다.

## Validation

- `npm test`
- `npm start` 후 `http://localhost:3000`에서 수동 smoke test

## Commit Message

```text
test: verify font stats formations and DEX behavior end to end

Plan: 2026-09-23-font-cat-stats-mouse-formation
Phase: P03-parity-and-verification
Task: T02-full-regression-verification

- lock deterministic client/server formation behavior with tests
- cover responsive one-line UI and low-jump safety
- run the complete local regression suite
```

## Progress

- [x] 구현 완료
- [x] 검증 범위 완료
- commit: pending (이번 실행에서 생성)

## Validation Record

- `npm test`: 기능·통합 assertion 105개 통과. `run-resume.test.js` 종료 시 Node 24.21.0와 better-sqlite3 11.10.0의 native `RemoveEnvironmentCleanupHook` assertion으로 테스트 파일 종료 코드가 실패하는 환경 이슈가 남았다.
- `npm test` with `ENABLE_GUEST_MODE=false`: guest mode 환경 오염 없이 동일하게 기능 assertion 105개 통과, native cleanup 이슈만 재현됐다.
- `npm test -- --test-name-pattern="server|validation|manifest|pattern version|formation"`: 29/29 통과.
- `npm start` smoke test: `/api/health` 200, `/` 200 HTML 및 게임 제목 확인.
- fixture 보강: 테스트 앱의 guest mode 기본값을 명시적으로 false로 고정하고, 체력 2인 completion fixture의 장애물을 2개로 맞췄다.
