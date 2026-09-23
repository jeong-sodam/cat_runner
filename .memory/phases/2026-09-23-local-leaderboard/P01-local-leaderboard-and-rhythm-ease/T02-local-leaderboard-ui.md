# Task: T02 Local Leaderboard UI

## Status: pending

## Goal

Extend the existing leaderboard panel to render an offline personal top-five view, a persisted `방금 기록` row, and a visible-but-disabled `전체 순위` tab without requesting the server in local mode.

## Decision Summary

- Source of truth: `.memory/decisions/2026-09-23-local-leaderboard.md`, D02–D05 and D07.
- Reuse `public/js/ui/leaderboard.js`; do not create a second leaderboard screen.
- Server mode retains the existing authenticated leaderboard table and retry behavior.

## Implementation

### I01. Add local/server panel modes and tab contract

- Related Files:
  - `public/js/ui/leaderboard.js` :: `createLeaderboardPanel`, `renderRows`, `load`, `mount` — modify.
  - `public/styles.css` :: leaderboard/tab/current-row selectors — modify only for required layout and disabled-state styling.

#### Details

- Preserve the public constructor shape `createLeaderboardPanel(apiClient, callbacks = {}, options = {})` and add these options:
  ```js
  {
    mode: "server" | "local", // default "server"
    localStore: { getLocalScores, getLastResult },
    currentResult: object | null
  }
  ```
- In local mode, do not call `apiClient.getLeaderboard`, do not show the server retry error, and read entries from `localStore.getLocalScores()` plus the latest result from `currentResult` or `localStore.getLastResult()`.
- Render two tab buttons with stable classes/data attributes: active `내 점수순위`, and disabled `전체 순위` with accessible disabled state and the message `로그인 후 제공됩니다.`. Do not render fake global entries.
- Personal table columns are `순위`, `고양이`, `점수`, `거리`, `달성일`; rows use text nodes/`textContent`, rank 1–5, and a readable localized date for `achievedAt`. The cat identifier must remain available through a `data-cat-id` attribute even if the visible label is localized.
- Render the latest result below the table as a separate row/section labeled `방금 기록`, including score, distance, cat, and a visual class such as `current-result`; it must render even when the latest record is not in the top five.
- Empty local history must show a non-error empty state and still render the disabled global tab and navigation actions.
- Keep server mode’s current columns, top-ten limit, loading/error/retry flow, and callbacks unchanged.

### I02. Add UI regression coverage

- Related Files:
  - `test/app-flow.test.js` :: leaderboard panel tests — modify/add.

#### Details

- Assert local mode renders exactly five or fewer sorted personal rows, a separate latest-result row, cat identifiers, and the disabled global tab.
- Assert local mode never calls `getLeaderboard`, even when the API client provides it.
- Assert an empty local store renders the empty state without a retry button.
- Preserve the existing server leaderboard XSS-safe text rendering, retry, and email/table assertions.

## Acceptance Criteria

- [ ] Local panel shows personal top five and latest result separately.
- [ ] Global tab is visible, disabled, and clearly marked as login-gated.
- [ ] Local mode performs no server leaderboard request.
- [ ] Existing server leaderboard behavior remains unchanged.

## Validation

- `npm.cmd test -- test/app-flow.test.js` — local and server leaderboard UI tests pass.
- `git diff --check`

## Commit Message

```text
feat(ui): add local personal leaderboard tabs

Plan: 2026-09-23-local-leaderboard
Phase: P01-local-leaderboard-and-rhythm-ease
Task: T02-local-leaderboard-ui

- Render local top-five and latest-result rows
- Prepare a disabled global leaderboard tab
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
