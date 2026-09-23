# Task: T03 Local Leaderboard Flow

## Status: pending

## Goal

Connect local gameover results and leaderboard navigation so local play persists every latest result, opens the local panel without server calls, and keeps the existing authenticated server leaderboard path available for future deployment.

## Decision Summary

- Source of truth: `.memory/decisions/2026-09-23-local-leaderboard.md`, D01, D04, D05, and D07.
- Local mode is selected from the completed/current run mode; server mode remains the existing API-backed path.
- Latest-result persistence happens on local gameover before rendering the result screen.

## Implementation

### I01. Persist local gameover results and select leaderboard mode

- Related Files:
  - `public/js/app/app-controller.js` :: `showResult`, `showLeaderboard`, `completeGameover` — modify.
  - `public/js/ui/result-screen.js` :: leaderboard callback contract — read-only unless the current-result callback needs an explicit payload.

#### Details

- In the local branch of `completeGameover()`, normalize one record from `completedState` with `score`, `distanceM`, `mouseCount`, `rhythmAccuracy`, `catId`, and `achievedAt`.
- Call `localStore.saveLocalResult(record)` and `localStore.saveLastResult(record)` before `showResult`. Keep `localOnly: true`, `isPersonalBest` derived from whether the saved record is rank 1, and the existing no-server status text.
- `showLeaderboard()` must choose `mode: "local"` and pass `getLocalScores`, `getLastResult`, and `state.lastResult` when the current run is local (or when no authenticated server run is active). In local mode it must not call `setupRunSync()` solely to fetch a leaderboard and must not invoke `runApiClient.getLeaderboard`.
- For server runs, preserve `mode: "server"`, existing `runApiClient`, and authenticated leaderboard behavior.
- `showResult`’s leaderboard action must still open the reused leaderboard screen; current result persistence must survive screen destruction and browser reload.
- Back/restart callbacks must preserve existing behavior, including the gameover-specific resume suppression already implemented.

### I02. Add app-flow regression coverage

- Related Files:
  - `test/app-flow.test.js` :: local leaderboard navigation and result-flow tests — modify/add.
  - `test/run-resume.test.js` :: local store latest-result compatibility — modify only if storage API coverage belongs there.

#### Details

- Simulate a local gameover/result and assert `saveLocalResult` and `saveLastResult` are called, then assert the leaderboard action renders local rows without `getLeaderboard` or `startRun` calls.
- Assert a latest result outside the top five still appears as `방금 기록`.
- Assert server-mode leaderboard still invokes the API client and does not read local entries.
- Preserve the existing gameover auto-save, retry, local-only, and resume-flow assertions.

## Acceptance Criteria

- [ ] Every local gameover persists both ranking data and the latest result.
- [ ] Local leaderboard navigation is offline and server-request free.
- [ ] Server leaderboard behavior remains available for authenticated deployment.
- [ ] The latest result survives reload through local storage.

## Validation

- `npm.cmd test -- test/app-flow.test.js test/run-resume.test.js` — local result, leaderboard routing, and sync compatibility pass; isolate run-resume local-store tests if Windows SQLite cleanup aborts.
- `git diff --check`

## Commit Message

```text
feat(app): route local results to personal leaderboard

Plan: 2026-09-23-local-leaderboard
Phase: P01-local-leaderboard-and-rhythm-ease
Task: T03-local-leaderboard-flow

- Persist latest local results during gameover
- Keep local leaderboard navigation offline
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
