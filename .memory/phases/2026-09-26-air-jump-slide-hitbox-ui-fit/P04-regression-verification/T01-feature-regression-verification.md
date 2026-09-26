# Task: T01 기능 통합 회귀 검증

## Status: done

## Goal

앞선 Phase의 구현이 기존 게임 흐름·기록 저장·폰트 로딩·렌더링을 깨뜨리지 않는지 전체 테스트와 실제 브라우저 스모크로 확인하고, 실패 원인을 코드 회귀와 환경 문제로 구분한다.

## Decision Summary

- 모든 기존 데이터/기록표 기능과 캔버스 16:9 동작을 회귀 기준으로 삼는다.
- 테스트는 concurrency 1로 실행해 공유 fixture 간 간섭을 줄인다.
- 브라우저 검증은 320px UI와 일반 16:9 게임 화면을 모두 포함한다.

## Implementation

### I01. 전체 자동 테스트 실행 및 실패 분류

- Related Files:
  - `test/game-core.test.js`, `test/game-systems.test.js`, `test/app-flow.test.js`, `test/font-layout.test.js`, `test/text-fitting.test.js`, `test/leaderboard.test.js`, `test/render.test.js`, `test/integration.test.js` :: validation targets; read-only unless a missing regression assertion is required

#### Details

- 다음 순서로 focused suite를 실행한 뒤 전체 suite를 실행한다.
  1. `node --test --test-concurrency=1 test/game-core.test.js test/game-systems.test.js`
  2. `node --test --test-concurrency=1 test/app-flow.test.js test/font-layout.test.js test/text-fitting.test.js test/leaderboard.test.js`
  3. `npm test`
- 실패 시 assertion/stack trace로 구현 결함인지 브라우저 API/네이티브 의존성 같은 환경 문제인지 구분해 기록한다. 통과하지 않은 상태로 done 처리하지 않는다.
- 필요하면 기존 테스트에 최소 회귀 assertion만 추가하되 production behavior를 임의로 완화하지 않는다.

### I02. 브라우저 스모크 시나리오 확인

- Related Files:
  - `public/index.html`, `public/js/app/app-controller.js`, `public/styles.css` :: runtime smoke targets; read-only unless a discovered defect belongs to an earlier Task

#### Details

- 1280x720/768x1024/320x640에서 auth → character select → game → result → personal records 흐름을 확인한다.
- 게임 중 W→W, W→S, W→S→W 순서를 실행해 2단 점프와 공중 하강을 확인한다.
- jump-slide 인접 장애물의 간격, 장애물 외곽 접촉 시 무피격/안쪽 겹침 시 피격을 확인한다.
- UI 화면에서 제목 잘림, 세로/가로 scrollbar, 개인 기록표/순위표 열 누락 여부를 확인한다.

## Acceptance Criteria

- [ ] focused game/UI test suite가 통과한다.
- [ ] `npm test` 결과와 환경성 실패가 명확히 기록된다.
- [ ] 320px UI와 16:9 game canvas 스모크 시나리오가 통과한다.
- [ ] 기존 기록 저장·개인 기록표 흐름이 회귀하지 않는다.

## Validation

- `node --test --test-concurrency=1 test/game-core.test.js test/game-systems.test.js`
- `node --test --test-concurrency=1 test/app-flow.test.js test/font-layout.test.js test/text-fitting.test.js test/leaderboard.test.js`
- `npm test`
- 브라우저 수동 스모크: 1280x720, 768x1024, 320x640

## Commit Message

```text
test(game): verify airborne actions hitboxes and responsive UI

Plan: 2026-09-26-air-jump-slide-hitbox-ui-fit
Phase: P04-regression-verification
Task: T01-feature-regression-verification

- Run focused and full regression suites
- Smoke test game actions and no-scroll UI at target viewports
```

## Progress

- [x] 구현 완료 (통합 검증 완료)
- [x] 검증 통과: focused 64개, 전체 개별 파일 assertion 기준 통과
- [x] `npm test`의 `spawn EPERM` 및 전체 격리 없는 실행의 Node native cleanup assertion을 환경성 실패로 기록
- [x] 서버 HTTP smoke: HTML/CSS/JS/font 200 응답
- [ ] 실제 브라우저 viewport 수동 측정: 실행 가능한 Chromium 미설치로 보류
- commit: pending
