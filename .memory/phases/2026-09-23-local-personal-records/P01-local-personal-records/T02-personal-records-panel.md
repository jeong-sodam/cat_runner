# Task: T02 Personal Records Panel

## Status: done

## Goal

서버 전체 순위표와 독립된 `개인기록표` UI를 추가한다. 로컬 저장소의 최고 기록 5개와 방금 기록을 분리해 보여주고, 각 기록에 순위·점수·거리·정확도·플레이 날짜/시간을 표시한다.

## Decision Summary

- 개인기록표는 로컬 기록만 읽으며 서버 API를 호출하지 않는다.
- 최고 기록 5개는 점수순으로 표에 표시하고 방금 기록은 표와 별도 카드로 항상 표시한다.
- 현재 서버 순위표는 개인기록표에 섞지 않는다.
- 기록 초기화 버튼은 제공하지 않는다.

## Implementation

### I01. 개인기록표 전용 UI 모듈

- Related Files:
  - `public/js/ui/personal-records.js` :: new `createPersonalRecordsPanel`
  - `public/js/ui/leaderboard.js` :: `createLeaderboardPanel`; modify only as needed to keep server leaderboard behavior isolated

#### Details

- **Factory signature**:
  ```js
  createPersonalRecordsPanel(callbacks = {}, options = {}) -> {
    mount(root) -> HTMLElement | null,
    render() -> void,
  }
  ```
- `options` fields:
  - `documentRef`: DOM implementation; default `globalThis.document`
  - `localStore`: object implementing `getLocalScores`, `getLastResult`, and `getLocalRank`
  - `currentResult`: optional just-completed result; takes precedence over persisted `getLastResult()`
- `callbacks` fields:
  - `onBack`: return to the result screen
  - `onRestart`: return to character selection/new local run
- Render a section with class `flow-card wide-card personal-records-screen` and heading `개인기록표`.
- Intro text must make the scope explicit: local personal best top five, not server global ranking.
- Render one local table with exactly these columns:
  - `순위`
  - `점수`
  - `거리`
  - `정확도`
  - `플레이 날짜`
- Rows use `localStore.getLocalScores().slice(0, 5)`. Use text nodes/`textContent`, never HTML interpolation. Format score and distance with Korean locale; format rhythm accuracy as a percentage; format `achievedAt` with Korean date and time.
- Render a separate `.latest-local-result`/current-result block titled `방금 기록`. It must always be visible when a latest result exists, even if that result is not in the top-five rows. Include its computed personal rank, score, distance, accuracy, and date/time.
- Latest rank resolution order:
  1. `currentResult.rank` when it is a finite number.
  2. `localStore.getLocalRank(latest)` when available.
  3. `-` when the record cannot be matched.
- For an empty store, keep the table empty and show a non-error message such as `아직 저장된 개인 기록이 없습니다.`. Do not show server retry controls or call `getLeaderboard`.
- Provide `뒤로` and `캐릭터 선택` actions consistent with the existing leaderboard panel.
- Do not add a delete/reset control.
- Keep `public/js/ui/leaderboard.js` responsible for authenticated/server top-10 rendering. Remove its local tab/personal rendering only if needed by the controller split; do not change its server table fields or retry behavior.

### I02. Personal records rendering tests

- Related Files:
  - `test/app-flow.test.js` :: new personal records panel tests and updates to old local leaderboard expectations; modify

#### Details

- Mount the new panel with a fake document and a store containing six records plus a latest record outside the top five.
- Assert no server client method is called.
- Assert the heading is `개인기록표`, the table has five data rows, and the latest block is rendered separately.
- Assert the latest block contains the outside-top-five rank and the required fields: score, distance, accuracy, and date/time.
- Assert empty local history renders an empty-state message without a retry button.
- Assert all record values are rendered as text so a value containing HTML-like characters is not interpreted as markup.

## Acceptance Criteria

- [ ] 결과에서 진입한 개인기록표가 서버 API 없이 로컬 기록을 표시한다.
- [ ] 최고 기록 5개와 방금 기록이 서로 분리되어 항상 보인다.
- [ ] 방금 기록이 5위 밖이어도 개인 순위가 표시된다.
- [ ] 순위, 점수, 거리, 정확도, 날짜·시간 필드가 표시된다.
- [ ] 빈 기록 상태와 안전한 텍스트 렌더링이 검증된다.

## Validation

- `node --test --test-concurrency=1 test/app-flow.test.js`

## Commit Message

```text
feat(ui): add separate local personal records panel

Plan: 2026-09-23-local-personal-records
Phase: P01-local-personal-records
Task: T02-personal-records-panel

- render local top-five records and the latest result separately
- keep personal records independent from the server leaderboard
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: recorded
