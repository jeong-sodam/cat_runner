# Task: T03 Result Flow and Buttons

## Status: done

## Goal

게임오버 즉시 로컬 기록을 저장하고, 결과 화면에서 `개인기록표`와 서버용 `순위표`를 별도 버튼으로 제공한다. 로컬 결과는 더 이상 “순위표 미등록”으로 표시하지 않으며, 저장 성공 여부와 개인 순위를 사용자에게 보여준다.

## Decision Summary

- 로컬 게임오버 시 `saveLocalResult`와 `saveLastResult`를 즉시 호출한다.
- `개인기록표`는 새 로컬 패널로 이동한다.
- `순위표`는 로컬 모드에서 서버 API를 호출하지 않고 “서버 순위표는 준비 중입니다” 안내를 표시한다.
- 서버 모드의 기존 전체 순위표 호출은 보존한다.

## Implementation

### I01. Result screen action split and local status

- Related Files:
  - `public/js/ui/result-screen.js` :: `createResultScreen`; modify
  - `test/app-flow.test.js` :: result action/status tests; modify

#### Details

- Extend callbacks without breaking existing callers:
  ```js
  createResultScreen(result, {
    onPersonalRecords,
    onLeaderboard,
    onRestart,
    onRetry,
  }, options)
  ```
- For local results (`result.localOnly === true`), render two distinct buttons:
  - `개인기록표`: calls `onPersonalRecords`
  - `순위표`: calls `onLeaderboard`
- The local `순위표` button must look unavailable and expose `aria-disabled="true"`, but remain event-capable so the controller can show the preparation message selected in the decisions. Do not use native `disabled` if that would suppress the click callback.
- For server results, preserve the existing server `순위표` action and add/use `개인기록표` only where the controller supplies it; no server API is allowed from the personal-records callback.
- Replace the local badge text `로컬 플레이 · 순위표 미등록` with a saved-state-aware label such as:
  - saved: `로컬 플레이 · 개인기록표 저장`
  - failed: `로컬 플레이 · 저장 실패`
- Local saved status must say `개인기록표에 저장되었습니다.`. If `result.saved === false`, show a clear local-storage failure message and do not offer server retry.
- When `result.rank` is finite, show `개인 순위: N위`; do not label it as a server ranking.
- Keep server save retry behavior unchanged for non-local results.

### I02. Controller routing and gameover persistence

- Related Files:
  - `public/js/app/app-controller.js` :: `SCREEN_NAMES`, `showResult`, `showLeaderboard`, new `showPersonalRecords`, new local server-notice helper, `completeGameover`; modify
  - `test/app-flow.test.js` :: local gameover and navigation tests; modify

#### Details

- Add `SCREEN_NAMES.PERSONAL_RECORDS = "personal-records"` so the two destinations are state-distinguishable. Keep `SCREEN_NAMES.LEADERBOARD` for server leaderboard.
- Add `showPersonalRecords()`:
  1. Call `destroyGame()`, set the personal-records screen, and show the root.
  2. Resolve the local store via existing `getLocalRunStore()`.
  3. Mount `createPersonalRecordsPanel` with `currentResult: state.lastResult`.
  4. Wire `onBack` to the current result screen and `onRestart` to `showCharacterSelect({ allowResume: false })` for local mode.
- Keep `showLeaderboard()` as the server leaderboard route. If invoked from a local result, do not call `runApiClient.getLeaderboard`; instead show an inline/result notice `서버 순위표는 준비 중입니다.` and remain on the result screen (or return to it after the notice is rendered).
- In `showResult(result)`, pass `onPersonalRecords: () => showPersonalRecords()` and make the local `onLeaderboard` callback use the no-server notice. The authenticated/server path continues to call the server leaderboard.
- In `completeGameover()` local branch:
  1. Build the normalized local record with score, distance, mouse count, rhythm accuracy, cat ID, and `Date.now()` achieved timestamp.
  2. Call `saveLocalResult(record)` exactly once.
  3. Call `saveLastResult(record)` exactly once so the latest result survives navigation and reload.
  4. Set result fields from the storage result: `saved`, `rank`, `isPersonalBest: rank === 1`, `localOnly: true`, and `catId`/`achievedAt` for the personal panel.
  5. Use a success message only when storage succeeds; otherwise expose a local save failure message.
  6. Always release `completionInProgress` and avoid server sync calls.
- The controller must pass the actual injected `localRunStore` in tests and default to `createLocalRunStore()` in production.

### I03. End-to-end flow tests

- Related Files:
  - `test/app-flow.test.js` :: local gameover flow, result buttons, personal-records state, server isolation; modify/add

#### Details

- Simulate a local gameover with an injected store and assert:
  - `saveLocalResult` and `saveLastResult` each run once.
  - result screen reports saved local status and the calculated personal rank.
  - `개인기록표` opens `SCREEN_NAMES.PERSONAL_RECORDS` and renders local records.
  - `순위표` on a local result does not call `getLeaderboard` and shows the server-preparation notice.
- Simulate a local result whose rank is outside the top five and assert the result/personal panel preserves that rank.
- Assert the server result route still opens `SCREEN_NAMES.LEADERBOARD` and can call the API as before.
- Assert the local result no longer contains `순위표 미등록` or a message claiming that local records are not registered.
- Assert a storage failure produces a failure status without showing a server retry button.

## Acceptance Criteria

- [ ] 게임오버 즉시 로컬 기록과 최근 기록이 자동 저장된다.
- [ ] 결과 화면에 `개인기록표`와 `순위표`가 별도 표시된다.
- [ ] `개인기록표`는 개인 기록 화면으로 이동한다.
- [ ] 로컬 `순위표`는 서버 호출 없이 준비 중 안내를 표시한다.
- [ ] 로컬 결과에 저장 성공 여부와 전체 개인 순위가 표시된다.
- [ ] 기존 서버 순위표 흐름이 회귀하지 않는다.

## Validation

- `node --test --test-concurrency=1 test/app-flow.test.js`
- `node --test --test-concurrency=1`

## Commit Message

```text
feat(flow): separate local personal records from server leaderboard

Plan: 2026-09-23-local-personal-records
Phase: P01-local-personal-records
Task: T03-result-flow-and-buttons

- save local gameover results with a personal rank
- route personal records and server leaderboard through separate actions
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: recorded
