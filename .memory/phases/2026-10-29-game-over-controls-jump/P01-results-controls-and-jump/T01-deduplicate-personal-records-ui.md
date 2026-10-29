# Task: T01 Deduplicate Personal Records UI

## Status: done

## Goal
After a run, keep the result details and offer exactly `캐릭터 선택` and `내 기록`; remove the duplicate `개인기록표` screen without deleting browser-local score data or changing the retained `내 기록` screen.

## Decision Summary
- `personal-records.js` and its navigation are duplicate UI and will be removed. `leaderboard.js` remains the single score-history UI.
- Keep score-saving, last-result storage, local ranking, game-over statistics, and the route back from `내 기록` to the result screen.

## Implementation

### I01. Remove the duplicate screen and route game-over navigation through My Records

- Related Files:
  - `public/js/app/app-controller.js` :: `SCREEN_NAMES`, `showResult`, `showPersonalRecords`, `showLeaderboard`, `completeGameover` — remove the duplicate screen route and copy; modify
  - `public/js/ui/personal-records.js` :: `createPersonalRecordsPanel` — duplicate personal-score table; delete
  - `public/js/ui/result-screen.js` :: `createResultScreen` — retain result data and exactly two navigation actions; modify
  - `public/js/ui/leaderboard.js` :: `createLeaderboardPanel`, `renderRows`, `renderCurrentResult` — retained `내 기록` score history and preserved rhythm metrics; modify
  - `public/styles.css` :: `.leaderboard-table` and narrow-screen rules — existing responsive wrapping for table columns; read-only
  - `public/js/sync/local-run-store.js` :: browser score history persistence — preserve unchanged; read-only

#### Details
- **Signatures & Types**:
  ```javascript
  function showResult(result)
  function showLeaderboard()
  function createResultScreen(result = {}, callbacks = {}, options = {})
  function createLeaderboardPanel(callbacks = {}, options = {})
  ```
- **Data & Schema Fields**:
  - Preserve the current result object fields consumed by the result page: `score`, `distanceM`, `mouseCount`, `rhythmAccuracy`, `rhythmMultiplier`, `saved`, `persisted`, `storageWarning`, `rank`, `isPersonalBest`, `localOnly`, `catId`, `achievedAt`, and `errorMessage`.
  - Do not change local score-record schema or localStorage keys. The retained `내 기록` panel continues to read `getLocalScores()`, `getLastResult()`, and the current result from the existing local store.
  - Each score entry uses `rhythmAccuracy: number` in the 0–1 display range and `rhythmMultiplier: number` formatted as an `x` multiplier. `normalizeScoreRecord()` already defaults invalid/missing accuracy to `0` and derives missing multiplier as `0.5 + clampedAccuracy`; preserve that behavior.
- **Execution Flow / Logic**:
  1. Remove the `createPersonalRecordsPanel` import, `SCREEN_NAMES.PERSONAL_RECORDS`, `showPersonalRecords()`, and the `onPersonalRecords` callback from `public/js/app/app-controller.js`.
  2. Keep `showResult()`'s `onRestart` callback for `캐릭터 선택` and `onLeaderboard` callback for `내 기록`. Keep `showLeaderboard()` and its `onBack` callback so the `뒤로` button returns to the just-finished result, and keep `onRestart` so the records page can also return to cat selection.
  3. In the retained `내 기록` table, add columns `정확도` and `정확도 보정` after distance and before achievement date. Render accuracy as a rounded percentage clamped to 0–100, and render the multiplier as `x` plus two decimals (for example `x0.75`). Apply the same formatting to the `방금 기록` summary. Implement formatting in `leaderboard.js` so it no longer needs the module that is being deleted.
  4. Delete `public/js/ui/personal-records.js`; do not delete `local-run-store.js` or any score data.
  5. In `createResultScreen`, keep the badge, heading, score/distance/mouse/accuracy statistics, save status, and optional rank. Render exactly two buttons in this order: `캐릭터 선택`, then `내 기록`. Remove conditional `개인기록표` button creation and `onPersonalRecords` handling.
  6. Replace user-facing `개인기록표` save text in `result-screen.js` and the `completeGameover()` fallback error string in `app-controller.js` with `내 기록` wording. Use these states: success `내 기록에 저장되었습니다.`, personal best `개인 최고 기록! 내 기록에 저장되었습니다.`, and failure `내 기록에 저장하지 못했습니다. 브라우저 저장소를 확인해주세요.` Keep session-only storage warning semantics unchanged.
  7. In `test/app-flow.test.js`, remove tests that directly import/render the deleted `createPersonalRecordsPanel`; retain equivalent top-five/empty-state coverage through the `내 기록` leaderboard tests. Update leaderboard assertions to verify both rhythm fields in table rows and the latest-result summary, including percentage clamping and `x0.00` multiplier formatting. Update game-over flow coverage to open `내 기록` directly from the result and verify the leaderboard route and back-to-result behavior. For session-only storage, assert the warning remains on the result screen before navigating to `내 기록`; then verify saved rows and the latest result there. Update result-screen callback coverage to expect exactly two buttons and no personal-record callback.
- **Error & Exception Handling**: Saving failures and in-memory-only storage warnings must still appear on the game-over result. Removing the duplicate screen must not throw if there are no score entries or no last result.
- **State Transition & Return**: `RESULT -> LEADERBOARD` occurs through `내 기록`; `LEADERBOARD -> RESULT` occurs through `뒤로`; `RESULT` or `LEADERBOARD -> CHARACTER_SELECT` occurs through `캐릭터 선택`.

### I02. Verify no duplicate personal-record UI remains

- Related Files:
  - `test/app-flow.test.js` :: game-over and leaderboard integration tests — modify

#### Details
- Assert result screen has exactly two buttons with exact labels and contains no `개인기록표` page/button text.
- Assert score history remains after a game-over save and `내 기록` still renders the top five rows and current result, including accuracy and multiplier.
- Assert `뒤로` returns to `SCREEN_NAMES.RESULT`; `캐릭터 선택` still returns to character selection.
- Assert empty records still render the existing safe empty state without a retry action or error.

## Acceptance Criteria
- [x] Game-over result shows exactly `캐릭터 선택` and `내 기록` actions.
- [x] No `PERSONAL_RECORDS` screen, `createPersonalRecordsPanel` import, or `personal-records.js` remains.
- [x] Browser-local score history, game-over score summary, save failure, and session-storage warning behavior remain intact.
- [x] `내 기록` retains its table and empty state, displays accuracy and multiplier, and supports back-to-result and character-selection behavior.

## Validation
- `npm.cmd test` — all app-flow, local-store, and result-screen tests pass; expect no import of the deleted personal-records module.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
refactor(ui): remove duplicate personal records screen

Plan: 2026-10-29-game-over-controls-jump
Phase: P01-results-controls-and-jump
Task: T01-deduplicate-personal-records-ui

- Keep My Records as the single score-history screen
- Limit game-over actions to character selection and My Records
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 (`npm.cmd test`: 109/109; `git diff --check`; duplicate-screen reference scan)
- commit: `e6f6c49`
