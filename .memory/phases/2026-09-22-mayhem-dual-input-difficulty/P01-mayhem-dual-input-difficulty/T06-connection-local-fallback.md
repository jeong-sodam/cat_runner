# Task: T06 서버 선연결과 명시적 로컬 fallback

## Status: done

## Goal

게임 화면을 먼저 띄운 뒤 `startRun` 실패를 offline으로 오인해 배너를 띄우던 흐름을 바꾼다. authenticated run은 서버 run 생성이 성공한 뒤에만 시작하고, 실패 시 안전한 오류·재시도·사용자 선택 로컬 플레이를 제공한다. 로컬 플레이는 서버 동기화·랭킹 저장을 만들지 않고 기기 내 최고 기록만 저장한다.

## Decision Summary

- 서버 연결은 게임 시작 전 확인한다. 실패 시 자동 로컬 전환이나 무한 자동 재시도는 하지 않는다.
- 사용자가 `로컬 플레이`를 직접 선택한 경우만 local mode로 시작한다. 결과는 localStorage 최고 기록에만 반영하고 `로컬 플레이 — 서버 랭킹에 저장되지 않음` 배지를 표시한다.
- 오류 화면에는 안전한 사용자 메시지와 재시도/local 버튼을 표시하고, 개발 로그에는 HTTP status와 server error code를 기록한다.

## Implementation

### I01. Start gate and run mode state

- Related Files:
  - `public/js/app/app-controller.js` :: `startGame`, `setupRunSync`, `completeGameover`, reconnect/error helpers; modify
  - `public/js/sync/run-sync.js` :: `startRun`, state helpers; modify only for explicit mode/state compatibility
  - `public/js/sync/run-api-client.js` :: request error mapping; modify

#### Details

- Split current `startGame` into a server-gated flow and a pure game initializer. For authenticated users, call `runSync.startRun({ userId, catId, snapshot })` before creating/starting the game loop. Do not show the game screen or emit gameplay events until the request succeeds.
- On start failure, map the error to a safe message (network, auth, invalid cat, server failure), call `console.error`/injected logger with `{ status, code }` and no secret/request body, and render a retry/local choice modal in the character/game shell.
- Retry repeats the server start gate. Local action calls the pure initializer with `runMode: "local"`, does not instantiate `runSync` event recording/network monitor for that run, and shows the local badge. Server-backed mode continues to use existing snapshots/events/reconnect behavior after start.
- On gameover, branch `completeGameover`: server mode uses the existing flush/complete endpoint; local mode updates local best and shows result with `saved: false`, `localOnly: true`, `errorMessage` describing ranking exclusion. Never call `/api/runs/:id/complete` for local runs.
- Preserve resume/abandon behavior for server runs. A failed server start must not leave an active local-run record that can be mistaken for a resumable server run.

### I02. Local best-record storage and UI contract

- Related Files:
  - `public/js/sync/local-run-store.js` :: `LOCAL_RUN_KEY`, storage helpers; add local-best key/API without breaking active-run API
  - `public/js/ui/result-screen.js` :: result status and local-only badge; modify
  - `public/styles.css` :: `.reconnect-banner`, result/local classes; modify

#### Details

- Add `LOCAL_BEST_KEY = "cat-runner:local-best"` and `getLocalBest`, `saveLocalBest`, `clearLocalBest` (or equivalent names). Stored record contains `{ score, distanceM, mouseCount, rhythmAccuracy, catId, achievedAt }`; only replace when score is higher, then distance, then earlier achievedAt.
- Local result must clearly expose `saved: false`, `localOnly: true`, `isPersonalBest`, and never expose a rank. Existing server unsaved result retry behavior remains available only for server-mode completion failures.
- Add a non-obscuring local-mode badge to the game/result view. Reconnect banner remains for a server run that goes offline after start; it is not used to represent an initial start failure.

### I03. Connection/fallback tests

- Related Files:
  - `test/app-flow.test.js` :: start gate, retry/local choice, Mayhem error path; modify
  - `test/run-resume.test.js` :: server run sync compatibility/local mode; modify
  - `test/render.test.js` or `test/game-core.test.js` :: local badge/result rendering; modify if needed

#### Details

- Use injected API clients and fake DOM to assert a successful server start creates the game only after `startRun` resolves.
- Assert a rejected start does not start the loop, exposes safe error text plus retry/local actions, and logs only status/code through an injected logger.
- Assert local mode never calls `startRun`, `appendEvents`, `saveSnapshot`, or `completeRun`, writes local best, marks result local-only, and does not appear in leaderboard payloads.
- Preserve existing online/offline resume tests and document the known better-sqlite3 cleanup abort if the full run-resume file still aborts after assertions.

## Acceptance Criteria

- [x] Authenticated games start only after a successful server run creation or explicit local choice.
- [x] Initial server errors show safe retry/local actions and diagnostic status/code logging.
- [x] Local mode has a visible badge, stores local best only, and never submits a leaderboard result.
- [x] Existing server reconnect/resume behavior remains intact.

## Validation

- `npm.cmd test -- test/app-flow.test.js test/run-resume.test.js test/render.test.js`

## Commit Message

```text
feat(sync): gate runs behind connection and add local fallback

Plan: 2026-09-22-mayhem-dual-input-difficulty
Phase: P01-mayhem-dual-input-difficulty
Task: T06-connection-local-fallback

- Start authenticated runs only after server confirmation
- Add explicit local-only play and local best records
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending

## Execution Record

- Start gate, safe failure modal, explicit local mode, local-best storage, and local-only result rendering implemented.
- Validation passed separately: `npm.cmd test -- test/app-flow.test.js test/render.test.js` (28 tests) and `npm.cmd test -- test/run-resume.test.js` (8 tests).
- The exact combined command reaches 28 passing assertions before a known Windows Node native cleanup abort; no assertion fails in the isolated run-resume file.
