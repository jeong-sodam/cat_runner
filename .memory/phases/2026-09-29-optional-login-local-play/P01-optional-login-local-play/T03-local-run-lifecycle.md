# Task: T03 Local Run Lifecycle

## Status: pending

## Goal

Wire local active-run storage into the game lifecycle: save every second and on pagehide, offer explicit resume, restore seed/snapshot, and clear the active run on completion or explicit 새 게임.

## Decision Summary

- Public local starts never call runApiClient.
- Resume is offered from character selection and never silent.
- Completion/discard removes only the active-run record; score history remains.

## Implementation

### I01. Add local snapshot lifecycle hooks

- Related Files:
  - public/js/app/app-controller.js :: createAppController, destroyGame, initializeGame, startGame; modify
  - public/js/app/app-controller.js :: snapshotGameState; reuse

#### Details

- Track active local metadata (runId/catId/seed), last local snapshot elapsed time initialized to -Infinity, and a pagehide handler.
- On fresh local initialization, create metadata and save an initial snapshot through saveLocalRun after state.gameState exists.
- On resumed initialization, preserve supplied seed and assign supplied snapshot fields as the existing restore path does; do not replace them with a fresh seed.
- In onStateChange, for local mode and elapsed difference at least 1000 ms, save mode, runId, catId, seed, version 1, and snapshotGameState; update the marker.
- Register one pagehide save handler and remove it in destroyGame. Preserve the existing server snapshot branch.
- Keep startGame forcing local but preserve seed, snapshot, and resumed options for the resume action; fresh starts pass no stale snapshot.

### I02. Offer and execute local resume/discard

- Related Files:
  - public/js/app/app-controller.js :: showCharacterSelect, showResumePrompt; modify/refactor
  - public/js/app/app-controller.js :: new local resume helper; new

#### Details

- showCharacterSelect({ allowResume = true }) mounts cat selection, then checks localStore.loadLocalRun().
- A candidate displays a modal meaning 이어서 달릴까요? with 이어하기 and 새 게임.
- 이어하기 calls startGame(candidate.catId, { seed, snapshot, resumed: true }) without runApiClient/setupRunSync/userId.
- 새 게임 clears local active state, closes the modal, and re-enters showCharacterSelect({ allowResume: false }).
- Do not use server expiresAt/getResumableRun for local resume; preserve server helper separately if still reachable.

### I03. Clear local state on completion/restart

- Related Files:
  - public/js/app/app-controller.js :: completeGameover; modify local branch
  - public/js/app/app-controller.js :: pause restart callback; modify
  - public/js/app/app-controller.js :: result restart flow; read-only verification

#### Details

- Local completion saves existing result/history records, then clearLocalRun before result display.
- Local result flow keeps personal records and server-leaderboard development notice; no protected API retry.
- Pause restart clears the previous active local record before starting a replacement.
- Keep localStorage memory fallback and warning behavior.

### I04. Add app-flow tests

- Related Files:
  - test/app-flow.test.js :: local lifecycle tests; modify/add

#### Details

- With fake store and deterministic frame clock, test initial save, one save at 1000 ms, no premature second save, pagehide save, resume seed/snapshot restoration, discard without repeated modal, completion clearing, local result persistence, and no server calls.

## Acceptance Criteria

- [ ] Local play creates no server run and saves a resumable record.
- [ ] Snapshots save at the 1-second threshold and on pagehide.
- [ ] Resume/discard choices behave explicitly and correctly.
- [ ] Resume restores seed and snapshot without userId/server calls.
- [ ] Completion/restart clears active state but preserves history.

## Validation

- node --test test/app-flow.test.js test/run-resume.test.js

## Commit Message

    feat(game): persist and resume browser-local runs

    Plan: 2026-09-29-optional-login-local-play
    Phase: P01-optional-login-local-play
    Task: T03-local-run-lifecycle

    - autosave local snapshots and restore them explicitly
    - clear active local state on completion or new game

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
